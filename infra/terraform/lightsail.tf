# The API server: Docker with the api and nginx containers. Nothing is built
# here; the images are built on the deploy machine and shipped over SSH.

resource "aws_lightsail_key_pair" "deploy" {
  name       = "gameplay-deploy"
  public_key = file(pathexpand(var.ssh_public_key_path))
}

resource "aws_lightsail_instance" "api" {
  name              = "gameplay-api"
  availability_zone = var.availability_zone
  blueprint_id      = var.lightsail_blueprint_id
  bundle_id         = var.lightsail_bundle_id
  key_pair_name     = aws_lightsail_key_pair.deploy.name
  user_data         = file("${path.module}/bootstrap.sh")

  lifecycle {
    # The bootstrap only runs on the first boot; editing it must not replace the server.
    ignore_changes = [user_data]
  }
}

resource "aws_lightsail_static_ip" "api" {
  # Lightsail names are unique across resource types, so not the instance's name.
  name = "gameplay-api-ip"
}

resource "aws_lightsail_static_ip_attachment" "api" {
  static_ip_name = aws_lightsail_static_ip.api.name
  instance_name  = aws_lightsail_instance.api.name
}

# Lightsail's firewall: SSH only from this house, HTTPS only from Cloudflare
# (the API is always reached through the Cloudflare proxy).
resource "aws_lightsail_instance_public_ports" "api" {
  instance_name = aws_lightsail_instance.api.name

  port_info {
    protocol  = "tcp"
    from_port = 22
    to_port   = 22
    cidrs     = [var.ssh_allowed_cidr]
  }

  port_info {
    protocol   = "tcp"
    from_port  = 443
    to_port    = 443
    cidrs      = data.cloudflare_ip_ranges.cloudflare.ipv4_cidrs
    ipv6_cidrs = data.cloudflare_ip_ranges.cloudflare.ipv6_cidrs
  }
}
