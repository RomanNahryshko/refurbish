# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY app/package.json app/package-lock.json ./

# Install the missing Geist font package
RUN npm ci
RUN npm install geist@1.3.1

# Copy the rest of the application code
COPY app/ ./

# Build the application
RUN npm run build

# Stage 2: Run the application
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Copy the built application from the previous stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Create cache directory and set permissions
RUN mkdir -p .next/cache && chown -R node:node .next

# Expose the port the app will run on
EXPOSE 3000

# Set the user to node for security
USER node

# Start the application
CMD ["node", "server.js"] 