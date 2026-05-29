# 1. Exportar la URL interna (Host) de la Base de Datos RDS
output "db_endpoint" {
  value       = aws_db_instance.postgres.endpoint
  description = "La direccion de conexion (Host:Port) para la base de datos PostgreSQL"
}

# 2. Exportar únicamente el Hostname de la Base de Datos (Sin el puerto :5432)
output "db_address" {
  value       = aws_db_instance.postgres.address
  description = "El Hostname limpio de la instancia de la base de datos"
}

# 3. Exportar el Nombre del Bucket S3 para tus imágenes de Assets
output "s3_bucket_name" {
  value       = aws_s3_bucket.assets_media.id
  description = "El nombre real del bucket de S3 creado para el almacenamiento de archivos"
}

# 4. Exportar el ARN del Bucket S3 (Útil por si ECS requiere permisos específicos sobre él en el futuro)
output "s3_bucket_arn" {
  value       = aws_s3_bucket.assets_media.arn
  description = "El Amazon Resource Name (ARN) del bucket de S3"
}