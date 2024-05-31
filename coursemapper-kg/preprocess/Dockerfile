# syntax=docker/dockerfile:1.6
FROM python:3.11

# Set the working directory
WORKDIR /app

# Copy Pipfile and Pipfile.lock
COPY Pipfile Pipfile.lock ./

# Install the required packages
RUN apt-get update && apt-get install -y --no-install-recommends \
		lbzip2 \
		&& rm -rf /var/lib/apt/lists/*
RUN pip install --no-color pipenv==2023.12.1
RUN pipenv install --deploy

# Copy the rest of the files
COPY . .

ENTRYPOINT ["pipenv", "run", "python", "main.py"]
