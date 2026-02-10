# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS runner

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from builder stage
# Since the app uses base path /situation-monitor, copy to root and nginx will serve it
COPY --from=builder /app/build /usr/share/nginx/html

# Copy the app.html fallback for SPA routing
RUN cp /usr/share/nginx/html/app.html /usr/share/nginx/html/index.html || true

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
