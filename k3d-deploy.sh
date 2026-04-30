#!/usr/bin/env bash
# =============================================================================
# TradeBase — Local k3d Deploy
# Creates a single-node k3s cluster in Docker, builds the app image,
# and deploys the full stack (Postgres + TradeBase app + migrations).
#
# Prerequisites (run install-k8s-stack.sh first, then log out/in):
#   docker, k3d, kubectl
#
# Usage:
#   bash k3d-deploy.sh          # full deploy
#   bash k3d-deploy.sh --reset  # destroy cluster and redeploy fresh
# =============================================================================
set -euo pipefail

CLUSTER="tradebase"
IMAGE="tradebase:local"
MIGRATOR_IMAGE="tradebase:migrator"
NS="tradebase"
PORT=3000        # host port
NODE_PORT=30080  # NodePort in the k8s service

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; BOLD='\033[1m'; RESET='\033[0m'
log()  { echo -e "${GREEN}[$(date '+%H:%M:%S')]${RESET} $*"; }
step() { echo -e "\n${BOLD}${BLUE}▶ $*${RESET}"; }
warn() { echo -e "${YELLOW}[warn]${RESET} $*"; }

# ── Check prerequisites ───────────────────────────────────────────────────────
check_prereqs() {
  local missing=()
  for cmd in docker k3d kubectl; do
    command -v "$cmd" &>/dev/null || missing+=("$cmd")
  done
  if [[ ${#missing[@]} -gt 0 ]]; then
    echo "Missing tools: ${missing[*]}"
    echo "Run:  sudo bash /home/joe/Desktop/cod/install-k8s-stack.sh"
    echo "Then log out and back in (or: newgrp docker), then re-run this script."
    exit 1
  fi
  if ! docker info &>/dev/null; then
    echo "Docker daemon not accessible. Try: newgrp docker"
    exit 1
  fi
}

# ── Optional reset ────────────────────────────────────────────────────────────
if [[ "${1:-}" == "--reset" ]]; then
  warn "Deleting existing cluster '${CLUSTER}' (--reset)..."
  k3d cluster delete "$CLUSTER" 2>/dev/null || true
fi

check_prereqs
cd "$(dirname "${BASH_SOURCE[0]}")"

# ── Create cluster if it doesn't exist ───────────────────────────────────────
step "Cluster"
if k3d cluster list | grep -q "^${CLUSTER}"; then
  log "Cluster '${CLUSTER}' already exists — skipping create."
else
  log "Creating k3d cluster '${CLUSTER}' (1 agent, host port ${PORT} → NodePort ${NODE_PORT})..."
  k3d cluster create "$CLUSTER" \
    --port "${PORT}:${NODE_PORT}@loadbalancer" \
    --agents 1 \
    --wait
  log "Cluster ready."
fi

# Point kubectl at this cluster
export KUBECONFIG="$(k3d kubeconfig write "$CLUSTER" 2>/dev/null)"
log "KUBECONFIG set to: $KUBECONFIG"

# ── Build Docker image ────────────────────────────────────────────────────────
step "Docker image"
log "Building ${IMAGE} (production) and ${MIGRATOR_IMAGE} (migrator) — ~2-3 min first run..."
docker build --target runner   -t "$IMAGE"          .
docker build --target migrator -t "$MIGRATOR_IMAGE" .
log "Images built."

# ── Import images into k3d ────────────────────────────────────────────────────
step "Image import"
log "Importing images into cluster '${CLUSTER}'..."
k3d image import "$IMAGE" "$MIGRATOR_IMAGE" -c "$CLUSTER"
log "Images imported."

# ── Deploy manifests ──────────────────────────────────────────────────────────
step "Kubernetes manifests"
log "Applying namespace..."
kubectl apply -f manifests/tradebase/00-namespace.yaml

log "Applying Postgres..."
kubectl apply -f manifests/tradebase/01-postgres.yaml

log "Applying app secrets..."
kubectl apply -f manifests/tradebase/02-secret.yaml

log "Waiting for Postgres to be ready..."
kubectl rollout status deployment/postgres -n "$NS" --timeout=120s

# Run migration job
log "Applying migration job..."
# Delete old job if it exists (jobs are immutable once complete)
kubectl delete job tradebase-migrate -n "$NS" 2>/dev/null || true
kubectl apply -f manifests/tradebase/03-migrate-job.yaml

log "Waiting for migration to complete (up to 3 min)..."
kubectl wait --for=condition=complete job/tradebase-migrate -n "$NS" --timeout=180s \
  && log "Migrations done." \
  || { warn "Migration job didn't complete — check logs:"; \
       kubectl logs -l job-name=tradebase-migrate -n "$NS" --tail=40; }

log "Applying app deployment..."
kubectl apply -f manifests/tradebase/04-app.yaml

# ── Wait for app ──────────────────────────────────────────────────────────────
step "Waiting for app to be ready"
kubectl rollout status deployment/tradebase -n "$NS" --timeout=180s

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════╗"
echo -e "║   TradeBase is running!                      ║"
echo -e "╚══════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  ${BOLD}URL:${RESET}        http://localhost:${PORT}"
echo -e "  ${BOLD}Dashboard:${RESET}  http://localhost:${PORT}/dashboard"
echo ""
echo -e "  ${BOLD}Demo logins:${RESET}"
echo -e "    Admin:      admin@tradebase.co     / admin123"
echo -e "    Manager:    marcus@tradebase.co    / manager123"
echo -e "    Dispatcher: grace@tradebase.co     / dispatch123"
echo -e "    Tech:       carlos@tradebase.co    / tech123"
echo ""
echo -e "  ${BOLD}Cluster commands:${RESET}"
echo -e "    kubectl get pods -n tradebase"
echo -e "    kubectl logs -f deploy/tradebase -n tradebase"
echo -e "    k3d cluster delete ${CLUSTER}    # tear everything down"
echo ""
echo -e "  ${BOLD}KUBECONFIG:${RESET} ${KUBECONFIG}"
echo ""

# Open browser if xdg-open is available
if command -v xdg-open &>/dev/null; then
  sleep 2
  xdg-open "http://localhost:${PORT}/dashboard" &>/dev/null &
fi
