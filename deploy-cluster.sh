#!/usr/bin/env bash
# =============================================================================
# Virtual 3-Node K3s Cluster — Full Deployment Orchestrator
# =============================================================================
# Stack:
#   Host OS     : Rocky Linux 9       (SELinux enforcing, KVM hypervisor)
#   Hypervisor  : KVM/QEMU + libvirt
#   VM Guest OS : Ubuntu 22.04 LTS    (each VM via cloud-init)
#   Cluster     : K3s (lightweight Kubernetes) — 1 server + 2 agents
#   AI Agents   : OpenClaw + Claude API
#   Media       : Plex Media Server
#   Network     : Isolated bridge (192.168.100.0/24), internal LAN only
#   Security    : SELinux enforcing, nftables, SSH key-only, K8s NetworkPolicy
#
# Usage:
#   sudo ./deploy-cluster.sh [--dry-run] [--skip-prereqs] [--skip-vms]
#
# Requirements:
#   - Rocky Linux 9 host (fresh minimal install)
#   - 16 GB RAM minimum (32 GB recommended)
#   - 150 GB free disk space
#   - KVM-capable CPU (check: grep -cP '(vmx|svm)' /proc/cpuinfo)
#   - Internal LAN interface (set LAN_IFACE below)
# =============================================================================

set -euo pipefail
IFS=$'\n\t'

# ---------------------------------------------------------------------------
# USER-CONFIGURABLE VARIABLES — edit before first run
# ---------------------------------------------------------------------------

## Network
LAN_IFACE="eth0"            # Your physical NIC connected to internal LAN
                             # Find yours: ip -o link show | awk '{print $2}'
LAN_SUBNET="192.168.1.0/24" # Your home/office LAN subnet

CLUSTER_BRIDGE="virbr-k3s"  # Virtual bridge name for the cluster
CLUSTER_NET="192.168.100"    # First 3 octets of cluster network
CLUSTER_GW="${CLUSTER_NET}.1"

## VM IPs (static, on cluster network)
NODE1_IP="${CLUSTER_NET}.10"   # K3s server (master)
NODE2_IP="${CLUSTER_NET}.11"   # K3s agent 1
NODE3_IP="${CLUSTER_NET}.20"   # K3s agent 2

## VM sizing (adjust for your RAM/CPU budget)
NODE1_RAM=4096   # MB — server node needs slightly more
NODE1_CPU=2
NODE1_DISK=40    # GB

NODE2_RAM=3072
NODE2_CPU=2
NODE2_DISK=30

NODE3_RAM=3072
NODE3_CPU=2
NODE3_DISK=30

## OS image
UBUNTU_URL="https://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64.img"
IMAGE_DIR="/var/lib/libvirt/images"
BASE_IMAGE="${IMAGE_DIR}/ubuntu-22.04-base.img"

## SSH — generate with: ssh-keygen -t ed25519 -f ~/.ssh/k3s_cluster
SSH_KEY_FILE="$HOME/.ssh/k3s_cluster"
SSH_PUB_KEY=""    # Auto-populated from SSH_KEY_FILE; or paste your own here

## Plex claim token — get yours (free) at https://plex.tv/claim
PLEX_CLAIM="claim-REPLACEME"

## Plex media path on the HOST — mounted into the Plex container
PLEX_MEDIA_HOST_PATH="/mnt/media"   # Create this dir and put your media in it
PLEX_CONFIG_HOST_PATH="/mnt/plex-config"

## Anthropic API key for OpenClaw + Claude agents
## Get yours at https://console.anthropic.com/
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}"   # Can also set in shell: export ANTHROPIC_API_KEY=sk-ant-...

# ---------------------------------------------------------------------------
# INTERNAL VARIABLES — do not change
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/cluster-deploy.log"
K3S_TOKEN_FILE="/tmp/k3s-node-token"
DRY_RUN=false
SKIP_PREREQS=false
SKIP_VMS=false

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
BLUE='\033[0;34m'; BOLD='\033[1m'; RESET='\033[0m'

# ---------------------------------------------------------------------------
# ARGUMENT PARSING
# ---------------------------------------------------------------------------
for arg in "$@"; do
  case $arg in
    --dry-run)      DRY_RUN=true ;;
    --skip-prereqs) SKIP_PREREQS=true ;;
    --skip-vms)     SKIP_VMS=true ;;
  esac
