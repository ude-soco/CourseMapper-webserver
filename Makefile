help:
	@cat $(MAKEFILE_LIST) | docker run --rm -i --platform linux/amd64 xanders/make-help

compose     = docker compose -f docker-compose.yml
compose-dev = docker compose -f docker-compose.yml -f docker-compose-dev.yml

all: clean build run

# Start all services using prod config (containers containing sources)
run: stop
	@$(compose) up --force-recreate

start: run
up: run

# Stop all services
stop:
	@$(compose) down --remove-orphans

down: stop

# Remove services, volumes, and locally built images
clean:
	@$(compose) down --volumes --remove-orphans --rmi local

# Remove services, volumes, and all images
cleanall:
	@$(compose) down --volumes --remove-orphans --rmi all

# Build all container images
build:
	@docker buildx bake --progress=plain

# Push container images to remote registry
push:
	@docker compose push

# Start all services for development using Tilt for live container updates
tilt:
	@tilt up
	@$(compose) down

# Start all services using dev config (files on host, processes in container)
dev: down
	@$(compose-dev) up --force-recreate --build

# Check Kubernetes manifests
lint:
	@cp -n .k8s/prod/webserver.env.example .k8s/prod/webserver.env || echo ".env file not copied"
	@kubectl kustomize .k8s/prod | kubeval --schema-location https://raw.githubusercontent.com/yannh/kubernetes-json-schema/master
	@kubectl kustomize .k8s/prod | kubectl score score --kubernetes-version v1.26 -

.PHONY: help run start up stop down clean cleanall build push tilt dev lint
