#!/bin/bash
echo "Stopping n8n..."
docker stop n8n
docker rm n8n
echo "n8n container stopped and removed."
