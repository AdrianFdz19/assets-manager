# 1. El Bucket de S3 para imágenes de Assets
resource "aws_s3_bucket" "assets_media" {
  bucket        = "assetflow-${var.environment}-media-farf" # Nombre único global
  force_destroy = var.environment == "development" ? true : false # Si es dev, permite borrar todo al destruir

  tags = {
    Name = "assetflow-${var.environment}-media"
  }
}

# 2. Configurar el acceso público controlado para que tu Frontend pueda renderizar las imágenes
resource "aws_s3_bucket_public_access_block" "media_access" {
  bucket = aws_s3_bucket.assets_media.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# 3. Política del Bucket para permitir que cualquiera LEA las imágenes (equivalente a Cloudinary)
resource "aws_s3_bucket_policy" "public_read_policy" {
  bucket     = aws_s3_bucket.assets_media.id
  depends_on = [aws_s3_bucket_public_access_block.media_access]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.assets_media.arn}/*"
      }
    ]
  })
}

# 4. Security Group para RDS
resource "aws_security_group" "db" {
  name        = "assetflow-${var.environment}-db-sg"
  description = "Permite acceso exclusivo a PostgreSQL desde Fargate"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.ecs_tasks_security_group_id] # <-- ¡EL CANDADO! Solo entra Fargate
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 5. El Grupo de Subnets requerido por AWS para Bases de Datos
resource "aws_db_subnet_group" "main" {
  name       = "assetflow-${var.environment}-db-subnet-group"
  subnet_ids = var.private_data_subnet_ids

  tags = {
    Name = "assetflow-${var.environment}-db-subnet-group"
  }
}

# 6. Instancia de Base de Datos PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier             = "assetflow-${var.environment}-postgres"
  engine                 = "postgres"
  engine_version         = "16"                # Versión moderna y estable de Postgres
  instance_class         = "db.t4g.micro"         # Instancia AWS Graviton2 muy económica para Dev
  allocated_storage      = 20                     # 20 GB de almacenamiento base en disco
  max_allocated_storage  = 100                    # Auto-escalado de disco hasta 100 GB si se llena
  db_name                = var.db_name
  username               = var.db_user
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  
  skip_final_snapshot    = var.environment == "development" ? true : false # No saca respaldo pesado al destruir en dev
  publicly_accessible    = false                  # Bloqueo total de IP pública a internet
}