# syntax=docker/dockerfile:1.15
FROM python:3.11

# Set the working directory
WORKDIR /app

# Install APT packages
ENV BUILD_DEPS "postgresql-common"
ENV RUNTIME_DEPS "lbzip2 postgresql-client-16 rclone"
RUN --mount=type=cache,sharing=private,target=/var/cache/apt \
    --mount=type=cache,sharing=private,target=/var/lib/apt <<EOF
  rm -f /etc/apt/apt.conf.d/docker-clean
  echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache
  DEBIAN_FRONTEND=noninteractive apt-get update -q &&
	apt-get install -y --no-install-recommends $BUILD_DEPS &&
	
	# Add PostgreSQL package source (runs `apt-get update`)
	/usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y &&

	apt-get install -y --no-install-recommends $RUNTIME_DEPS &&
	rm -rf /var/lib/apt/lists/*
EOF

# Install Python packages
COPY Pipfile Pipfile.lock ./
RUN pip install --no-color pipenv==2023.12.1
RUN pipenv install --deploy

# Remove build dependencies
RUN	apt-get remove -q $BUILD_DEPS

# Copy config files
COPY config/rclone.conf /root/.config/rclone/rclone.conf

# Copy the rest of the files
COPY . .

ENTRYPOINT ["bin/entrypoint.sh"]
