#!/bin/bash

set -e

NAME="prowlarr"
CACHE_FOLDER="./cache/$NAME"

# Check docker compose availability
docker version > /dev/null 2> /dev/null

if [ $? -eq 1 ]; then
  echo "Docker not found. Please install it from the official docker documentation."
  exit 1
fi

# Deploy docker container
docker pull linuxserver/prowlarr:2.3.0
mkdir -p $CACHE_FOLDER/config

res="$(docker container list -a -f "NAME=$NAME" | wc -l)"
if [ "$res" -gt 1 ]; then
  docker container stop $NAME
  docker container rm $NAME
fi

docker run -d \
 --name $NAME \
 -e PUID=1000 \
 -e PGID=1000 \
 -e TZ=Europe/Paris \
 -p 9696:9696 \
 -v $CACHE_FOLDER/config:/config \
 --restart=unless-stopped \
 linuxserver/prowlarr:2.3.0

echo "NOTICE: Prowlarr can be accessed here: http://127.0.0.1:9696"
