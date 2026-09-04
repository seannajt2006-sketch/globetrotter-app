# Python 3.13-slim image for backend Flask server
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app


COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


COPY run.py .
COPY app ./app
COPY data ./data

EXPOSE 5000

ENV PORT=5000
ENV FLASK_DEBUG=0
ENV PYTHONPATH=/globetrotter

CMD ["python", "run.py"]
CMD ["python", "run.py"]
CMD ["python", "run.py"]
