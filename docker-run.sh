#!/bin/sh

# Define functions.
fixperms() {
	chown -R $UID:$GID /data /opt/mautrix-manager
}

cd /opt/mautrix-manager/backend

fixperms
exec su-exec $UID:$GID python3 -m mautrix_telegram -c /data/config.yaml
