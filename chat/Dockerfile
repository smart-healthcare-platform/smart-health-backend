# ===============================
# STAGE 1: Build TypeScript app
# ===============================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# ===============================
# STAGE 2: Runtime
# ===============================
FROM node:20-alpine

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Expose port
EXPOSE 8085

# Environment variable
ENV NODE_ENV=production

# Start application
CMD ["node", "dist/app.js"]