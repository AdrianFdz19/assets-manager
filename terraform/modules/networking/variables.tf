variable "environment" {
  type        = string
  description = "Nombre del ambiente (ej. development, production)"
}

variable "vpc_cidr" {
  type        = string
  description = "Rango de IPs globales para la VPC"
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  type        = list(string)
  description = "Zonas de disponibilidad para la alta disponibilidad"
  default     = ["us-east-1a", "us-east-1b"]
}