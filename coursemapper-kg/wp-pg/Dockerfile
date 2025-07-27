# syntax=docker/dockerfile:1.15
FROM postgres:16

# APT requires archive URLs
COPY debian/stretch.sources.list /etc/apt/sources.list

# Install dependencies
ENV RUNTIME_DEPS="ca-certificates rclone"
RUN --mount=type=cache,sharing=private,target=/var/cache/apt \
    --mount=type=cache,sharing=private,target=/var/lib/apt <<EOF
  rm -f /etc/apt/apt.conf.d/docker-clean
  echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache
  apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 112695A0E562B32A &&
  DEBIAN_FRONTEND=noninteractive apt-get update -q &&
  apt-get install -qq --no-install-recommends -o=Dpkg::Use-Pty=0 $RUNTIME_DEPS
EOF

# Set up user and directories
COPY bin/entrypoint.sh /usr/local/bin/custom-entrypoint.sh

# Copy config files
COPY config/rclone.conf.orig /root

ENTRYPOINT ["/usr/local/bin/custom-entrypoint.sh"]
