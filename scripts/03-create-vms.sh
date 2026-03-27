#!/usr/bin/env bash
# =============================================================================
# VM Creation — 3 Ubuntu 22.04 VMs via cloud-init + virt-install
# =============================================================================
# Creates three QEMU/KVM virtual machines with static IPs, SSH key injection,
# and fully automated first-boot configuration.
#
# Called by: deploy-cluster.sh
# =============================================================================

set -euo pipefail

IMAGE_DIR="$1"
BASE_IMAGE="$2"
BRIDGE="$3"
NODE1_IP="$4"
NODE2_IP="$5"
NODE3_IP="$6"
NODE1_RAM="$7"; NODE1_CPU="$8";  NODE1_DISK="$9"
NODE2_RAM="${10}"; NODE2_CPU="${11}"; NODE2_DISK="${12}"
NODE3_RAM="${13}"; NODE3_CPU="${14}"; NODE3_DISK="${15}"
SSH_PUB_KEY="${16}"
CLUSTER_GW="${17}"
CLUSTER_NET="${18}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CIDATA_DIR="/tmp/cidata"

log() { echo "[vms] $*"; }

# ---- Helper: build a disk image from the base cloud image ----
create_disk() {
  local name="$1" size_gb="$2"
  local disk="${IMAGE_DIR}/${name}.qcow2"
  if [[ -f "$disk" ]]; then
    log "Disk ${disk} already exists, skipping."
  else
    log "Creating ${size_gb}GB disk for ${name}..."
    qemu-img create -f qcow2 -F qcow2 -b "$BASE_IMAGE" "$disk" "${size_gb}G"
  fi
  echo "$disk"
}

# ---- Helper: build cloud-init ISO ----
create_cidata_iso() {
  local node_name="$1"
  local node_ip="$2"
  local mac="$3"
  local out_dir="${CIDATA_DIR}/${node_name}"
  local iso="${IMAGE_DIR}/${node_name}-cidata.iso"

  mkdir -p "$out_dir"

  # meta-data
  cat > "${out_dir}/meta-data" <<META
instance-id: ${node_name}
local-hostname: ${node_name}
META

  # user-data
  cat > "${out_dir}/user-data" <<USERDATA
#cloud-config
hostname: ${node_name}
fqdn: ${node_name}.cluster.local
manage_etc_hosts: true

users:
  - name: ubuntu
    sudo: ALL=(ALL) NOPASSWD:ALL
    groups: [sudo, docker]
    shell: /bin/bash
    ssh_authorized_keys:
      - ${SSH_PUB_KEY}

# Disable password auth — SSH key only
ssh_pwauth: false

# Packages installed on every node
packages:
  - curl
  - wget
  - git
  - htop
  - iotop
  - nfs-common
  - open-iscsi
  - nftables
  - jq

package_update: true
package_upgrade: true

# Static IP via netplan
write_files:
  - path: /etc/netplan/00-cluster.yaml
    content: |
      network:
        version: 2
        ethernets:
          enp1s0:
            dhcp4: false
            addresses: [${node_ip}/24]
            gateway4: ${CLUSTER_GW}
            nameservers:
              addresses: [1.1.1.1, 8.8.8.8]
            dhcp6: false

  # Harden SSH
  - path: /etc/ssh/sshd_config.d/99-harden.conf
    content: |
      PasswordAuthentication no
      PermitRootLogin no
      PubkeyAuthentication yes
      ChallengeResponseAuthentication no
      X11Forwarding no
      AllowTcpForwarding yes
      MaxAuthTries 3
      LoginGraceTime 20

  # Basic node-level firewall (nftables) — allow cluster internal + SSH from LAN
  - path: /etc/nftables.conf
    content: |
      #!/usr/sbin/nft -f
      flush ruleset

      table inet filter {
        chain input {
          type filter hook input priority 0; policy drop;

          # Allow established/related
          ct state established,related accept

          # Allow loopback
          iif "lo" accept

          # Allow ICMP
          ip protocol icmp accept
          ip6 nexthdr icmpv6 accept

          # Allow SSH (key-only, hardened above)
          tcp dport 22 accept

          # Allow all cluster-internal traffic
          ip saddr ${CLUSTER_NET}.0/24 accept

          # Drop everything else
          counter drop
        }

        chain forward {
          type filter hook forward priority 0; policy drop;
        }

        chain output {
          type filter hook output priority 0; policy accept;
        }
      }

runcmd:
  - netplan apply
  - systemctl enable nftables
  - systemctl start nftables
  - systemctl restart sshd
  - echo "Cloud-init complete: ${node_name} @ ${node_ip}" > /etc/cluster-node-info

final_message: "Node ${node_name} is ready. SSH: ubuntu@${node_ip}"
USERDATA

  # Build ISO
  genisoimage -output "$iso" \
    -volid cidata \
    -joliet -rock \
    "${out_dir}/user-data" \
    "${out_dir}/meta-data" 2>/dev/null

  echo "$iso"
}

# ---- Helper: create and start a VM ----
create_vm() {
  local name="$1" ip="$2" mac="$3"
  local ram="$4" cpu="$5" disk_gb="$6"

  # Skip if VM already exists
  if virsh dominfo "$name" &>/dev/null; then
    log "VM ${name} already exists, skipping creation."
    return 0
  fi

  local disk
  disk=$(create_disk "$name" "$disk_gb")
  local iso
  iso=$(create_cidata_iso "$name" "$ip" "$mac")

  log "Creating VM: ${name} | IP: ${ip} | RAM: ${ram}MB | CPU: ${cpu} | Disk: ${disk_gb}GB"

  virt-install \
    --name "$name" \
    --ram "$ram" \
    --vcpus "$cpu" \
    --disk "path=${disk},format=qcow2,bus=virtio,cache=writeback" \
    --disk "path=${iso},device=cdrom,bus=ide" \
    --os-variant ubuntu22.04 \
    --network "bridge=${BRIDGE},mac=${mac},model=virtio" \
    --graphics none \
    --console pty,target_type=serial \
    --import \
    --noautoconsole \
    --autostart

  log "VM ${name} created and starting."
}

# ---- Main: create all three VMs ----
log "Creating 3-node virtual cluster..."

create_vm "node1" "$NODE1_IP" "52:54:00:aa:bb:10" "$NODE1_RAM" "$NODE1_CPU" "$NODE1_DISK"
create_vm "node2" "$NODE2_IP" "52:54:00:aa:bb:11" "$NODE2_RAM" "$NODE2_CPU" "$NODE2_DISK"
create_vm "node3" "$NODE3_IP" "52:54:00:aa:bb:20" "$NODE3_RAM" "$NODE3_CPU" "$NODE3_DISK"

log "All VMs launched. Cloud-init will configure them (may take 2-5 mins)."
log "Monitor: virsh console node1  |  virsh list --all"
