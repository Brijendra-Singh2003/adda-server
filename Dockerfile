# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory in container
WORKDIR /usr/src/app

# Copy only package files first (for better layer caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose port (change if your app uses a different one)
EXPOSE 3000

# Start the app
CMD ["node", "index.js"]
