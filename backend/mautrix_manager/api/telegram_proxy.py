# mautrix-manager - A web interface for managing bridges
# Copyright (C) 2020 Tulir Asokan
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
import asyncio

import aiohttp
from aiohttp import web
from yarl import URL

from ..config import Config
from .errors import Error

PROXY_CHUNK_SIZE = 32 * 1024
routes = web.RouteTableDef()
config: Config
host: URL
secret: str
http: aiohttp.ClientSession


async def _proxy(request: web.Request, path_prefix: str) -> web.Response:
    if not secret:
        raise Error.bridge_disabled
    query = request.query.copy()
    query["user_id"] = request["token"].user_id
    headers = request.headers.copy()
    headers["Authorization"] = f"Bearer {secret}"
    del headers["Host"]

    url = host / path_prefix

    path = request.match_info.get("path", None)
    if path:
        url /= path

    print(url)
    resp = await http.request(request.method, url, headers=headers,
                              params=query, data=request.content)
    return web.Response(status=resp.status, headers=resp.headers, body=resp.content)


@routes.view("/mautrix-telegram/user/{user_id}")
@routes.view("/mautrix-telegram/user/{user_id}/{path:.+}")
async def proxy_user(request: web.Request) -> web.Response:
    user_id = request.match_info.get("user_id", None)
    sender = request["token"].user_id
    if user_id == "me":
        user_id = sender
    elif sender != user_id and not config.get_permissions(sender).admin:
        raise Error.no_impersonation

    return await _proxy(request, f"user/{user_id}")


@routes.view("/mautrix-telegram/portal/{path:.+}")
async def proxy_portal(request: web.Request) -> web.Response:
    return await _proxy(request, "portal")


@routes.view("/mautrix-telegram/bridge")
async def proxy_bridge(request: web.Request) -> web.Response:
    return await _proxy(request, "bridge")


@routes.get("/mautrix-telegram")
async def check_status(request: web.Request) -> web.Response:
    if not secret:
        raise Error.bridge_disabled
    return web.json_response({})


def init(cfg: Config) -> None:
    global http, host, secret, config
    config = cfg
    secret = cfg["bridges.mautrix-telegram.secret"]
    if secret:
        host = URL(cfg["bridges.mautrix-telegram.url"])
    http = aiohttp.ClientSession(loop=asyncio.get_event_loop())
