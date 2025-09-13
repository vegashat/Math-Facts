# Stage 1: Build Angular app
FROM node:20 AS build

WORKDIR /app

# Copy dependencies first (for caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Build Angular app (production)
RUN npm run build -- --configuration production

# Stage 2: Serve with Nginx
FROM nginx:1.27-alpine

# Copy built Angular files (note the /browser)
COPY --from=build /app/dist/math-facts/browser /usr/share/nginx/html

# Copy custom nginx config (for Angular routes)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]