
# Stage 1: Build the Node.js application
FROM node:18 AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript application
RUN npm run build

# Stage 2: Run the Node.js application
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy the built files from the previous stage
COPY --from=build /app/dist /app/dist
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm install --only=production

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]