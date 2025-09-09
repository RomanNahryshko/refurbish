#!/bin/bash

export NETWORK=$1||false
export PROXY_CONTAINER_NAME=$2||false
export NETWORK_SUBNET=$3||false

if [ $NETWORK_SUBNET ]; then
	export NETWORK_SUBNET="--subnet $NETWORK_SUBNET"
else
  export NETWORK_SUBNET=""
fi

if [ $NETWORK ] && [ ! "$(docker network ls | grep -e '\s'$NETWORK'\s')" ]; then
  echo "Network Creating..."
	docker network create $NETWORK_SUBNET --attachable --driver overlay $NETWORK
	echo "Network Created with subnet: $NETWORK_SUBNET"
fi

if [ $NETWORK ] && [ $PROXY_CONTAINER_NAME ] && [ ! "$(docker inspect $PROXY_CONTAINER_NAME -f '{{json .NetworkSettings.Networks }}' | grep -e '\"'$NETWORK'\"')" ]; then
    # We should sleep script, cuz network can be created recently and needs time to be attachable
    sleep 10
    echo "Proxy Connecting..."
    docker network connect $NETWORK $PROXY_CONTAINER_NAME
    echo "Proxy Connected..."
fi

echo $(docker inspect -f '{{ range $k, $v:=.NetworkSettings.Networks }}{{ if eq $k "'$NETWORK'" }}{{.IPAddress}}{{end}}{{end}}' $PROXY_CONTAINER_NAME)