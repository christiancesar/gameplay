# Only the Gameplay records of the shared oikos.company zone. Zone-wide
# settings (SSL mode, already Full (strict)) are left out on purpose.

data "cloudflare_ip_ranges" "cloudflare" {}

locals {
  app_hostname = "${var.app_subdomain}.${var.zone_name}"
}

resource "cloudflare_dns_record" "api" {
  zone_id = var.cloudflare_zone_id
  name    = local.app_hostname
  type    = "A"
  content = aws_lightsail_static_ip.api.ip_address
  proxied = true
  ttl     = 1
  comment = "Gameplay web and API on Lightsail (terraform, infra/terraform)"
}

# Certificate nginx presents to Cloudflare (Full (strict)). Trusted by
# Cloudflare only, valid for 15 years.
resource "tls_private_key" "origin" {
  algorithm   = "ECDSA"
  ecdsa_curve = "P256"
}

resource "tls_cert_request" "origin" {
  private_key_pem = tls_private_key.origin.private_key_pem

  subject {
    common_name = local.app_hostname
  }

  dns_names = [local.app_hostname]
}

resource "cloudflare_origin_ca_certificate" "api" {
  csr                = tls_cert_request.origin.cert_request_pem
  hostnames          = [local.app_hostname]
  request_type       = "origin-ecc"
  requested_validity = 5475
}
