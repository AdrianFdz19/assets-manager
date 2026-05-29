# ==========================================
# ⚙️ VARIABLES CONTEXTUALES Y DE ENTORNO
# ==========================================

variable "environment" {
  type        = string
  description = "Nombre del ambiente (ej. development, production)"
}

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
  description = "Ruta o URI de la imagen de Docker en AWS ECR (Elastic Container Registry) o Docker Hub"
}

variable "container_port" {
  type        = number
  description = "Puerto en el que escucha tu servidor Express (ej. 3000 o 5000)"
  default     = 5000
}

# ==========================================
# 🎛️ CAPACIDAD Y RENDIMIENTO DE FARGATE
# ==========================================

variable "fargate_cpu" {
  type        = string
  description = "Cantidad de CPU para la tarea de Fargate (1024 = 1 vCPU)"
  default     = "256" # Suficiente para el entorno de desarrollo
}

variable "fargate_memory" {
  type        = string
  description = "Cantidad de memoria RAM para la tarea de Fargate"
  default     = "512" # 512 MB, ideal para desarrollo económico
}

variable "desired_count" {
  type        = number
  description = "Número de réplicas de contenedores corriendo simultáneamente"
  default     = 1
}