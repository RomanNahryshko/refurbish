#!/bin/bash

# Check if argument is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <service_name>"
  exit 1
fi

SERVICE_NAME=$1
CHECK_INTERVAL=5

# Function to get UpdateStatus.State
get_update_status() {
  docker service inspect "$SERVICE_NAME" --format '{{json .UpdateStatus}}' 2>/dev/null | jq -r '.State' 2>/dev/null
}

# Initial check
STATUS=$(get_update_status)

if [ "$STATUS" == "null" ] || [ -z "$STATUS" ]; then
  echo "This is the first run of the service, or the service has no update history."
  exit 0
fi

echo "Initial UpdateStatus.State: $STATUS"

# Loop to check the update status
while [ "$STATUS" == "updating" ] || [ "$STATUS" == "rollback_started" ]; do
  echo "Service is updating or an update rollback is in progress..."
  sleep $CHECK_INTERVAL
  STATUS=$(get_update_status)
done

# Final status check
case $STATUS in
  completed)
    echo "Service has been updated successfully."
    exit 0
    ;;
  paused)
    echo "Service update has been paused due to failure or early termination of task."
    exit 1
    ;;
  rollback_paused)
    echo "Service rollback has been paused."
    exit 1
    ;;
  rollback_completed)
    echo "Service rollback has been completed successfully."
    exit 0
    ;;
  failed)
    echo "There was a problem with updating the service."
    exit 1
    ;;
  *)
    echo "Unexpected UpdateStatus.State: $STATUS"
    exit 1
    ;;
esac