FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 4000

ENV NODE_ENV=production

# Start server
CMD ["node", "dist/index.js"]

