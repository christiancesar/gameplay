# The api's own credentials: read, write and delete objects in the uploads
# bucket, nothing else. Lightsail has no instance roles, so it is an access key.

resource "aws_iam_user" "api" {
  name = "gameplay-api"
  path = "/gameplay/"
}

resource "aws_iam_user_policy" "api_uploads" {
  name = "uploads-bucket"
  user = aws_iam_user.api.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "Objects"
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = "${aws_s3_bucket.uploads.arn}/*"
      },
      {
        # HeadBucket, used by the health check.
        Sid      = "Bucket"
        Effect   = "Allow"
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.uploads.arn
      },
    ]
  })
}

resource "aws_iam_access_key" "api" {
  user = aws_iam_user.api.name
}

# GitHub Actions publishes only Windows update objects under the existing
# uploads bucket. The workflow authenticates with OIDC, so no AWS access key is
# stored in GitHub.
data "tls_certificate" "github_actions" {
  url = "https://token.actions.githubusercontent.com"
}

resource "aws_iam_openid_connect_provider" "github_actions" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github_actions.certificates[0].sha1_fingerprint]
}

data "aws_iam_policy_document" "github_updates_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github_actions.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:christiancesar/gameplay:environment:electron-production"]
    }
  }
}

resource "aws_iam_role" "github_updates" {
  name               = "gameplay-github-updates"
  assume_role_policy = data.aws_iam_policy_document.github_updates_assume_role.json
}

data "aws_iam_policy_document" "github_updates_publish" {
  statement {
    sid       = "ListUpdatePrefix"
    effect    = "Allow"
    actions   = ["s3:GetBucketLocation", "s3:ListBucket"]
    resources = [aws_s3_bucket.uploads.arn]

    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = ["updates/windows", "updates/windows/*"]
    }
  }

  statement {
    sid       = "PublishUpdateObjects"
    effect    = "Allow"
    actions   = ["s3:AbortMultipartUpload", "s3:GetObject", "s3:PutObject"]
    resources = ["${aws_s3_bucket.uploads.arn}/updates/windows/*"]
  }
}

resource "aws_iam_role_policy" "github_updates_publish" {
  name   = "publish-windows-updates"
  role   = aws_iam_role.github_updates.id
  policy = data.aws_iam_policy_document.github_updates_publish.json
}
