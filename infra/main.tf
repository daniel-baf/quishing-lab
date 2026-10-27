terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "google" {
  project = var.project
  region  = var.region
  zone    = var.zone
}

# Long random token for the /admin dashboard, generated once per deployment.
resource "random_password" "admin_token" {
  length  = 32
  special = false
}

# Postgres password for the lab db (internal Docker network only).
resource "random_password" "postgres" {
  length  = 32
  special = false
}

# Static IP the whole setup is wired to (QR arsenal URLs point at it). It is
# reserved even while the VM is stopped; releasing it happens on destroy.
resource "google_compute_address" "static" {
  name   = "quishing-lab-ip"
  region = var.region
}

resource "google_compute_instance" "vm" {
  name           = "quishing-lab"
  machine_type   = var.machine_type
  desired_status = var.vm_running ? "RUNNING" : "TERMINATED"

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2404-lts-amd64"
      size  = 20
      type  = "pd-standard"
    }
  }

  network_interface {
    network = "default"
    access_config {
      nat_ip = google_compute_address.static.address
    }
  }

  metadata = {
    user-data = templatefile("${path.module}/cloud-init.yml.tpl", {
      repo_url          = var.repo_url
      admin_token       = random_password.admin_token.result
      postgres_password = random_password.postgres.result
      lan_ip            = google_compute_address.static.address
    })
  }

  tags = ["quishing-lab-ssh"]

  lifecycle {
    # cloud-init only runs on first boot; recreating the VM wipes the disk.
    ignore_changes = [metadata]
  }
}

# SSH only, and only from the ranges you configure. The panel itself is never
# exposed here: it goes out through the cloudflared tunnel profile in compose.
resource "google_compute_firewall" "ssh" {
  name    = "quishing-lab-ssh"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = var.ssh_source_ranges
  target_tags   = ["quishing-lab-ssh"]
}
