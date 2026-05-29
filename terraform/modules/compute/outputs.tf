# 1. Exportar la URL pública del balanceador (Esencial para conectar tu Frontend con el Backend)
output "alb_dns_name" {
  value       = aws_lb.main.dns_name
  description = "La URL publica (DNS) del Application Load Balancer para exponer el backend"
}

# 2. Exportar la Zona de ID del ALB (Útil si mañana quieres colgarle un dominio con Route 53)
output "alb_zone_id" {
  value       = aws_lb.main.zone_id
  description = "El Canonical Hosted Zone ID del Load Balancer"
}

# 3. Exportar el ID del Security Group del ECS (Útil si el módulo de base de datos necesita darle permisos exclusivos)
output "ecs_tasks_security_group_id" {
  value       = aws_security_group.ecs_tasks.id
  description = "ID del Security Group adjunto a las tareas de ECS Fargate"
}

# 4. Exportar el nombre del Clúster de ECS
output "cluster_name" {
  value       = aws_ecs_cluster.main.name
  description = "Nombre del clúster de ECS creado"
}