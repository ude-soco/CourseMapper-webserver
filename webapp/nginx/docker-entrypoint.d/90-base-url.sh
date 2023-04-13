#!/bin/sh
# set -euo pipefail

find '/usr/share/nginx/html' -name '*.js' -exec \
  sed -i -e 's,DUMMY_BASE_URL,'"$BASE_URL"',g' {} \;
