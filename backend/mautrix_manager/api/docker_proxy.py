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
from .initable import initializer
from .errors import Error

PROXY_CHUNK_SIZE = 32 * 1024
routes = web.RouteTableDef()
config: Config
host: URL
http: aiohttp.ClientSession


@routes.view("/docker/{path:.+}")
async def proxy(request: web.Request) -> web.Response:
    if not config.get_permissions(request["token"].user_id).admin:
        raise Error.no_access_docker
    path = request.match_info["path"]
    query = request.query.copy()
    headers = request.headers.copy()
    del headers["Host"]
    del headers["Authorization"]

    try:
        timeout = aiohttp.ClientTimeout(total=None, connect=5, sock_connect=5, sock_read=None)
        resp = await http.request(request.method, host / path, headers=headers,
                                  params=query, data=request.content, timeout=timeout)
    except aiohttp.ClientError:
        raise web.HTTPBadGateway(text="Failed to contact Docker daemon")
    return web.Response(status=resp.status, headers=resp.headers, body=resp.content)


@initializer
def init(cfg: Config, app: web.Application) -> None:
    global http, host, config
    config = cfg
    host = cfg["docker.host"]
    if host.startswith("unix://"):
        http = aiohttp.ClientSession(connector=aiohttp.UnixConnector(path=host[len("unix://"):]),
                                     loop=asyncio.get_event_loop())
        host = "unix://localhost"
    else:
        http = aiohttp.ClientSession(loop=asyncio.get_event_loop())
    host = URL(host)
    app.add_routes(routes)
