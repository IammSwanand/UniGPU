FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Create uploads directory and celery beat schedule directory
RUN mkdir -p uploads && \
    mkdir -p /var/celery && \
    chown -R 1000:1000 /var/celery

EXPOSE 8000

# Start Uvicorn on Railway's dynamic PORT (fallback to 8000 for local/dev)
# --proxy-headers: trust X-Forwarded-For / X-Forwarded-Proto from reverse proxies
# --workers 1: MUST be 1 because WebSocket connections live in-memory (ConnectionManager)
# Multiple workers means HTTP requests may hit a different process than the one
# holding the WebSocket, causing job dispatch to fail (manager.is_connected → False)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --proxy-headers --forwarded-allow-ips '*'"]
