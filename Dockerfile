# Stage 1: Build Angular app
FROM node:20 AS build

WORKDIR /app

# Install dependencies first (cache-friendly)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Build Angular app (production)
RUN npm run build -- --configuration production

# Stage 2: Nginx serve
FROM nginx:1.27-alpine

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy built Angular app
COPY --from=build /app/dist/math-facts/browser /usr/share/nginx/html

# Copy our custom config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]