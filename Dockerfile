# Use the official Python image as a base
FROM python:3.11-slim

# Set environment variables to prevent Python from writing .pyc files
# and to disable buffering for easier logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    portaudio19-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code to the container
COPY . .

# Set environment variables for Google Cloud credentials and API key
# Adjust the path if your JSON file is located elsewhere
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/accenture-437813-595df4ae3905.json
ENV GOOGLE_API_KEY="AIzaSyCraK5YSZPttytIGZxaiixZNHvYDjnAkO8"

EXPOSE 5001

# Command to run the Flask app
CMD python3 flask_app.py 