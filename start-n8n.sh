#!/bin/bash
echo "Starting n8n..."
docker run -d --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  -e N8N_HOST="0.0.0.0" \
  -e N8N_PORT=5678 \
  -e N8N_PROTOCOL="https" \
  -e N8N_EDITOR_BASE_URL="https://obscure-enigma-jjqwr695pjvwfqxjr-5678.app.github.dev" \
  -e WEBHOOK_URL="https://obscure-enigma-jjqwr695pjvwfqxjr-5678.app.github.dev" \
  --restart unless-stopped \
  docker.n8n.io/n8nio/n8n
echo "n8n started! Access it at https://obscure-enigma-jjqwr695pjvwfqxjr-5678.app.github.dev
