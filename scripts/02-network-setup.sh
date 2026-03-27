#!/usr/bin/env bash
# =============================================================================
# Network Setup — Isolated cluster bridge + routing
# =============================================================================
# Creates an isolated virtual bridge (virbr-k3s) for the 3-node cluster.
# Nodes can reach each other and the host, but are NOT reachable from outside
# the LAN. External internet access is masqueraded through the host NIC.
#
# Called by: deploy-cluster.sh
# Args: $1=LAN_IFACE $2=BRIDGE $3=CLUSTER_NET $4=LAN_SUBNET
#       $5=NODE1_IP $6=NODE2_IP $7=NODE3_IP
# =============================================================================

set -euo pipefail

LAN_IFACE="$1"
BRIDGE="$2"
CLUSTER_NET="$3"     # e.g. 192.168.100
LAN_SUBNET="$4"
NODE1_IP="$5"
NODE2_IP="$6"
NODE3_IP="$7"

BRIDGE_IP="${CLUSTER_NET}.1"
BRIDGE_CIDR="${BRIDGE_IP}/24"
NETMASK="255.255.255.0"
DHCP_START="${CLUSTER_NET}.50"
DHCP_END="${CLUSTER_NET}.200"

log() { echo "[net] $*"; }

# ---- 1. Create virtual bridge via libvirt XML ----
log "Defining isolated network bridge: ${BRIDGE}"

cat > /tmp/cluster-net.xml <<XML
<network>
  <name>cluster-net</name>
  <uuid/>
  <forward mode='nat'>
    <nat>
      <port start='1024' end='65535'/>
    </nat>
  </forward>
  <bridge name='${BRIDGE}' stp='on' delay='0'/>
  <mac address='52:54:00:ab:cd:01'/>
  <ip address='${BRIDGE_IP}' netmask='${NETMASK}'>
    <dhcp>
      <range start='${DHCP_START}' end='${DHCP_END}'/>
      <!-- Static leases for cluster nodes -->
      <host mac='52:54:00:aa:bb:10' name='node1' ip='${NODE1_IP}'/>
      <host mac='52:54:00:aa:bb:11' name='node2' ip='${NODE2_IP}'/>
      <host mac='52:54:00:aa:bb:20' name='node3' ip='${NODE3_IP}'/>
    </dhcp>
  </ip>
</network>
XML

# Destroy existing definition if present
if virsh net-info cluster-net &>/dev/null; then
  log "Removing existing cluster-net definition..."
  virsh net-destroy cluster-net 2>/dev/null || true
  virsh net-undefine cluster-net 2>/dev/null || true
fi

virsh net-define /tmp/cluster-net.xml
virsh net-autostart cluster-net
virsh net-start cluster-net
log "Bridge ${BRIDGE} (${BRIDGE_IP}/24) is up."

# ---- 2. Enable IP forwarding ----
log "Enabling IP forwarding..."
sysctl -w net.ipv4.ip_forward=1
grep -q "^net.ipv4.ip_forward" /etc/sysctl.conf \
  && sed -i 's/^net.ipv4.ip_forward.*/net.ipv4.ip_forward=1/' /etc/sysctl.conf \
  || echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf

# ---- 3. Add /etc/hosts entries for convenience ----
log "Adding /etc/hosts entries for cluster nodes..."
for entry in "node1:${NODE1_IP}" "node2:${NODE2_IP}" "node3:${NODE3_IP}"; do
  hostname="${entry%%:*}"
  ip="${entry##*:}"
  # Remove old entry if present
  sed -i "/[[:space:]]${hostname}$/d" /etc/hosts
  echo "${ip}    ${hostname}" >> /etc/hosts
done

log "Network setup complete. Bridge: ${BRIDGE} | Subnet: ${CLUSTER_NET}.0/24"
