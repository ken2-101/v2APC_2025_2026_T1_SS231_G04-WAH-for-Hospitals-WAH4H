#!/bin/bash
echo "Starting n8n..."
docker run -d --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  --restart unless-stopped \
  docker.n8n.io/n8nio/n8n
echo "n8n started! Access it at http://localhost:5678"
