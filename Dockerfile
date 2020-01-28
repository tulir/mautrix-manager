FROM node:lts-alpine AS builder

COPY ./frontend /opt/mautrix-manager/frontend
WORKDIR /opt/mautrix-manager/frontend
ENV NODE_ENV=production
RUN yarn && yarn snowpack && rm -rf node_modules package.json yarn.lock

FROM alpine:3.11

COPY --from=builder /opt/mautrix-manager/frontend /opt/mautrix-manager/frontend
COPY ./backend /opt/mautrix-manager/backend

WORKDIR /opt/mautrix-manager/backend

RUN apk add --no-cache --virtual .build-deps \
        python3-dev \
        build-base \
        git \
    && apk add --no-cache \
		python3 \
		su-exec \
	&& pip3 install . \
	&& rm -rf /opt/mautrix-manager/backend/mautrix_manager \
	&& apk del .build-deps

ENV UID=1337 GID=1337
VOLUME /data

CMD ["/opt/mautrix-manager/docker-run.sh"]
