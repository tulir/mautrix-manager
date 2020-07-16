FROM node:lts-alpine AS frontend

COPY ./frontend /opt/mautrix-manager/frontend
WORKDIR /opt/mautrix-manager/frontend
ENV NODE_ENV=production
RUN yarn && yarn snowpack && rm -rf node_modules package.json yarn.lock

FROM alpine:3.11

RUN apk add --no-cache \
	python3 \
	su-exec \
	py3-aiohttp \
	py3-ruamel.yaml \
	py3-attrs

COPY ./backend/requirements.txt /opt/mautrix-manager/backend/requirements.txt
WORKDIR /opt/mautrix-manager/backend
RUN apk add --no-cache --virtual .build-deps \
	python3-dev \
	build-base \
	git \
	&& pip3 install -r requirements.txt \
	&& apk del .build-deps

COPY ./backend /opt/mautrix-manager/backend
RUN pip3 install .

COPY --from=frontend /opt/mautrix-manager/frontend /opt/mautrix-manager/frontend
COPY ./docker-run.sh /opt/mautrix-manager
ENV UID=1337 GID=1337
VOLUME /data

ARG TARGETARCH=amd64

RUN apk --update add bash curl jq && \
	curl -sLo yq https://github.com/mikefarah/yq/releases/download/3.3.2/yq_linux_${TARGETARCH} && \
	chmod +x yq && mv yq /usr/bin/yq && \
	# We hack a bit around some non-standard UID/GID usage in the parent image: https://mau.dev/tulir/mautrix-manager/-/blob/master/Dockerfile
	mkdir /logs && \
	touch /logs/mautrix-manager.log && \
	chmod 777 /logs/mautrix-manager.log

COPY config.yaml /data/config.yaml
COPY entrypoint.sh /root/

CMD ["/root/entrypoint.sh"]
