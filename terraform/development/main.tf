terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.46.0"
    }
  }

  backend "s3" {
    bucket         = "assetflow-terraform-state-farf" # El nombre de tu bucket de bootstrap
    key            = "development/terraform.tfstate"  # Ruta única para este entorno
    region         = "us-east-1"
    encrypt        = true
    use_lockfile   = true # Reemplaza a dynamodb_table de forma moderna nativa
  }
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Project   = "AssetFlow"
      ManagedBy = "Terraform"
      Env       = "Development"
    }
  }
}

# ==========================================
# 🌐 1. LLAMADA AL MÓDULO DE NETWORKING
# ==========================================
module "networking" {
  source = "../modules/networking"

  environment        = "development"
  vpc_cidr           = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b"]
}

# ==========================================
# 🐳 2. LLAMADA AL MÓDULO DE COMPUTE (ECS + ALB)
# ==========================================
module "compute" {
  source = "../modules/compute"

  environment                = "development"
  vpc_id                     = module.networking.vpc_id
  public_subnet_ids          = module.networking.public_subnet_ids
  private_compute_subnet_ids = module.networking.private_compute_subnet_ids
  
  # Tu imagen de Docker (puedes cambiarla después por tu URI de ECR)
  container_image            = "node:20-alpine" 
  container_port             = 5000
  fargate_cpu                = "256"
  fargate_memory             = "512"
  desired_count              = 1
}

# ==========================================
# 🗄️ 3. LLAMADA AL MÓDULO DE STORAGE (S3 + RDS)
# ==========================================
module "storage" {
  source = "../modules/storage"

  environment                 = "development"
  vpc_id                      = module.networking.vpc_id
  private_data_subnet_ids     = module.networking.private_data_subnet_ids
  ecs_tasks_security_group_id = module.compute.ecs_tasks_security_group_id

  db_name                     = "assetflow_dev_db"
  db_user                     = "postgres"
  # NOTA: En producción usarías variables de entorno secretas externas,
  # pero para validar tu compilación de desarrollo podemos dejar un string base seguro.
  db_password                 = "AssetFlowSecurePass2026" 
}

# ==========================================
# 📊 OUTPUTS FINALES DEL ENTORNO
# ==========================================
output "api_url" {
  value       = "http://${module.compute.alb_dns_name}"
  description = "La URL publica para pegarle a tu API de Express"
}

output "database_host" {
  value       = module.storage.db_address
  description = "El Hostname interno de la base de datos para tu archivo .env"
}

output "media_bucket_name" {
  value       = module.storage.s3_bucket_name
  description = "El nombre del bucket S3 que reemplaza a Cloudinary"
}