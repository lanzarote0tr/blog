# Choose a fixed LTS, not :latest
FROM node:20-alpine

# App directory
WORKDIR /app

# Install deps first to leverage caching
COPY package*.json ./
# Use npm ci if you have a lockfile; omit dev deps for production
RUN npm ci --omit=dev

# Copy the rest of your source (excluding files in .dockerignore)
COPY . .

# Drop privileges
RUN chown -R node:node /app
USER node

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "bin/www"]
