# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (only production + dev for build)
COPY app/package.json app/package-lock.json ./
RUN npm ci

# Copy the rest of the source code
COPY app/ ./

# Build Next.js app
RUN npm run build



# Stage 2: Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Supabase environment variables (will be overridden by docker-compose)
ENV NEXT_PUBLIC_SUPABASE_URL=""
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=""
ENV SUPABASE_SERVICE_ROLE_KEY=""

# Copy package.json + lockfile to install production deps
COPY --from=builder /app/package.json /app/package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy only necessary files from builder
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

# Create cache directory and set permissions
RUN mkdir -p .next/cache && chown -R node:node .next

# Expose port
EXPOSE 3000

# Use non-root user
# USER node

# Start Next.js
CMD ["npm", "run", "start"]
