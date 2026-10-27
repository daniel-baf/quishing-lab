variable "project" {
  description = "GCP project id (billing must be enabled)."
  type        = string
}

variable "region" {
  description = "Region. us-central1 keeps the e2-micro in the always-free tier."
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "Zone inside var.region."
  type        = string
  default     = "us-central1-a"
}

variable "machine_type" {
  description = "e2-micro (1 GB, free tier) / e2-small (2 GB) / e2-medium (4 GB). With $20 of credits for a 2-day practice even e2-medium costs under $2."
  type        = string
  default     = "e2-small"
}

variable "repo_url" {
  description = "Public git URL cloned by cloud-init onto the VM."
  type        = string
  default     = "https://github.com/daniel-baf/quishing-lab.git"
}

variable "vm_running" {
  description = "false leaves the VM created but STOPPED after apply (everything wired, zero compute cost); true starts it."
  type        = bool
  default     = false
}

variable "ssh_source_ranges" {
  description = "CIDRs allowed to SSH. Narrow this to your own IP if you can."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}
