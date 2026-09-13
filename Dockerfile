# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Python Backend & Static Server
FROM python:3.10-slim
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code and built frontend dist
COPY backend/ ./backend/
COPY --from=frontend-builder /app/dist ./dist

# Expose default port
EXPOSE 8000

# Run uvicorn bound to $PORT (compatible with Render, Railway, Fly.io, etc.)
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
