# Relentless Agent - Production Dockerfile
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY relentless_agent.py .
COPY job_manager.py .
COPY dashboard.py .
COPY bot_orchestrator.py .
COPY bot_executor.py .
COPY lead_generation_workflow.py .
COPY customer_intake_automation.py .
COPY hallucination_prevention.py .
COPY monitor_24_7.py .
COPY browser_control.py .
COPY run_server.py .

# Copy tools
COPY tools/ ./tools/

# Copy config
COPY config/ ./config/

# Create logs directory
RUN mkdir -p logs

# Expose ports
EXPOSE 8000 8001 8002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Run with gunicorn for production
CMD ["gunicorn", "relentless_agent:app", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120"]
