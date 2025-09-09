#!/bin/bash

export STACK_WORK_COMMAND=$1||''

if [ "$STACK_WORK_COMMAND" == "rm" ]
then
    docker  service ls | grep $COMPOSE_PROJECT_NAME | awk '{print $1}'| xargs docker service rm
fi

if [ "$STACK_WORK_COMMAND" == "rm-network" ]
then
  if [ "$(docker network ls | grep $NETWORK_NAME)" && "$(docker inspect $DOCKER_PROXY_CONTAINER_NAME -f '{{json .NetworkSettings.Networks }}' | grep $NETWORK_NAME)" ]; then
    docker network disconnect $NETWORK_NAME $DOCKER_PROXY_CONTAINER_NAME
    docker network rm $NETWORK_NAME
  fi
fi