output "static_ip" {
  description = "Reserved static IP the QR arsenal URLs point to."
  value       = google_compute_address.static.address
}

output "ssh_command" {
  description = "SSH into the VM."
  value       = "gcloud compute ssh quishing-lab --zone=${var.zone} --project=${var.project}"
}

output "start_command" {
  description = "Power the VM on for the practice."
  value       = "gcloud compute instances start quishing-lab --zone=${var.zone} --project=${var.project}"
}

output "stop_command" {
  description = "Power the VM off again."
  value       = "gcloud compute instances stop quishing-lab --zone=${var.zone} --project=${var.project}"
}

output "admin_token" {
  description = "ADMIN_TOKEN written into /opt/quishing-lab/.env on the VM."
  value       = random_password.admin_token.result
  sensitive   = true
}

output "admin_url" {
  description = "Dashboard URL once the VM is running (http; prefer the cloudflared tunnel for the demo)."
  value       = "http://${google_compute_address.static.address}:3000/admin?token=${random_password.admin_token.result}"
  sensitive   = true
}
