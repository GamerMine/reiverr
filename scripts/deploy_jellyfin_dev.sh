#!/bin/bash

set -e

NAME="jellyfin"
CACHE_FOLDER="./cache/jellyfin"

# Check docker compose availability
docker version > /dev/null 2> /dev/null

if [ $? -eq 1 ]; then
  echo "Docker not found. Please install it from the official docker documentation."
  exit 1
fi

# Deploy docker container
docker pull jellyfin/jellyfin:10
mkdir -p $CACHE_FOLDER/config $CACHE_FOLDER/cache $CACHE_FOLDER/media

res="$(docker container list -a -f "NAME=$NAME" | wc -l)"
if [ "$res" -gt 1 ]; then
  docker container stop $NAME
  docker container rm $NAME
fi

docker run -d \
 --name $NAME \
 -p 8096:8096/tcp \
 -p 7359:7359/udp \
 --volume $CACHE_FOLDER/config:/config \
 --volume $CACHE_FOLDER/cache:/cache \
 --mount type=bind,source=$CACHE_FOLDER/media,target=/media \
 --restart=unless-stopped \
 jellyfin/jellyfin

echo "NOTICE: Jellyfin can be accessed here: http://127.0.0.1:8096"
