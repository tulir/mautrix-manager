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

from ..config import Config
from .errors import Error

PROXY_CHUNK_SIZE = 32 * 1024
routes = web.RouteTableDef()
config: Config
host: str
http: aiohttp.ClientSession


@routes.view("/docker/{path:.+}")
async def proxy(request: web.Request) -> web.StreamResponse:
    if not config.get_permissions(request["token"].user_id).admin:
        raise Error.no_access_docker
    path = request.match_info.get("path", None)
    query = request.query.copy()
    headers = request.headers.copy()
    del headers["Host"]
    del headers["Authorization"]

    async with http.request(request.method, f"{host}/{path}", headers=headers,
                            params=query, data=request.content) as proxy_resp:
        response = web.StreamResponse(status=proxy_resp.status, headers=proxy_resp.headers)
        await response.prepare(request)
        async for chunk in proxy_resp.content.iter_chunked(PROXY_CHUNK_SIZE):
            await response.write(chunk)
        await response.write_eof()
        return response


def init(cfg: Config) -> None:
    global http, host, config
    config = cfg
    host = cfg["docker.host"]
    if host.startswith("unix://"):
        http = aiohttp.ClientSession(connector=aiohttp.UnixConnector(path=host[len("unix://"):]),
                                     loop=asyncio.get_event_loop())
        host = "unix://localhost"
    else:
        http = aiohttp.ClientSession(loop=asyncio.get_event_loop())
