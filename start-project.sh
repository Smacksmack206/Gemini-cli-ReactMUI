#!/bin/bash

# This script orchestrates the startup of the Gemini CLI Web App.
# It ensures a clean environment by stopping and removing old Docker containers
# before starting all the necessary services.

echo "--- Stopping all services and cleaning up Docker environment ---"
docker-compose down --volumes --rmi all

echo ""
echo "--- Starting frontend, Docker backend, and local backend ---"
npm run dev
