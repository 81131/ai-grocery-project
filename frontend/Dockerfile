# Stage 1: Build the React application
FROM node:20-alpine as build
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install
RUN npm install react-image-crop lucide-react recharts @react-google-maps/api use-places-autocomplete

# Copy the rest of the frontend code
COPY . .

# Capture the build arguments and set them as environment variables for Vite
ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (Nginx default)
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]