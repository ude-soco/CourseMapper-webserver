# Kubernetes manifests

This is a Kustomize base layer. You will probably want to overwrite at least some settings with environment-specific changes, e.g.:

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: coursemapper-webserver

configMapGenerator:
- name: ingress
  behavior: merge
  literals:
  - host=coursemapper.com

secretGenerator:
- name: webserver
  behavior: merge
  literals:
  - COOKIE_SECRET=$SOMETHING_SAFE
  - JWT_SECRET=$SOMETHING_SAFE
  - PASS=$SOMETHING_SAFE

images:
- name: socialcomputing/coursemapper-webserver-webapp
  newTag: v1.2.3
- name: socialcomputing/coursemapper-webserver-webserver
  newTag: v1.2.3

resources:
- ./$PATH_TO_THIS_BASE_LAYER
```
