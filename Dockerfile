FROM nginx:alpine

RUN apk add --no-cache bash

WORKDIR /usr/share/nginx/html

COPY . .

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN mkdir -p js

RUN chmod +x init-firebase.sh

EXPOSE 80

CMD ["sh", "-c", "./init-firebase.sh && nginx -g 'daemon off;'"]