help:
	@cat $(MAKEFILE_LIST) | docker run --rm -i --platform linux/amd64 xanders/make-help

# Check production manifests for validity and known issues
lint:
	@cp -n prod/webserver.env.example prod/webserver.env || echo ".env file not copied"
	@kubectl kustomize prod | kubeval --schema-location https://raw.githubusercontent.com/yannh/kubernetes-json-schema/master
	@kubectl kustomize prod | kubectl score score --kubernetes-version v1.26 -

.PHONY: help lint
