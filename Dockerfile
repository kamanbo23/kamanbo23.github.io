FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libc6-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend files
COPY backend/ /app/

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Make start script executable
RUN chmod +x railway_start.sh

# Expose the port
EXPOSE 8080

# Run the application
CMD ["./railway_start.sh"] 