done

# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------
log()   { echo -e "${GREEN}[$(date '+%H:%M:%S')] $*${RESET}" | tee -a "$LOG_FILE"; }
warn()  { echo -e "${YELLOW}[WARN] $*${RESET}" | tee -a "$LOG_FILE"; }
error() { echo -e "${RED}[ERROR] $*${RESET}" | tee -a "$LOG_FILE"; exit 1; }
step()  { echo -e "\n${BOLD}${BLUE}▶ $*${RESET}\n" | tee -a "$LOG_FILE"; }
run()   { $DRY_RUN && echo "[DRY] $*" || eval "$@"; }

require_root() {
  [[ $EUID -eq 0 ]] || error "This script must be run as root (sudo)."
}

check_kvm() {
  local count
  count=$(grep -cP '(vmx|svm)' /proc/cpuinfo 2>/dev/null || echo 0)
  [[ $count -gt 0 ]] || error "KVM not supported on this CPU. Check BIOS virtualization settings."
  log "KVM supported: $count vCPU thread(s) with virtualization extensions."
}

check_selinux() {
  local mode
  mode=$(getenforce 2>/dev/null || echo "Disabled")
  if [[ "$mode" == "Disabled" ]]; then
    error "SELinux is Disabled. Rocky Linux 9 requires SELinux enforcing. Check /etc/selinux/config."
  elif [[ "$mode" == "Permissive" ]]; then
    warn "SELinux is Permissive. Setting to Enforcing..."
    run setenforce 1
    run sed -i 's/^SELINUX=permissive/SELINUX=enforcing/' /etc/selinux/config
  fi
  log "SELinux mode: $(getenforce)"
}

wait_for_ssh() {
  local ip="$1" label="$2" retries=30
  log "Waiting for SSH on ${label} (${ip})..."
  for i in $(seq 1 $retries); do
    ssh -o StrictHostKeyChecking=no \
        -o ConnectTimeout=5 \
        -i "${SSH_KEY_FILE}" \
        "ubuntu@${ip}" true 2>/dev/null && return 0
    sleep 10
  done
  error "Timed out waiting for SSH on ${label}"
}

vm_run() {
  local ip="$1"; shift
  ssh -o StrictHostKeyChecking=no \
      -o ConnectTimeout=10 \
      -i "${SSH_KEY_FILE}" \
      "ubuntu@${ip}" "$@"
}

vm_sudo() {
  local ip="$1"; shift
  vm_run "$ip" sudo bash -c "'$*'"
}

# ---------------------------------------------------------------------------
# STAGE 0 — PREFLIGHT
# ---------------------------------------------------------------------------
preflight() {
  step "Preflight checks"
  require_root
  check_kvm
  check_selinux

  # Verify Rocky Linux 9
  if [[ -f /etc/rocky-release ]]; then
    local ver
    ver=$(grep -oP '\d+' /etc/rocky-release | head -1)
    [[ "$ver" == "9" ]] || warn "Expected Rocky Linux 9, got version ${ver}. Proceeding anyway."
    log "Host OS: $(cat /etc/rocky-release)"
  else
    warn "Rocky Linux not detected. This script is tuned for Rocky Linux 9."
  fi

  [[ -f "${SSH_KEY_FILE}" ]] || {
    log "Generating SSH keypair at ${SSH_KEY_FILE}..."
    run ssh-keygen -t ed25519 -N "" -f "${SSH_KEY_FILE}"
  }
  SSH_PUB_KEY="$(cat "${SSH_KEY_FILE}.pub")"
  log "SSH public key loaded."

  [[ "$PLEX_CLAIM" == "claim-REPLACEME" ]] && \
    warn "PLEX_CLAIM is not set. Plex will start but require manual claim at first launch."

  mkdir -p "$PLEX_MEDIA_HOST_PATH" "$PLEX_CONFIG_HOST_PATH"
  touch "$LOG_FILE"
  log "Preflight passed."
}

