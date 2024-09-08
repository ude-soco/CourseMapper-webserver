#!/bin/bash
set -e

# Stream the initialization script to postgres
echo "${0}: Downloading and executing initialization script..."
rclone cat "$INIT_PATH" | gunzip | psql
