FROM rust:1.86-slim

SHELL ["bash", "-c"]

RUN apt-get update && apt-get install -y \
    pkg-config \
    protobuf-compiler \
    clang \
    make \
    jq

RUN rustup target add wasm32-unknown-unknown
RUN cargo install --locked linera-service@0.15.5 linera-storage-service@0.15.5

RUN apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm http-server

WORKDIR /build

# Copy all project files
COPY . .

# Install backend dependencies
RUN cd backend-v2 && npm install

# Install frontend dependencies and build
RUN cd frontend-v2 && npm install && npm run build

# Make run.bash executable
RUN chmod +x run.bash

HEALTHCHECK CMD ["curl", "-s", "http://localhost:5173"]

ENTRYPOINT ["bash", "/build/run.bash"]
