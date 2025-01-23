#!/bin/bash
set -e

echo "${0}: Copying rclone.conf.orig to rclone.conf ..."
cp "$HOME/rclone.conf.orig" "$HOME/rclone.conf"

echo "${0}: Replacing rclone.conf placeholders ..."
sed -i "s/ACCESS_KEY_ID/$ACCESS_KEY_ID/g" "$HOME/rclone.conf"
sed -i "s/SECRET_ACCESS_KEY/$SECRET_ACCESS_KEY/g" "$HOME/rclone.conf"

echo "${0}: Downloading version file ..."
CHECKSUM=$(rclone --config "$HOME/rclone.conf" cat "$INIT_PATH.sha256")

echo "${0}: Checking for previous checksum ..."
if [ -f /var/lib/postgresql/meta/init.sql.gz.sha256 ]; then
  if [ "$CHECKSUM" == "$(cat /var/lib/postgresql/meta/init.sql.gz.sha256)" ]; then
    echo "${0}: Checksums identical, skipping initialization."; exit 0
  fi
fi
echo "${0}: Previous checksum different or missing."

echo "${0}: Wiping existing database data ..."
rm -rf /var/lib/postgresql/data/*

echo "${0}: Initializing database ..."
/usr/local/bin/docker-ensure-initdb.sh

echo "${0}: Starting PostgreSQL ..."
su postgres -c "pg_ctl -D /var/lib/postgresql/data -l /var/lib/postgresql/logfile start"

echo "${0}: Importing remote DB dump ..."
rclone --config "$HOME/rclone.conf" cat "$INIT_PATH" | gunzip | su postgres -c "psql"

echo "${0}: Stopping PostgreSQL ..."
su postgres -c "pg_ctl -D /var/lib/postgresql/data stop"

echo "${0}: Saving new checksum ..."
echo "$CHECKSUM" > /var/lib/postgresql/meta/init.sql.gz.sha256
