#!/bin/bash
set -e

# Copy the rclone config file
echo "${0}: Copying rclone config file to $HOME..."
cp /var/lib/postgresql/meta/rclone.conf "$HOME/rclone.conf"

# Replace access key id and secret access keys from environment variables
sed -i "s/ACCESS_KEY_ID/$ACCESS_KEY_ID/g" "$HOME/rclone.conf"
sed -i "s/SECRET_ACCESS_KEY/$SECRET_ACCESS_KEY/g" "$HOME/rclone.conf"

# Download version file
echo "${0}: Downloading version file..."
CHECKSUM=$(rclone --config "$HOME/rclone.conf" cat "$INIT_PATH.sha256")

# Check if checksum file exists
echo "${0}: Checking if checksum file exists..."
if [ -f /var/lib/postgresql/meta/init.sql.gz.sha256 ]; then
		# Check if version is the same
		if [ "$CHECKSUM" == "$(cat /var/lib/postgresql/meta/init.sql.gz.sha256)" ]; then
			  echo "${0}: Checksums are the same. Skipping the initialization"
				exit 0
		fi
fi

# Wipe the database
echo "${0}: Checksum file is different or does not exist. Wiping the database..."
rm -rf /var/lib/postgresql/data/*
echo "${0}: Database wiped"

# Initialize the database
echo "${0}: Initializing database..."
# Create the database
su postgres -c "initdb -D /var/lib/postgresql/data"
# Start the server in the background
su postgres -c "pg_ctl -D /var/lib/postgresql/data -l /var/lib/postgresql/logfile start"
# Initialize the database
rclone --config "$HOME/rclone.conf" cat "$INIT_PATH" | gunzip | su postgres -c "psql"
# Stop the server
su postgres -c "pg_ctl -D /var/lib/postgresql/data stop"

# Save the checksum
echo "$CHECKSUM" > /var/lib/postgresql/meta/init.sql.gz.sha256
