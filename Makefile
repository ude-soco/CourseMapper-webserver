help:
	@cat $(MAKEFILE_LIST) | docker run --rm -i --platform linux/amd64 xanders/make-help

export COMPOSE_BAKE=1
compose = docker compose -f compose.yaml

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
	@$(compose) build

# Push container images to remote registry
push:
	@$(compose) push

# Start all services for development using Tilt for live container updates
tilt:
	@tilt up
	@$(compose) down

# Start all services with processes in containers, but mounted source files on host
mounted: down
	@$(compose) -f compose-mounts.yaml up --force-recreate --build

dev:
	@echo 'Please switch to using new target: ${MAKE} mounted'

.PHONY: help run start up stop down clean cleanall build push tilt mounted dev
