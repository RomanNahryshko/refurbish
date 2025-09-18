FROM nginx:1.25-alpine

RUN apk add --no-cache ca-certificates

COPY docker/proxy/nginx.conf /etc/nginx/nginx.conf