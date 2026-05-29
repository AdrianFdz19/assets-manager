# ==========================================
# ⚙️ VARIABLES CONTEXTUALES Y DE ENTORNO
# ==========================================

variable "environment" {
  type        = string
  description = "Nombre del ambiente (ej. development, production)"
}

# ==========================================
# 🌐 CONEXIÓN DE RED (INPUTS DESDE NETWORKING)
# ==========================================

variable "vpc_id" {
  type        = string
  description = "ID de la VPC donde se creará el Security Group de la base de datos"
}

variable "private_data_subnet_ids" {
  type        = list(string)
  description = "Lista de subnets privadas de datos para desplegar la base de datos RDS"
}

# ==========================================
# 🔒 ENLACE DE SEGURIDAD (INPUTS DESDE COMPUTE)
# ==========================================

variable "ecs_tasks_security_group_id" {
  type        = string
  description = "ID del Security Group de Fargate para permitirle el acceso exclusivo a Postgres"
}

# ==========================================
# 🗄️ PARÁMETROS DE CONFIGURACIÓN DE BASE DE DATOS
# ==========================================

variable "db_name" {
  type        = string
  description = "Nombre inicial de la base de datos"
  default     = "assetflow_db"
}

variable "db_user" {
  type        = string
  description = "Usuario administrador de PostgreSQL"
  default     = "postgres"
}

variable "db_password" {
  type        = string
  description = "Contraseña para el usuario administrador (Se recomienda inyectarla por variable externa)"
  sensitive   = true # Evita que se imprima en los logs de la terminal por seguridad
}