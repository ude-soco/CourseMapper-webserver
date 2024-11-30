help:
	@cat $(MAKEFILE_LIST) | docker run --rm -i --platform linux/amd64 xanders/make-help

# Check manifests for validity and known issues
lint:
	@kubectl kustomize . | kubeval --schema-location https://raw.githubusercontent.com/yannh/kubernetes-json-schema/master
	@kubectl kustomize . | kubectl score score --kubernetes-version v1.26 -

.PHONY: help lint
