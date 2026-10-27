# Values for infra/production/.env (terraform output -raw <name>).

output "api_ip" {
  description = "Static IP of the Lightsail instance (DEPLOY_SSH_HOST)."
  value       = aws_lightsail_static_ip.api.ip_address
}

output "app_url" {
  description = "Public URL of the app (BETTER_AUTH_URL and WEB_ORIGIN)."
  value       = "https://${local.app_hostname}"
}

output "uploads_bucket" {
  description = "S3_BUCKET."
  value       = aws_s3_bucket.uploads.bucket
}

output "uploads_public_url" {
  description = "PUBLIC_UPLOADS_URL: base of the public image URLs."
  value       = "https://${aws_s3_bucket.uploads.bucket_regional_domain_name}"
}

output "uploads_access_key_id" {
  description = "S3_ACCESS_KEY_ID of the api user."
  value       = aws_iam_access_key.api.id
}

output "uploads_secret_access_key" {
  description = "S3_SECRET_ACCESS_KEY of the api user."
  value       = aws_iam_access_key.api.secret
  sensitive   = true
}

output "origin_certificate_pem" {
  description = "Cloudflare origin certificate for nginx."
  value       = cloudflare_origin_ca_certificate.api.certificate
  sensitive   = true
}

output "origin_private_key_pem" {
  description = "Private key of the origin certificate."
  value       = tls_private_key.origin.private_key_pem
  sensitive   = true
}
