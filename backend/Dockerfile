# Use the official lightweight Python image.
# https://hub.docker.com/_/python
FROM python:3.11-slim

# Allow statements and log messages to immediately appear in the logs
ENV PYTHONUNBUFFERED=True

# Set working directory to app home
ENV APP_HOME=/app
WORKDIR $APP_HOME

# Copy the requirements file and install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend files (folders like backend, ai, routes etc. need to match local structure)
# To preserve the 'backend.routes' import paths, we copy the current backend directory content
# to /app/backend in the container.
COPY . ./backend

# Set the python path so that backend imports work correctly from /app
ENV PYTHONPATH=/app

# Run the web service on container startup.
# We bind to port 8080 by default (Cloud Run standard).
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
