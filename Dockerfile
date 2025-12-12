FROM rust:1.86-slim

SHELL ["bash", "-c"]

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    protobuf-compiler \
    clang \
    make \
    jq \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Rust toolchain
RUN rustup target add wasm32-unknown-unknown

# Install Linera (with retry logic for network issues)
RUN for i in 1 2 3; do \
    cargo install --locked linera-service@0.15.5 linera-storage-service@0.15.5 && break || \
    (echo "Retry $i failed, waiting..." && sleep 10); \
    done

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Copy all project files
COPY . .

# Install backend dependencies
WORKDIR /build/backend-v2
RUN npm ci --only=production

# Install frontend dependencies and build
WORKDIR /build/frontend-v2
RUN npm ci && npm run build

WORKDIR /build

# Make run.bash executable
RUN chmod +x run.bash

# Expose ports
EXPOSE 3001 5173 8080 8081 8090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

ENTRYPOINT ["bash", "/build/run.bash"]
