# Backend Dockerfile
FROM node:22-alpine

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code (excluding unnecessary files)
COPY server.js ./
COPY db.js ./
COPY cache.js ./
COPY models ./models
COPY routes ./routes
COPY middleware ./middleware

# Copy utils directory
COPY utils ./utils

# Create uploads directory structure with proper permissions
RUN mkdir -p /app/uploads/covers /app/uploads/images && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose the port the app runs on
EXPOSE 3000

# Health check (use /health endpoint)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]
