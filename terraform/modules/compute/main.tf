# 1. Muro de fuego para el Load Balancer (Público)
resource "aws_security_group" "alb" {
  name        = "assetflow-${var.environment}-alb-sg"
  description = "Permite trafico HTTP entrante hacia el balanceador"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Cualquier persona en el mundo puede entrar por HTTP
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1" # Salida libre para que el balanceador hable con Fargate
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 2. Muro de fuego para las tareas de ECS Fargate (Aislado)
resource "aws_security_group" "ecs_tasks" {
  name        = "assetflow-${var.environment}-ecs-tasks-sg"
  description = "Permite trafico unicamente proveniente del ALB"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id] # <-- ¡REGLA CLAVE! Solo el ALB pasa
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1" # Salida libre para que Node hable con Postgres S3, u OAuth de Google
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 3. El Balanceador de Carga Físico/Virtual
resource "aws_lb" "main" {
  name               = "assetflow-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids # Nace en las subnets publicas
}

# 4. El Target Group (El grupo destino adonde el ALB sabe redirigir las peticiones)
resource "aws_lb_target_group" "app" {
  name        = "assetflow-${var.environment}-tg"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip" # Fargate exige obligatoriamente tipo 'ip'

  # Monitoreo de salud para saber si Node.js colapsa o sigue vivo
  health_check {
    path                = "/health" # Asegurate de tener un endpoint app.get('/health') en tu Express
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }
}

# 5. El Oyente (Listener) que mapea el puerto 80 al Target Group
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# 6. Clúster lógico de ECS
resource "aws_ecs_cluster" "main" {
  name = "assetflow-${var.environment}-cluster"
}

# 7. Task Definition (La plantilla de ejecucion del contenedor)
resource "aws_ecs_task_definition" "app" {
  family                   = "assetflow-${var.environment}-task"
  network_mode             = "awsvpc" # Requerido por Fargate
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.fargate_cpu
  memory                   = var.fargate_memory
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "assetflow-backend"
      image     = var.container_image
      essential = true
      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
        }
      ]
      logConfiguration = { # <-- ¡ACTIVAMOS LOS LOGS AQUÍ!
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = "us-east-1"
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

# 8. El Servicio de ECS (Garantiza que siempre haya réplicas activas)
resource "aws_ecs_service" "main" {
  name            = "assetflow-${var.environment}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_compute_subnet_ids # <-- Nace protegido en la privada
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false # No necesita IP publica, el ALB se encarga de comunicarlo
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "assetflow-backend"
    container_port   = var.container_port
  }

  # Le dice a ECS que espere a que el ALB cree el Listener antes de intentar colgar tareas
  depends_on = [aws_lb_listener.http]
}

# El repositorio donde vas a subir tus imagenes Docker de Node.js
resource "aws_ecr_repository" "app" {
  name                 = "assetflow-${var.environment}-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true # Escanea tu codigo en busca de vulnerabilidades de seguridad
  }
}

# El rol que asumirá la tarea de Fargate para interactuar con AWS
resource "aws_iam_role" "ecs_execution_role" {
  name = "assetflow-${var.environment}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "ecs-tasks.amazonaws.com" }
      }
    ]
  })
}

# Adjuntar la política oficial de AWS para que pueda bajar imágenes y crear logs
resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# El grupo de logs en CloudWatch para ver los console.log() de tu Node.js
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/assetflow-${var.environment}-backend"
  retention_in_days = 7 # Guarda los logs por una semana para no generar costos extras
}
