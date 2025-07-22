# Use a Node.js image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Declare build argument for the Gemini API key
ARG GEMINI_API_KEY
# Set environment variable from build argument
ENV GEMINI_API_KEY=${GEMINI_API_KEY}

# Copy package.json and install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Expose the port the backend server runs on
EXPOSE 3001

# Command to run the backend server
CMD ["npm", "start"]
