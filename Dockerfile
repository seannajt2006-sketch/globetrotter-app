# Python 3.9-slim image for backend Flask server
FROM python:3.9-slim

WORKDIR /globetrotter

# Copy requirements file first to leverage Docker caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source code
COPY app ./app
COPY data ./data

# Expose backend API port
EXPOSE 5000

# Set environment variables
ENV PORT=5000
ENV FLASK_DEBUG=0

# Command to execute Flask backend app
CMD ["python", "app/main.py"]
