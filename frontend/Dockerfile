FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_API_KEY=venue-nexus-demo
ENV VITE_API_KEY=${VITE_API_KEY}

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
