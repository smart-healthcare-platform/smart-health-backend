# Stage 1: Build the TypeScript application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Stage 2: Run the production application
FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies only
RUN npm install --only=production

# Copy built application from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.sequelizerc ./.sequelizerc
COPY --from=builder /app/src/config/database.js ./src/config/database.js

# Expose the application port
EXPOSE 3001

# Define the command to run the application
CMD ["node", "dist/app.js"]