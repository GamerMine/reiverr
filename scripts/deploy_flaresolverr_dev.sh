#!/bin/bash

set -e

NAME="flaresolverr"

# Check docker compose availability
docker version > /dev/null 2> /dev/null

if [ $? -eq 1 ]; then
  echo "Docker not found. Please install it from the official docker documentation."
  exit 1
fi

# Deploy docker container
docker pull ghcr.io/flaresolverr/flaresolverr:v3.4.6

res="$(docker container list -a -f "NAME=$NAME" | wc -l)"
if [ "$res" -gt 1 ]; then
  docker container stop $NAME
  docker container rm $NAME
fi

docker run -d \
 --name $NAME \
 -p 8191:8191 \
 -e LOG_LEVEL=info \
 --restart=unless-stopped \
 ghcr.io/flaresolverr/flaresolverr:v3.4.6
