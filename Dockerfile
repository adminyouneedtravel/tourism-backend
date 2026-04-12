FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /tmp/logs

ENV LOG_DIR=/tmp/logs

RUN python manage.py collectstatic --no-input

RUN chmod +x start.sh

CMD ["./start.sh"]
