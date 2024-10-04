#!/bin/bash
set -e

# Stream the initialization script to postgres
echo "${0}: Downloading and executing initialization script..."
rclone cat "$INIT_PATH" | gunzip | psql

# Move the tmp checksum to the actual checksum
mv /var/lib/postgresql/meta/init.tmp.sql.gz.sha256 /var/lib/postgresql/meta/init.sql.gz.sha256
