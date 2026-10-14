#!/bin/sh
# Apostle — démarre l'application en local, avec le micro autorisé.
cd "$(dirname "$0")" || exit 1
echo "Apostle démarre sur http://localhost:8000"
echo "Laissez cette fenêtre ouverte pendant l'utilisation."
( sleep 1; open "http://localhost:8000/index.html" ) &
python3 -m http.server 8000
