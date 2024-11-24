#!/bin/bash

# Azure login
az login

# ACR login
az acr login --name protravka

# Get the version from package.json with npm
version=$(npm run --silent get-version)

# Output version to the console
echo "Deploying version $version"

# Tag the Docker image
docker tag protravka-backend protravka.azurecr.io/protravka-backend:$version

# Push the Docker image to the registry
docker push protravka.azurecr.io/protravka-backend:$version

# Redeploy the application
az containerapp update --name protravka-backend --resource-group protravka --image protravka.azurecr.io/protravka-backend:$version