# 1. Creación de la VPC Personalizada
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "assetflow-${var.environment}-vpc"
    Environment = var.environment
  }
}

# 2. Internet Gateway (Para dar salida a internet a las subnets públicas)
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "assetflow-${var.environment}-igw"
    Environment = var.environment
  }
}

# ==========================================
# 🛑 CAPA 1: SUBNETS PÚBLICAS (Para el ALB)
# ==========================================
resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  # cidrsubnet calcula automáticamente rangos limpios (ej. 10.0.0.0/24, 10.0.1.0/24)
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)
  availability_zone       = element(var.availability_zones, count.index)
  map_public_ip_on_launch = true

  tags = {
    Name        = "assetflow-${var.environment}-public-${count.index + 1}"
    Environment = var.environment
  }
}

# ==========================================
# 🔒 CAPA 2: SUBNETS PRIVADAS DE CÓMPUTO (Para ECS Fargate Backend Express)
# ==========================================
resource "aws_subnet" "private_compute" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  # Desplazamos el índice (+10) para que no choquen con las públicas (ej. 10.0.10.0/24, 10.0.11.0/24)
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index + 10)
  availability_zone = element(var.availability_zones, count.index)

  tags = {
    Name        = "assetflow-${var.environment}-private-compute-${count.index + 1}"
    Environment = var.environment
  }
}

# ==========================================
# 🗄️ CAPA 3: SUBNETS PRIVADAS DE DATOS (Para RDS PostgreSQL)
# ==========================================
resource "aws_subnet" "private_data" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  # Desplazamos más el índice (+20) para la capa de datos (ej. 10.0.20.0/24, 10.0.21.0/24)
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index + 20)
  availability_zone = element(var.availability_zones, count.index)

  tags = {
    Name        = "assetflow-${var.environment}-private-data-${count.index + 1}"
    Environment = var.environment
  }
}

# ==========================================
# 🗺️ ENRUTAMIENTO (TABLAS DE RUTAS)
# ==========================================

# Tabla de rutas para la capa pública (Apunta directamente al Internet Gateway)
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name        = "assetflow-${var.environment}-public-rt"
    Environment = var.environment
  }
}

# Asociación de las subnets públicas a la tabla pública
resource "aws_route_table_association" "public" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Tabla de rutas para las capas privadas (Aisladas de internet)
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "assetflow-${var.environment}-private-rt"
    Environment = var.environment
  }
}

# Asociación de subnets privadas de cómputo
resource "aws_route_table_association" "private_compute" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private_compute[count.index].id
  route_table_id = aws_route_table.private.id
}

# Asociación de subnets privadas de datos
resource "aws_route_table_association" "private_data" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private_data[count.index].id
  route_table_id = aws_route_table.private.id
}

