# development/variables.tf (O raíz de tu entorno)

variable "environment_name" { type = string }
variable "db_user" { type = string }
variable "db_name" { type = string }
variable "db_password" { type = string } # 👈 Agregada para eliminar texto plano
variable "frontend_url" { type = string }
variable "jwt_secret" {
  type      = string
  sensitive = true
}
variable "google_client_id" {
  type      = string
  sensitive = true
}
