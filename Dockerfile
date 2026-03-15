FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive

# System deps + Node.js 22.x LTS
RUN apt-get update && apt-get install -y \
    curl git ca-certificates gnupg \
    build-essential python3 \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install all 3 AI CLI tools
RUN npm install -g @anthropic-ai/claude-code @openai/codex opencode-ai

# Copy agents to user-level locations (global fallback for all projects)
COPY .claude/agents/ /root/.claude/agents/
COPY .opencode/agents/ /root/.opencode/agents/
RUN mkdir -p /root/.codex
COPY AGENTS.md /root/.codex/AGENTS.md

# WebSocket shell server
COPY ws-server/ /opt/ws-server/
RUN cd /opt/ws-server && npm install --production

EXPOSE 8080

WORKDIR /root/workspace
CMD ["node", "/opt/ws-server/server.js"]
