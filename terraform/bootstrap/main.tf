terraform {
  required_providers {
    aws = {
        source = "hashicorp/aws"
        version = "~> 6.46.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# 1. El Bucket S3 para almacenar el .tfstate
resource "aws_s3_bucket" "terraform_state" {
  bucket        = "assetflow-terraform-state-farf" # ¡Cambia esto por un nombre único a nivel mundial!
  force_destroy = false                              # Evita que se borre si tiene archivos dentro

  tags = {
    Name        = "Terraform State Storage"
    Environment = "Global"
  }
}

# 2. Habilitar el versionado en el Bucket (Vital para recuperar estados anteriores si algo se corrompe)
resource "aws_s3_bucket_versioning" "enabled" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

# 3. Forzar el cifrado del lado del servidor para proteger credenciales en el estado
resource "aws_s3_bucket_server_side_encryption_configuration" "default" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# 4. Tabla de DynamoDB para el State Locking
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "assetflow-terraform-locks"
  billing_mode = "PAY_PER_REQUEST" # Serverless: solo pagas si trabajas, cuesta $0 si está inactiva
  hash_key     = "LockID"         # Este nombre es obligatorio y Key-Sensitive para Terraform

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name        = "Terraform State Lock Table"
    Environment = "Global"
  }
}