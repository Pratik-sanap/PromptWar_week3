#!/bin/bash
# deploy_gcp.sh - Automated script to deploy the Smart Stadium Concierge Backend to Google Cloud Run

# Set exit on error
set -e

# Configuration
SERVICE_NAME="stadium-concierge-backend"
REGION="us-central1"

echo "=========================================="
echo "Checking Google Cloud SDK authentication..."
echo "=========================================="

# Check if logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo "No active Google Cloud account found. Starting login flow..."
    gcloud auth login
fi

# Set project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
    echo "No default project set. Please enter your Google Cloud Project ID:"
    read -r PROJECT_ID
    gcloud config set project "$PROJECT_ID"
fi

echo "Using GCP Project: $PROJECT_ID"

# Prompt for Gemini API Key if not already in env
if [ -z "$GEMINI_API_KEY" ]; then
    echo "GEMINI_API_KEY is not set in your shell environment."
    echo "Please enter your Gemini API Key (or press Enter to deploy without a key - it will degrade to offline/mock mode):"
    read -r -s GEMINI_API_KEY
    echo
fi

echo "=========================================="
echo "Building and pushing container image..."
echo "=========================================="

# Submit build to Google Cloud Build from project root
gcloud builds submit --tag "gcr.io/$PROJECT_ID/$SERVICE_NAME" --ignore-file=backend/.gcloudignore backend/

echo "=========================================="
echo "Deploying to Google Cloud Run..."
echo "=========================================="

# Deploy service to Cloud Run
if [ -n "$GEMINI_API_KEY" ]; then
    gcloud run deploy "$SERVICE_NAME" \
        --image "gcr.io/$PROJECT_ID/$SERVICE_NAME" \
        --platform managed \
        --region "$REGION" \
        --allow-unauthenticated \
        --set-env-vars "GEMINI_API_KEY=$GEMINI_API_KEY,ALLOWED_ORIGINS=*"
else
    gcloud run deploy "$SERVICE_NAME" \
        --image "gcr.io/$PROJECT_ID/$SERVICE_NAME" \
        --platform managed \
        --region "$REGION" \
        --allow-unauthenticated \
        --set-env-vars "ALLOWED_ORIGINS=*"
fi

# Fetch and display service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --platform managed --region "$REGION" --format="value(status.url)")

echo "=========================================="
echo "Deployment successful!"
echo "Service URL: $SERVICE_URL"
echo "=========================================="
echo "Update your frontend environment variables to point to this URL:"
echo "VITE_BACKEND_URL=$SERVICE_URL"
echo "=========================================="
