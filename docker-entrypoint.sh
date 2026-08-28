#!/bin/sh
set -e

# Ensure /app/data directory exists and is fully writable by nextjs user
mkdir -p /app/data
chmod 777 /app/data 2>/dev/null || true

# If running as root, switch to nextjs user, otherwise exec directly
if [ "$(id -u)" = '0' ]; then
    chown -R nextjs:nodejs /app/data 2>/dev/null || true
    exec su -s /bin/sh nextjs -c 'exec "$@"' -- "$@"
else
    exec "$@"
fi
