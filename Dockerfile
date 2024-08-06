FROM python:3.12.3-slim

# Install required packages
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . /app
WORKDIR /app

# curl
RUN apt-get update && apt-get install -y curl

COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1

CMD ["python", "run.py"]