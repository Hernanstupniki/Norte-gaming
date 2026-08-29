#!/usr/bin/env bash
# Example deploy script that uses an env file outside the repository.
# Usage: sudo ./deploy_with_env.sh /home/deploy/norte.env

if [ -z "$1" ]; then
  echo "Usage: $0 /path/to/envfile"
  exit 1
fi

ENV_FILE="$1"

if [ ! -f "$ENV_FILE" ]; then
  echo "Env file not found: $ENV_FILE"
  exit 2
fi

echo "Using env file: $ENV_FILE"
echo "Starting api service with docker compose using provided env file..."
docker compose --env-file "$ENV_FILE" up -d --no-deps --build api
echo "Done. Check logs with: docker compose logs -f api"
