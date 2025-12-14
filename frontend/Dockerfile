# Multi-stage build for minimal production image

# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production=false

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve with lightweight HTTP server
FROM node:22-alpine

WORKDIR /app

# Install only serve (much smaller than full Node.js with all deps)
RUN npm install -g serve@14.2.1

# Copy only the built dist folder from builder stage
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 5173

# Start serve
CMD ["serve", "-s", "dist", "-l", "5173", "--no-port-switching"]