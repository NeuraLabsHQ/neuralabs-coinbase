FROM node:22-alpine3.18 as build

WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

RUN npm install

# Copy source files and configuration
COPY public/ ./public
COPY src/ ./src
COPY index.html ./
COPY vite.config.js ./
COPY vitest.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY tsconfig.json ./

# Copy production environment file as .env
COPY production.env .env

ENV GENERATE_SOURCEMAP=false

# Debug: List files before build
RUN ls -la

# Run the build
RUN npm run build

# Debug: Check if dist directory was created
RUN ls -la && ls -la dist/

# Production stage
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy static assets from builder stage (Vite builds to 'dist' not 'build')
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
# COPY nginx_config/custom-nginx.conf /etc/nginx/nginx.conf
# COPY nginx_config/real-ip.conf /etc/nginx/conf.d/real-ip.conf
# COPY nginx_config/default.conf /etc/nginx/conf.d/default.conf
# COPY nginx_config/nginx.conf /etc/nginx/nginx.conf
COPY nginx_config/nginx.conf /etc/nginx/conf.d/default.conf




# COPY nginx_config/nginx.conf /etc/nginx/nginx.conf
# Create directory for logs if it doesn't exist
RUN mkdir -p /var/log/nginx

# Ensure correct permissions
RUN chown -R nginx:nginx /var/log/nginx

# EXPOSE 80

# CMD ["nginx", "-g", "daemon off;"]
