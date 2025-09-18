FROM nginx:1.25-alpine

RUN apk add --no-cache ca-certificates


COPY docker/prod/proxy/nginx.conf /etc/nginx/nginx.conf
