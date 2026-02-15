#!/bin/bash

set -e

NAME="sonarr"
CACHE_FOLDER="./cache/$NAME"

# Check docker compose availability
docker version > /dev/null 2> /dev/null

if [ $? -eq 1 ]; then
  echo "Docker not found. Please install it from the official docker documentation."
  exit 1
fi

# Deploy docker container
docker pull linuxserver/sonarr:4.0.16
mkdir -p $CACHE_FOLDER/config $CACHE_FOLDER/downloads

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
 -p 8989:8989 \
 -v $CACHE_FOLDER/config:/config \
 -v ./cache/jellyfin/media:/tv \
 -v $CACHE_FOLDER/downloads:/downloads \
 --restart=unless-stopped \
 linuxserver/sonarr:4.0.16

echo "NOTICE: Sonarr can be accessed here: http://127.0.0.1:8989"
