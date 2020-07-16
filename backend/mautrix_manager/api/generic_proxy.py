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
import logging.config

from aiohttp import web
from yarl import URL

from .errors import Error
from .initable import initializer

http: aiohttp.ClientSession

log = logging.getLogger("mau.manager.init")

async def proxy(url: URL, secret: str, request: web.Request, path_prefix: str) -> web.Response:
    if not secret:
        raise Error.bridge_disabled
    query = request.query.copy()
    query["user_id"] = request["token"].user_id
    headers = request.headers.copy()
    headers["Authorization"] = f"Bearer {secret}"

    if path_prefix:
        url /= path_prefix

    path = request.match_info.get("path", None)
    if path:
        url /= path

    try:
        resp = await http.request(request.method, url, headers=headers,
                                  params=query, data=request.content)
    except aiohttp.ClientError as e:
        log.fatal("Failed to proxy request, error:", e)
        raise web.HTTPBadGateway(text="Failed to contact bridge")

    return web.Response(status=resp.status, headers=resp.headers, body=resp.content)


@initializer
def init(*_) -> None:
    global http
    http = aiohttp.ClientSession(loop=asyncio.get_event_loop())
