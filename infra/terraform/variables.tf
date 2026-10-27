variable "aws_region" {
  description = "AWS region of the API and the uploads bucket. Same region as the Prisma Postgres database."
  type        = string
  default     = "us-east-1"
}

variable "availability_zone" {
  description = "Lightsail availability zone. Fixed: the IAM user has no EC2 permission to list them."
  type        = string
  default     = "us-east-1a"
}

variable "lightsail_bundle_id" {
  description = "Lightsail plan. small_3_0: 2 vCPU, 2 GB, 60 GB SSD, 3 TB of transfer, IPv4 included (US$ 12/month)."
  type        = string
  default     = "small_3_0"
}

variable "lightsail_blueprint_id" {
  description = "Operating system image of the instance."
  type        = string
  default     = "ubuntu_24_04"
}

variable "cloudflare_account_id" {
  description = "Cloudflare account that owns the oikos.company zone."
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Zone id of oikos.company. The zone is shared with other projects: only the Gameplay records are managed here."
  type        = string
}

variable "zone_name" {
  description = "Domain of the zone."
  type        = string
  default     = "oikos.company"
}

variable "api_subdomain" {
  description = "Hostname of the API under the zone. One level only, so the free Universal SSL covers it."
  type        = string
  default     = "unlimited"
}

variable "ssh_public_key_path" {
  description = "Public key installed on the instance for the deploys."
  type        = string
}

variable "ssh_allowed_cidr" {
  description = "Only source allowed on port 22: this house's public IPv4 as /32."
  type        = string

  validation {
    condition     = can(cidrhost(var.ssh_allowed_cidr, 0)) && !strcontains(var.ssh_allowed_cidr, ":") && endswith(var.ssh_allowed_cidr, "/32")
    error_message = "Use one IPv4 address as /32 (curl -4 ifconfig.me)."
  }
}