# ---------------------------------------------------------------------------
# STAGE 1 — PREREQUISITES
# ---------------------------------------------------------------------------
install_prereqs() {
  $SKIP_PREREQS && { log "Skipping prereqs (--skip-prereqs)"; return; }
  step "Installing host prerequisites (Rocky Linux 9)"

  # ---- System update ----
  run dnf update -y -q

  # ---- EPEL (needed for genisoimage, cloud-utils, nmap-ncat) ----
  run dnf install -y -q epel-release
  run dnf config-manager --set-enabled crb   # CodeReady Builder — some deps need this

  # ---- Virtualization group + extras ----
  # "@virtualization" installs: qemu-kvm, libvirt, libvirt-client, virt-install, bridge-utils
  run dnf groupinstall -y "Virtualization Host"
  run dnf install -y -q \
    genisoimage \
    cloud-utils \
    curl wget git jq \
    nftables \
    nmap-ncat \
    openssl \
    policycoreutils-python-utils \
    libguestfs-tools \
    2>/dev/null

  # ---- Disable firewalld — we manage rules with nftables directly ----
  if systemctl is-active --quiet firewalld; then
    log "Disabling firewalld (replaced by nftables)..."
    run systemctl disable --now firewalld
  fi
  run systemctl enable --now nftables

  # ---- Enable and start libvirtd ----
  run systemctl enable --now libvirtd
  run usermod -aG libvirt,kvm "${SUDO_USER:-$USER}"

  # ---- SELinux: set required booleans for KVM/libvirt ----
  log "Configuring SELinux booleans for libvirt/KVM..."
  run setsebool -P virt_use_nfs 1           # allow VMs to use NFS storage
  run setsebool -P virt_use_samba 1         # allow VMs to use Samba
  run setsebool -P virt_sandbox_use_all_caps 1
  run setsebool -P domain_can_mmap_files 1  # needed for some K3s CNI operations

  # ---- SELinux: label custom media paths so libvirt/containers can access them ----
  log "Setting SELinux file contexts for media and config paths..."
  run mkdir -p "$PLEX_MEDIA_HOST_PATH" "$PLEX_CONFIG_HOST_PATH"
  run semanage fcontext -a -t virt_image_t "${PLEX_MEDIA_HOST_PATH}(/.*)?" 2>/dev/null || \
    semanage fcontext -m -t virt_image_t "${PLEX_MEDIA_HOST_PATH}(/.*)?";
  run semanage fcontext -a -t virt_image_t "${PLEX_CONFIG_HOST_PATH}(/.*)?" 2>/dev/null || \
    semanage fcontext -m -t virt_image_t "${PLEX_CONFIG_HOST_PATH}(/.*)?";
  run restorecon -Rv "$PLEX_MEDIA_HOST_PATH" "$PLEX_CONFIG_HOST_PATH"

  # ---- SELinux: ensure libvirt image dir has correct context ----
  run restorecon -Rv "$IMAGE_DIR"

  # ---- Download Ubuntu 22.04 cloud image for VMs ----
  if [[ ! -f "$BASE_IMAGE" ]]; then
    log "Downloading Ubuntu 22.04 cloud image..."
    run wget -q --show-progress -O "$BASE_IMAGE" "$UBUNTU_URL"
    # Restore SELinux context on the downloaded image
    run restorecon "$BASE_IMAGE"
  else
    log "Base image already exists: $BASE_IMAGE"
  fi

  log "Prerequisites installed."
}

# ---------------------------------------------------------------------------
# STAGE 2 — NETWORK
# ---------------------------------------------------------------------------
setup_network() {
  step "Setting up isolated cluster network bridge"
  run "${SCRIPT_DIR}/scripts/02-network-setup.sh" \
    "$LAN_IFACE" "$CLUSTER_BRIDGE" "$CLUSTER_NET" "$LAN_SUBNET" \
    "$NODE1_IP" "$NODE2_IP" "$NODE3_IP"
  log "Network configured."
}

# ---------------------------------------------------------------------------
# STAGE 3 — CREATE VMs
# ---------------------------------------------------------------------------
create_vms() {
  $SKIP_VMS && { log "Skipping VM creation (--skip-vms)"; return; }
  step "Creating virtual machines"
  run "${SCRIPT_DIR}/scripts/03-create-vms.sh" \
    "$IMAGE_DIR" "$BASE_IMAGE" "$CLUSTER_BRIDGE" \
    "$NODE1_IP" "$NODE2_IP" "$NODE3_IP" \
    "$NODE1_RAM" "$NODE1_CPU" "$NODE1_DISK" \
    "$NODE2_RAM" "$NODE2_CPU" "$NODE2_DISK" \
    "$NODE3_RAM" "$NODE3_CPU" "$NODE3_DISK" \
    "$SSH_PUB_KEY" "$CLUSTER_GW" "$CLUSTER_NET"
  log "VMs created."
}

