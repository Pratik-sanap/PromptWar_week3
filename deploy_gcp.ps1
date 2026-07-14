# deploy_gcp.ps1 - Automated PowerShell script to deploy the Smart Stadium Concierge Backend to Google Cloud Run

$ErrorActionPreference = "Stop"

$SERVICE_NAME = "stadium-concierge-backend"
$REGION = "us-central1"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Checking Google Cloud SDK authentication..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if logged in
$activeAccount = gcloud auth list --filter="status:ACTIVE" --format="value(account)"
if ([string]::IsNullOrEmpty($activeAccount)) {
    Write-Host "No active Google Cloud account found. Starting login flow..." -ForegroundColor Yellow
    gcloud auth login
}

# Set project
$PROJECT_ID = gcloud config get-value project 2>$null
if ([string]::IsNullOrEmpty($PROJECT_ID) -or $PROJECT_ID -eq "(unset)") {
    $PROJECT_ID = Read-Host "No default project set. Please enter your Google Cloud Project ID"
    gcloud config set project $PROJECT_ID
}

Write-Host "Using GCP Project: $PROJECT_ID" -ForegroundColor Green

# Prompt for Gemini API Key if not already in env
$GEMINI_KEY = $env:GEMINI_API_KEY
if ([string]::IsNullOrEmpty($GEMINI_KEY)) {
    Write-Host "GEMINI_API_KEY is not set in your environment variables." -ForegroundColor Yellow
    $GEMINI_KEY = Read-Host -AsSecureString "Please enter your Gemini API Key (or press Enter to deploy without a key)"
    # Convert SecureString to plain text
    if ($GEMINI_KEY) {
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($GEMINI_KEY)
        $GEMINI_KEY_PLAIN = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    } else {
        $GEMINI_KEY_PLAIN = ""
    }
} else {
    $GEMINI_KEY_PLAIN = $GEMINI_KEY
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "Building and pushing container image..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Submit build to Google Cloud Build from project root
gcloud builds submit --tag "gcr.io/$PROJECT_ID/$SERVICE_NAME" --ignore-file=backend/.gcloudignore backend/

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Deploying to Google Cloud Run..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Deploy service to Cloud Run
if ($GEMINI_KEY_PLAIN) {
    gcloud run deploy $SERVICE_NAME `
        --image "gcr.io/$PROJECT_ID/$SERVICE_NAME" `
        --platform managed `
        --region $REGION `
        --allow-unauthenticated `
        --set-env-vars "GEMINI_API_KEY=$GEMINI_KEY_PLAIN,ALLOWED_ORIGINS=*"
} else {
    gcloud run deploy $SERVICE_NAME `
        --image "gcr.io/$PROJECT_ID/$SERVICE_NAME" `
        --platform managed `
        --region $REGION `
        --allow-unauthenticated `
        --set-env-vars "ALLOWED_ORIGINS=*"
}

# Fetch and display service URL
$SERVICE_URL = gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format="value(status.url)"

Write-Host "==========================================" -ForegroundColor Green
Write-Host "Deployment successful!" -ForegroundColor Green
Write-Host "Service URL: $SERVICE_URL" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Update your frontend environment variables to point to this URL:" -ForegroundColor Yellow
Write-Host "VITE_BACKEND_URL=$SERVICE_URL" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Green
