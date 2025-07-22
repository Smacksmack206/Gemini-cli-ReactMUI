# Stage 1: Build the React application
# Use a Node.js image for building the React app
FROM node:20-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Declare build arguments for Firebase and Gemini API environment variables
# These will be passed from docker-compose.yml's build.args
ARG REACT_APP_FIREBASE_API_KEY
ARG REACT_APP_FIREBASE_AUTH_DOMAIN
ARG REACT_APP_FIREBASE_PROJECT_ID
ARG REACT_APP_FIREBASE_STORAGE_BUCKET
ARG REACT_APP_FIREBASE_MESSAGING_SENDER_ID
ARG REACT_APP_FIREBASE_APP_ID
ARG REACT_APP_FIREBASE_MEASUREMENT_ID
ARG REACT_APP_GEMINI_API_KEY # New: For the Gemini API key

# Set environment variables from build arguments
# This makes them available during the 'yarn build' step
ENV REACT_APP_FIREBASE_API_KEY=${REACT_APP_FIREBASE_API_KEY}
ENV REACT_APP_FIREBASE_AUTH_DOMAIN=${REACT_APP_FIREBASE_AUTH_DOMAIN}
ENV REACT_APP_FIREBASE_PROJECT_ID=${REACT_APP_FIREBASE_PROJECT_ID}
ENV REACT_APP_FIREBASE_STORAGE_BUCKET=${REACT_APP_FIREBASE_STORAGE_BUCKET}
ENV REACT_APP_FIREBASE_MESSAGING_SENDER_ID=${REACT_APP_FIREBASE_MESSAGING_SENDER_ID}
ENV REACT_APP_FIREBASE_APP_ID=${REACT_APP_FIREBASE_APP_ID}
ENV REACT_APP_FIREBASE_MEASUREMENT_ID=${REACT_APP_FIREBASE_MEASUREMENT_ID}
ENV REACT_APP_GEMINI_API_KEY=${REACT_APP_GEMINI_API_KEY}


# Copy package.json and yarn.lock to install dependencies
# This step is cached if dependencies haven't changed, speeding up builds
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the React application for production
# This command generates static files in the 'build' directory
RUN yarn build

# Stage 2: Serve the React application with Nginx
# Use a lightweight Nginx image for serving static files
FROM nginx:alpine

# Copy the custom Nginx configuration file
# This ensures Nginx serves the React app correctly
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove default Nginx index.html
RUN rm -rf /usr/share/nginx/html/*

# Copy the built React app from the build stage to Nginx's public directory
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80 to the outside world
EXPOSE 80

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]