# ---------------------------------------------------------------------------
# STAGE 4 — K3s CLUSTER
# ---------------------------------------------------------------------------
setup_k3s() {
  step "Deploying K3s cluster"

  wait_for_ssh "$NODE1_IP" "node1 (server)"
  wait_for_ssh "$NODE2_IP" "node2 (agent)"
  wait_for_ssh "$NODE3_IP" "node3 (agent)"

  # Install K3s server on node1
  log "Installing K3s server on node1 (${NODE1_IP})..."
  vm_run "$NODE1_IP" \
    "curl -sfL https://get.k3s.io | \
     INSTALL_K3S_EXEC='server \
       --disable traefik \
       --disable servicelb \
       --node-name node1 \
       --advertise-address ${NODE1_IP} \
       --bind-address 0.0.0.0 \
       --tls-san ${NODE1_IP}' \
     sh -"

  # Fetch join token
  log "Fetching cluster join token..."
  local token
  token=$(vm_run "$NODE1_IP" "sudo cat /var/lib/rancher/k3s/server/node-token")
  echo "$token" > "$K3S_TOKEN_FILE"

  # Install K3s agents
  for node_ip in "$NODE2_IP" "$NODE3_IP"; do
    local node_name="node$(echo "$node_ip" | awk -F. '{print $4}')"
    log "Installing K3s agent on ${node_ip} (${node_name})..."
    vm_run "$node_ip" \
      "curl -sfL https://get.k3s.io | \
       K3S_URL='https://${NODE1_IP}:6443' \
       K3S_TOKEN='${token}' \
       INSTALL_K3S_EXEC='agent --node-name ${node_name}' \
       sh -"
  done

  # Copy kubeconfig to host
  log "Fetching kubeconfig..."
  local kubeconf_dir="$HOME/.kube"
  mkdir -p "$kubeconf_dir"
  vm_run "$NODE1_IP" "sudo cat /etc/rancher/k3s/k3s.yaml" \
    | sed "s/127.0.0.1/${NODE1_IP}/g" \
    > "${kubeconf_dir}/config"
  chmod 600 "${kubeconf_dir}/config"
  export KUBECONFIG="${kubeconf_dir}/config"

  # Wait for all nodes to be Ready
  log "Waiting for all cluster nodes to be Ready..."
  local retries=30
  for i in $(seq 1 $retries); do
    local ready
    ready=$(kubectl get nodes --no-headers 2>/dev/null | grep -c " Ready" || echo 0)
    [[ $ready -ge 3 ]] && { log "All 3 nodes are Ready."; return 0; }
    log "  ${ready}/3 ready... (attempt ${i}/${retries})"
    sleep 15
  done
  error "Timed out waiting for cluster nodes."
}

