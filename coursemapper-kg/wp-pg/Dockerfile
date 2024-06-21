FROM postgres:16

# APT requires archive URLs
COPY debian/sources.list /etc/apt/sources.list

# Install dependencies
ENV RUNTIME_DEPS "ca-certificates rclone"
RUN --mount=type=cache,sharing=private,target=/var/cache/apt \
    --mount=type=cache,sharing=private,target=/var/lib/apt <<EOF
  rm -f /etc/apt/apt.conf.d/docker-clean
  echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache
  DEBIAN_FRONTEND=noninteractive apt-get update -q &&
  apt-get --reinstall install debian-archive-keyring &&
  apt-get install -qq --no-install-recommends -o=Dpkg::Use-Pty=0 $RUNTIME_DEPS
EOF

# Set up user and directories
COPY bin/entrypoint.sh /usr/local/bin/custom-entrypoint.sh
COPY bin/init.sh /docker-entrypoint-initdb.d/init.sh

# Copy config files
COPY config/rclone.conf /root/.config/rclone/rclone.conf
COPY config/rclone.conf /var/lib/postgresql/.config/rclone/rclone.conf

ENTRYPOINT ["/usr/local/bin/custom-entrypoint.sh"]
CMD ["postgres"]
