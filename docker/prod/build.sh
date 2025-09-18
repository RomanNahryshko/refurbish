#!/bin/bash

export HUB_PWD=$1
export COMPOSE_FILE=$2
export BUILD_FLAGS=$3||''
export DOCKER_HOST=tcp://95.217.158.135:2376
export DOCKER_CERT_PATH='/certs/builder'

docker-compose config
docker-compose build $BUILD_FLAGS
docker login -p $HUB_PWD -u attractuser docker.attractgroup.com
docker-compose push
