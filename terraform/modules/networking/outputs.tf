# 1. Exportar la ID de la VPC
output "vpc_id" {
  value       = aws_vpc.main.id
  description = "La ID de la VPC principal del entorno"
}

# 2. Exportar la lista de IDs de las Subnets Públicas (Para el ALB)
output "public_subnet_ids" {
  value       = aws_subnet.public[*].id
  description = "Lista de IDs de las subnets públicas"
}

# 3. Exportar la lista de IDs de las Subnets Privadas de Cómputo (Para ECS)
output "private_compute_subnet_ids" {
  value       = aws_subnet.private_compute[*].id
  description = "Lista de IDs de las subnets privadas para cómputo"
}

# 4. Exportar la lista de IDs de las Subnets Privadas de Datos (Para RDS)
output "private_data_subnet_ids" {
  value       = aws_subnet.private_data[*].id
  description = "Lista de IDs de las subnets privadas para la base de datos"
}