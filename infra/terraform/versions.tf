terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

# Credentials come from the environment (infra/terraform/.env):
# AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and CLOUDFLARE_API_TOKEN.
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      project   = "gameplay"
      managedBy = "terraform"
    }
  }
}

provider "cloudflare" {}
