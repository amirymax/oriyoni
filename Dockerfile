# The backend only, and not what production runs — the server deploys from
# source under systemd (see deploy/ and the README). Kept because it is a
# self-contained way to run the API without a local Python environment.
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# libpq for psycopg. Build tooling is deliberately absent: psycopg[binary]
# ships wheels, so nothing here needs a compiler.
RUN apt-get update \
    && apt-get install --no-install-recommends -y libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copied first so that changing application code does not reinstall the world.
COPY requirements/ requirements/
RUN pip install --no-cache-dir -r requirements/prod.txt

COPY . .

# Collected at build time so the image is ready to serve, and with a dummy key
# because collectstatic reads settings but touches neither the database nor
# anything the real secret protects.
RUN DJANGO_SECRET_KEY=build-only DJANGO_DEBUG=False \
    python manage.py collectstatic --noinput

# Runs unprivileged: a container that never needs to write to its own image
# has no reason to be root.
RUN useradd --create-home --uid 1000 oriyoni && chown -R oriyoni /app
USER oriyoni

EXPOSE 8000

# Two threads per worker suits a database-bound app; raise workers to about
# twice the core count on the host.
CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--threads", "2", \
     "--timeout", "60", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
