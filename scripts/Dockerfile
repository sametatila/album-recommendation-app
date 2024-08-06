FROM python:3.8-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    curl \
    gnupg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create and activate virtual environment
RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"

# Install Python dependencies
COPY requirements.txt /app/requirements.txt
RUN /venv/bin/pip install --upgrade pip \
    && /venv/bin/pip install -r /app/requirements.txt

# Copy the application code
COPY . /app

# Set the working directory
WORKDIR /app

# Command to run the script
CMD ["tail", "-f", "/dev/null"]
