FROM python:3.14.4-slim@sha256:538a18f1db92b4210a0b71aca2d14c156a96dedbe8867465c8ff4dce04d2ec39

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    g++ \
    && apt-get -y clean && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:0.11.3@sha256:90bbb3c16635e9627f49eec6539f956d70746c409209041800a0280b93152823 /uv /bin/uv
RUN curl -fsS https://dotenvx.sh | sh

# Python-related environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONUTF8=1 \
    PYTHONIOENCODING="UTF-8" \
    PYTHONBREAKPOINT="IPython.terminal.debugger.set_trace" \
    UV_LINK_MODE=copy

WORKDIR /app/

ENV PATH="/app/.venv/bin:$PATH"

# Install dependencies
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#intermediate-layers
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project

ENV PYTHONPATH=/app

COPY ./pyproject.toml ./uv.lock ./alembic.ini ./README.md /app/

COPY ./src /app/src
COPY ./scripts /app/scripts
COPY ./alembic /app/alembic

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync

CMD ["/app/scripts/startup.sh"]
