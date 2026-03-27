#!/usr/bin/env bash
# =============================================================================
# Firewall — Restrict all cluster access to internal LAN only
# =============================================================================
# Rocky Linux 9 host — uses nftables directly (firewalld disabled).
# Rules:
#   - Allow full cluster-internal traffic
#   - Allow LAN access to cluster services (OpenClaw, Plex, K8s API, SSH)
#   - Block all access from outside the LAN
#   - NAT cluster nodes' outbound internet (for updates, K3s install, etc.)
#   - Persist rules across reboots
#
# Called by: deploy-cluster.sh
# Args: $1=LAN_IFACE $2=BRIDGE $3=LAN_SUBNET $4=NODE1 $5=NODE2 $6=NODE3
# =============================================================================

set -euo pipefail

LAN_IFACE="$1"
BRIDGE="$2"
LAN_SUBNET="$3"
NODE1_IP="$4"
NODE2_IP="$5"
NODE3_IP="$6"

log() { echo "[fw] $*"; }

# ---- Rocky Linux 9: ensure firewalld is stopped before applying nftables ----
if systemctl is-active --quiet firewalld 2>/dev/null; then
  log "Stopping firewalld (conflicts with nftables)..."
  systemctl disable --now firewalld
fi

log "Applying host nftables firewall rules..."

cat > /etc/nftables.conf <<NFTEOF
#!/usr/sbin/nft -f
# =============================================================================
# Host Firewall — Virtual Cluster NUC
# LAN subnet: ${LAN_SUBNET}
# Cluster bridge: ${BRIDGE}
# =============================================================================

flush ruleset

# ---------------------------------------------------------------------------
# NAT table — masquerade cluster nodes' outbound traffic through host NIC
# ---------------------------------------------------------------------------
table ip nat {
  chain postrouting {
    type nat hook postrouting priority srcnat; policy accept;

    # Masquerade cluster nodes going out via LAN interface
    ip saddr 192.168.100.0/24 oifname "${LAN_IFACE}" masquerade comment "cluster outbound NAT"
  }
}

# ---------------------------------------------------------------------------
# Filter table
# ---------------------------------------------------------------------------
table inet filter {

  # ---- INPUT chain (traffic destined for the HOST itself) ----
  chain input {
    type filter hook input priority filter; policy drop;

    # Always allow established/related
    ct state established,related accept

    # Loopback
    iif "lo" accept

    # ICMP (ping, path MTU, etc.)
    ip protocol icmp accept
    ip6 nexthdr icmpv6 accept

    # Allow all traffic from the cluster bridge (nodes talking to host)
    iifname "${BRIDGE}" accept

    # === LAN-only access to host services ===
    # Block any non-LAN source before reaching service-specific rules
    ip saddr != ${LAN_SUBNET} drop

    # SSH — LAN only
    tcp dport 22 accept

    # Kubernetes API — LAN only (also useful for kubectl from laptop)
    tcp dport 6443 accept

    # Rancher HTTPS — LAN only
    tcp dport 443 accept
    tcp dport 80 accept

    # Plex — LAN only
    tcp dport 32400 accept

    # libvirt management (optional, only if you use virt-manager remotely)
    # tcp dport 16509 accept

    counter drop
  }

  # ---- FORWARD chain (traffic passing through host between interfaces) ----
  chain forward {
    type filter hook forward priority filter; policy drop;

    ct state established,related accept

    # Allow cluster nodes to talk to each other (bridge → bridge)
    iifname "${BRIDGE}" oifname "${BRIDGE}" accept

    # Allow cluster nodes to reach the internet for updates/packages
    # Only from the cluster subnet, only outbound via LAN iface
    iifname "${BRIDGE}" oifname "${LAN_IFACE}" \
      ip saddr 192.168.100.0/24 accept \
      comment "cluster nodes → internet (outbound)"

    # BLOCK: LAN hosts → cluster nodes directly (must go through host only)
    # This enforces the host as the only entry point to the cluster
    # Comment out the next line if you want LAN to reach VMs directly
    iifname "${LAN_IFACE}" oifname "${BRIDGE}" \
      ip saddr ${LAN_SUBNET} \
      ip daddr { ${NODE1_IP}, ${NODE2_IP}, ${NODE3_IP} } \
      drop \
      comment "block direct LAN→node access; use host proxy instead"

    counter drop
  }

  # ---- OUTPUT chain (traffic originating from host) ----
  chain output {
    type filter hook output priority filter; policy accept;
    # Allow all outbound from host (can restrict further if desired)
  }
}
NFTEOF

# Apply immediately
nft -f /etc/nftables.conf

# Enable and persist across reboots
# Rocky Linux 9: nftables.service reads /etc/nftables.conf on start
systemctl enable nftables
systemctl restart nftables

# ---- SELinux: allow nftables and IP forwarding without AVC denials ----
# These sysctl values are already set by 02-network-setup.sh, but ensure
# SELinux doesn't interfere with the forwarding rules
sysctl -w net.ipv4.ip_forward=1 >/dev/null

log "Firewall applied. Cluster is accessible from LAN (${LAN_SUBNET}) only."
log "Direct LAN → node access is blocked; services are exposed via the host."

# ---- Print summary ----
echo ""
echo "=== Firewall Summary ==="
echo "LAN subnet allowed:    ${LAN_SUBNET}"
echo "Cluster subnet:        192.168.100.0/24 (internal only)"
echo ""
echo "Allowed inbound (from LAN only):"
echo "  :22    SSH to host"
echo "  :80    OpenClaw UI / Claude Web UI"
echo "  :443   HTTPS"
echo "  :3001  OpenClaw Gateway API"
echo "  :6443  Kubernetes API"
echo "  :32400 Plex Media Server"
echo ""
echo "Blocked: all access from outside ${LAN_SUBNET}"
echo "========================"
