#!/bin/bash
set -e

# Download version file
echo "${0}: Downloading version file..."
CHECKSUM=$(rclone cat "$INIT_PATH.sha256")

# Check if checksum file exists
echo "${0}: Checking if checksum file exists..."
if [ -f /var/lib/postgresql/data/init.sql.gz.sha256 ]; then
		# Check if version is different
		if [ "$CHECKSUM" != "$(cat /var/lib/postgresql/data/init.sql.gz.sha256)" ]; then
				# Wipe the database
				echo "${0}: Checksums are different. Wiping the database..."
				rm -r /var/lib/postgresql/data/*
				echo "${0}: Database wiped"
		else
			  echo "${0}: Checksums are the same. Skipping the initialization"
		fi
fi

# Save the new version
echo "$CHECKSUM" > /var/lib/postgresql/data/init.sql.gz.sha256

# Start the database
echo "${0}: Starting the database..."
exec /usr/local/bin/docker-entrypoint.sh "$@"
