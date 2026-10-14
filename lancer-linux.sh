#!/bin/sh
# Apostle — démarre l'application en local, avec le micro autorisé.
cd "$(dirname "$0")" || exit 1
echo "Apostle démarre sur http://localhost:8000"
( sleep 1; xdg-open "http://localhost:8000/index.html" >/dev/null 2>&1 ) &
python3 -m http.server 8000
