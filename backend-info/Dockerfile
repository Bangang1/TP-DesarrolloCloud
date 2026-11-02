# Backend Info - Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# No correr como root dentro del contenedor
RUN useradd --create-home --uid 1000 appuser
USER appuser

EXPOSE 8000

# Producción: sin --reload (en desarrollo lo agrega docker-compose.yml)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
