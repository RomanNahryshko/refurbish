#!/bin/bash

export HUB_PWD=$1
export COMPOSE_FILE_DEPLOY=$2
export COMPOSE_FILE=$3||""

if [ "$COMPOSE_FILE" != "" ]
then
  docker login -p $HUB_PWD -u attractuser docker.attractgroup.com

  docker-compose config
  docker-compose pull
fi

## NOTE: Job will fails if you have in docker-compose.swarm.yml file any volumes that don't physically exists on server.
## NOTE: Swarm doesn't create volumes automatically.
docker stack deploy -c ${COMPOSE_FILE_DEPLOY} ${COMPOSE_PROJECT_NAME}