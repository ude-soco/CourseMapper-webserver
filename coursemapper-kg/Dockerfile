# syntax=docker/dockerfile:1.6
FROM alpine as MODELS
WORKDIR /download
ADD https://uni-duisburg-essen.sciebo.de/s/nO06q2wY0t5h8SO/download stanford-corenlp-full-2018-02-27.zip
RUN unzip stanford-corenlp-full-2018-02-27.zip -d stanford-corenlp-full-2018-02-27 && rm stanford-corenlp-full-2018-02-27.zip


FROM python:3.11

# APT requires archive URLs
COPY debian/sources.list /etc/apt/sources.list

# Install dependencies
ENV BUILD_DEPS "build-essential pkg-config libc-dev"
ENV RUNTIME_DEPS "default-jre"
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
  pip install --no-color pipenv==2023.12.1
  pipenv install --deploy
EOF

# Run Python download scripts
RUN <<EOF
  python -c "import nltk; nltk.download('stopwords'); nltk.download('punkt'); nltk.download('wordnet');" &&
  python -c "import spacy; spacy.cli.download('en_core_web_sm');" &&
  python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-mpnet-base-v2');" &&
  python -c "from flair.embeddings import TransformerDocumentEmbeddings; TransformerDocumentEmbeddings('sentence-transformers/msmarco-distilbert-base-tas-b');"
EOF

# Clean up build dependencies
USER root
RUN  apt-get purge -y --auto-remove $BUILD_DEPS
USER 1000

# Add model files
COPY --from=MODELS --chown=app /download/* app/algorithms/

# Add source code
COPY . .

ENV OMP_NUM_THREADS 1
EXPOSE $PORT
CMD [ "bin/worker-with-log" ]
