FROM node:18-alpine

WORKDIR /app

# Copy root package.json if any (for concurrently)
COPY package*.json ./

# Install concurrently globally so we don't have to rely on local root package.json
RUN npm install -g concurrently

# Copy all project files
COPY . .

# Install dependencies for both services
WORKDIR /app/api-gateway
RUN npm install

WORKDIR /app/ai-service
RUN npm install

# Go back to root
WORKDIR /app

# Expose the API Gateway port (which now also serves the frontend)
EXPOSE 7000

# Start both services concurrently
CMD ["concurrently", "\"cd api-gateway && node index.js\"", "\"cd ai-service && node index.js\""]
