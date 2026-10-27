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
