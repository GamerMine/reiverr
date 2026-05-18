#!/bin/bash

set -e

NAMES=( "jellyfin" "radarr" "sonarr" "prowlarr" "flaresolverr" )

for NAME in "${NAMES[@]}"; do
  res="$(docker container list -a -f "NAME=$NAME" | wc -l)"
  if [ "$res" -gt 1 ]; then
    docker container stop "$NAME"
    docker container rm "$NAME"
  fi
done