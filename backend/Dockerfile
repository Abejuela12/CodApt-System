# CodApt backend — Node.js + Python3 + JDK
# Needed because Render's plain Node runtime doesn't include Python or Java,
# and the /api/run endpoint spawns "python3", "javac", and "java" directly.
FROM node:20-slim

# Install Python 3 and a headless JDK (javac + java) for student code execution.
# --no-install-recommends keeps the image smaller; cleaning apt lists shrinks it further.
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 openjdk-17-jdk-headless && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first so Docker can cache this layer across deploys
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the backend source
COPY . .

# Render injects PORT as an env var; server.js already reads process.env.PORT,
# so no changes needed there. 5000 here is just a fallback/documentation.
EXPOSE 5000

CMD ["node", "server.js"]
