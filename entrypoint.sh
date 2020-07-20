#!/bin/bash
set -euf -o pipefail

yq w -i /data/config.yaml server.database postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST:-"novachat-postgres"}/${POSTGRES_DB}

BRIDGES=("whatsapp" "facebook" "telegram" "hangouts" "hangouts2" "whatsapp2")
MXBRIDGES=( "slack" "instagram" "skype" "discord")

# For each bridge, request a token from NovaChat homeserver
for BRIDGE_NAME in "${BRIDGES[@]}"
do
    sharedSecret=$(curl -s -H 'Authorization: Bearer '$ASMUXBEARER \
    -d "{\"address\": \"${NOVA_DOMAIN}/${BRIDGE_NAME}\"}" \
    -X PUT https://asmux.nova.chat/_matrix/asmux/appservice/$NOVA_USERNAME/$BRIDGE_NAME | jq -r '.login_shared_secret')

    yq w -i /data/config.yaml bridges.mautrix-$BRIDGE_NAME.url ${NOVA_DOMAIN}/${BRIDGE_NAME}/_matrix/provision/v1
    yq w -i /data/config.yaml bridges.mautrix-$BRIDGE_NAME.secret $sharedSecret
done

sed -i 's/$(user)/'"$NOVA_USERNAME"'/g' /data/config.yaml

cat /data/config.yaml

/opt/mautrix-manager/docker-run.sh
