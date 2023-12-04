# syntax=docker/dockerfile:1.6

# Warning: Python 3.7.2 (Dec 2018) on Debian Stretch (2017--2020)
FROM python:3.7.2

# APT requires archive URLs
COPY debian/sources.list /etc/apt/sources.list

# Install dependencies
ENV BUILD_DEPS "build-essential pkg-config libc-dev"
ENV RUNTIME_DEPS ""
RUN --mount=type=cache,sharing=private,target=/var/cache/apt \
    --mount=type=cache,sharing=private,target=/var/lib/apt <<EOF
  rm -f /etc/apt/apt.conf.d/docker-clean
  echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache
  DEBIAN_FRONTEND=noninteractive apt-get update -q &&
  apt-get --reinstall install debian-archive-keyring &&
  apt-get install -qq --no-install-recommends -o=Dpkg::Use-Pty=0 $BUILD_DEPS $RUNTIME_DEPS
EOF

# Set up user and directories
RUN adduser --disabled-login --gecos "" -u 1000 app
USER 1000
WORKDIR /home/app

# Configure Python environment
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PIPENV_VENV_IN_PROJECT 1
ENV PIPENV_VERBOSITY -1
ENV VIRTUAL_ENV=/home/app/.venv
RUN python -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install Python dependencies
COPY --chown=app:app Pipfile* .
RUN  --mount=type=cache,sharing=private,target=/home/app/.cache/pip,uid=1000 \
     --mount=type=cache,sharing=private,target=/home/app/.cache/pipenv,uid=1000 <<EOF
  pip install --no-color pip==23.2.1 pipenv==2023.9.8
  pipenv install --deploy
EOF

# Clean up build dependencies
USER root
RUN  apt-get purge -y --auto-remove $BUILD_DEPS
USER 1000

COPY . .

ENV FLASK_ENV production
ARG PORT=8001
ENV PORT=$PORT
ENV GUNICORN_LOG_LEVEL info
EXPOSE $PORT
CMD [ "bin/web" ]
