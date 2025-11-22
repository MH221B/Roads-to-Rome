# Multi-stage Dockerfile for backend
# Builder: install deps and build TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install (includes devDependencies for build)
COPY package*.json ./
RUN npm ci --silent

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Runtime image: lightweight, only runtime files
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy package.json (for metadata) and production node_modules and built dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Expose the port your app uses (adjust if different)
EXPOSE 3000

# Start the server
CMD ["node","dist/index.js"]
