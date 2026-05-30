# modules/compute/variables.tf

# ==========================================
# ⚙️ VARIABLES CONTEXTUALES Y DE ENTORNO
# ==========================================
variable "environment" {
  type        = string
  description = "Nombre del ambiente (ej. development, production)"
}

variable "database_user" { type = string }
variable "database_name" { type = string }
variable "client_url"    { type = string }

# ==========================================
# 🌐 VARIABLES DE CONEXIÓN (INPUTS DESDE NETWORKING)
# ==========================================
variable "vpc_id" {
  type        = string
  description = "ID de la VPC donde se desplegará el clúster de cómputo"
}

variable "public_subnet_ids" {
  type        = list(string)
  description = "Lista de IDs de las subnets públicas (Requerido para el Load Balancer)"
}

variable "private_compute_subnet_ids" {
  type        = list(string)
  description = "Lista de IDs de las subnets privadas (Donde correrán las tareas de Fargate)"
}

# ==========================================
# 🐳 VARIABLES DEL CONTENEDOR (BACKEND NODEJS)
# ==========================================
variable "container_image" {
  type        = string
  description = "Ruta o URI de la imagen de Docker en AWS ECR"
}

variable "container_port" {
  type        = number
  description = "Puerto en el que escucha tu servidor Express"
  default     = 5000
}

# ==========================================
# 🎛️ CAPACIDAD Y RENDIMIENTO DE FARGATE
# ==========================================
variable "fargate_cpu" {
  type        = string
  default     = "256"
}

variable "fargate_memory" {
  type        = string
  default     = "512"
}

variable "desired_count" {
  type        = number
  default     = 1
}

variable "database_host" {
  type        = string
  description = "Host de la base de datos RDS"
}

variable "database_password" {
  type        = string
  description = "Password de la base de datos RDS"
}

variable "media_bucket_name" {
  type        = string
  description = "Nombre del bucket S3 de assets"
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "google_client_id" {
  type      = string 
  sensitive = true 
}