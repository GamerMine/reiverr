#!/bin/bash

set -xe

source scripts/deploy_jellyfin_dev.sh
source scripts/deploy_radarr_dev.sh
source scripts/deploy_sonarr_dev.sh
source scripts/deploy_prowlarr_dev.sh
source scripts/deploy_flaresolverr_dev.sh

echo "Done"
