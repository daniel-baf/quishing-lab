#cloud-config

# First-boot provisioning for the quishing-lab VM. Runs once, on create —
# restarting the VM does NOT re-run this (that is why main.tf ignores
# metadata changes after creation).

package_update: true
packages:
  - git

write_files:
  - path: /opt/quishing-lab-bootstrap.sh
    permissions: "0755"
    content: |
      #!/bin/bash
      set -euxo pipefail
      curl -fsSL https://get.docker.com | sh
      usermod -aG docker ubuntu
      cd /opt
      git clone ${repo_url} quishing-lab
      chown -R ubuntu:ubuntu /opt/quishing-lab
      cat > quishing-lab/.env <<'EOF'
      ADMIN_TOKEN=${admin_token}
      PORT=3000
      LAN_IP=${lan_ip}
      # DATABASE_URL comes from docker-compose.yml (db service) by default.
      EOF
      cd quishing-lab
      docker compose up -d --build

runcmd:
  - /opt/quishing-lab-bootstrap.sh

final_message: "quishing-lab bootstrap finished"
