#!/bin/bash
python manage.py migrate --no-input
exec gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
