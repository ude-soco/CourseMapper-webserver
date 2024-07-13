#!/bin/bash
set -e

# Replace access key id and secret access keys from environment variables
sed -i "s/ACCESS_KEY_ID/$ACCESS_KEY_ID/g" /var/lib/postgresql/.config/rclone/rclone.conf
sed -i "s/SECRET_ACCESS_KEY/$SECRET_ACCESS_KEY/g" /var/lib/postgresql/.config/rclone/rclone.conf

# Download version file
echo "${0}: Downloading version file..."
CHECKSUM=$(rclone --config /var/lib/postgresql/.config/rclone/rclone.conf cat "$INIT_PATH.sha256")

# Check if checksum file exists
echo "${0}: Checking if checksum file exists..."
if [ -f /var/lib/postgresql/meta/init.sql.gz.sha256 ]; then
		# Check if version is different
		if [ "$CHECKSUM" != "$(cat /var/lib/postgresql/meta/init.sql.gz.sha256)" ]; then
				# Wipe the database
				echo "${0}: Checksums are different. Wiping the database..."
				rm -r /var/lib/postgresql/data/*
				echo "${0}: Database wiped"
		else
			  echo "${0}: Checksums are the same. Skipping the initialization"
		fi
fi

# Save the new version
echo "$CHECKSUM" > /var/lib/postgresql/meta/init.sql.gz.sha256

# Start the database
echo "${0}: Starting the database..."
exec /usr/local/bin/docker-entrypoint.sh "$@"