# ---------------------------------------------------------------------------
# STAGE 5 — SERVICES (Rancher + Plex)
# ---------------------------------------------------------------------------
deploy_services() {
  step "Deploying cluster services"
  export KUBECONFIG="$HOME/.kube/config"

  # Install Helm
  if ! command -v helm &>/dev/null; then
    log "Installing Helm..."
    run curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
  fi

  # Apply namespaces + network policies
  log "Applying namespaces and network policies..."
  run kubectl apply -f "${SCRIPT_DIR}/manifests/namespaces.yaml"
  run kubectl apply -f "${SCRIPT_DIR}/manifests/network-policies.yaml"

  # Deploy cert-manager (required by Rancher)
  log "Deploying cert-manager..."
  run kubectl apply -f \
    "https://github.com/cert-manager/cert-manager/releases/download/v1.14.5/cert-manager.yaml"
  run kubectl rollout status deployment/cert-manager -n cert-manager --timeout=300s

  # Deploy MetalLB (load balancer for bare-metal/KVM)
  log "Deploying MetalLB..."
  run kubectl apply -f \
    "https://raw.githubusercontent.com/metallb/metallb/v0.14.5/config/manifests/metallb-native.yaml"
  sleep 20
  run kubectl apply -f "${SCRIPT_DIR}/manifests/metallb-config.yaml"

  # Deploy OpenClaw (AI agent platform — connected to Claude API)
  log "Deploying OpenClaw AI agent platform..."
  log "  Creating OpenClaw secrets..."
  kubectl create namespace openclaw --dry-run=client -o yaml | kubectl apply -f -
  if ! kubectl get secret openclaw-secrets -n openclaw &>/dev/null; then
    # Generate a random gateway secret automatically
    local openclaw_secret
    openclaw_secret=$(openssl rand -hex 32)
    run kubectl create secret generic openclaw-secrets \
      --namespace openclaw \
      --from-literal=ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-REPLACE_ME_sk-ant-xxx}" \
      --from-literal=OPENCLAW_SECRET="${openclaw_secret}"
    log "  OpenClaw secrets created."
    [[ "${ANTHROPIC_API_KEY:-}" == "" ]] && \
      warn "ANTHROPIC_API_KEY not set in environment. Patch the secret after deploy:"
      warn "  kubectl patch secret openclaw-secrets -n openclaw \\"
      warn "    --type='json' -p='[{\"op\":\"replace\",\"path\":\"/data/ANTHROPIC_API_KEY\",\"value\":\"BASE64_KEY\"}]'"
  fi
  run kubectl apply -f "${SCRIPT_DIR}/manifests/openclaw.yaml"

  # Deploy Claude Agents API + Open WebUI
  log "Deploying Claude agent API and Web UI..."
  if ! kubectl get secret claude-api-secret -n claude-agents &>/dev/null; then
    run kubectl create secret generic claude-api-secret \
      --namespace claude-agents \
      --from-literal=ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-REPLACE_ME_sk-ant-xxx}"
  fi
  run kubectl apply -f "${SCRIPT_DIR}/manifests/claude-agents.yaml"

  # Deploy Plex
  log "Deploying Plex Media Server..."
  run kubectl apply -f "${SCRIPT_DIR}/manifests/plex.yaml"

  log "Services deployed."
}

# ---------------------------------------------------------------------------
# STAGE 6 — FIREWALL
# ---------------------------------------------------------------------------
setup_firewall() {
  step "Configuring firewall (internal LAN only)"
  run "${SCRIPT_DIR}/scripts/06-firewall.sh" \
    "$LAN_IFACE" "$CLUSTER_BRIDGE" "$LAN_SUBNET" \
    "$NODE1_IP" "$NODE2_IP" "$NODE3_IP"
  log "Firewall configured."
}

# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------
main() {
  echo ""
  echo -e "${BOLD}${BLUE}╔══════════════════════════════════════════════════════╗"
  echo -e "║   Virtual 3-Node K3s Cluster — NUC Home Lab           ║"
  echo -e "╚══════════════════════════════════════════════════════╝${RESET}"
  echo ""
  $DRY_RUN && warn "DRY RUN MODE — no changes will be made."
  echo ""

  preflight
  install_prereqs
  setup_network
  create_vms
  setup_k3s
  deploy_services
  setup_firewall

  echo ""
  echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════╗"
  echo -e "║   Deployment Complete!                                ║"
  echo -e "╚══════════════════════════════════════════════════════╝${RESET}"
  echo ""
  echo -e "  ${BOLD}OpenClaw (AI agents):${RESET} http://192.168.100.32"
  echo -e "  ${BOLD}OpenClaw Gateway API:${RESET} http://192.168.100.32:3001"
  echo -e "  ${BOLD}Claude Agent Web UI:${RESET} http://192.168.100.31"
  echo -e "  ${BOLD}Plex Media Server:${RESET}   http://192.168.100.30:32400/web"
  echo -e "  ${BOLD}Kubernetes API:${RESET}      https://${NODE1_IP}:6443"
  echo ""
  echo -e "  ${BOLD}SSH to nodes:${RESET}"
  echo -e "    Node 1 (server): ssh -i ~/.ssh/k3s_cluster ubuntu@${NODE1_IP}"
  echo -e "    Node 2 (agent):  ssh -i ~/.ssh/k3s_cluster ubuntu@${NODE2_IP}"
  echo -e "    Node 3 (agent):  ssh -i ~/.ssh/k3s_cluster ubuntu@${NODE3_IP}"
  echo ""
  echo -e "  ${BOLD}Kubectl:${RESET}  export KUBECONFIG=~/.kube/config"
  echo -e "            kubectl get nodes"
  echo ""
  echo -e "  ${YELLOW}All services are restricted to LAN subnet: ${LAN_SUBNET}${RESET}"
  echo ""
}

main
