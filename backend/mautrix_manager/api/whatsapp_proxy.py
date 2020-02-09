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
from aiohttp import web
from yarl import URL

from ..config import Config
from .errors import Error
from .generic_proxy import proxy
from . import generic_proxy

routes = web.RouteTableDef()
config: Config
host: URL
secret: str


@routes.view("/mautrix-whatsapp/login")
async def proxy_login(request: web.Request) -> web.WebSocketResponse:
    print("Hello")
    if not secret:
        raise Error.bridge_disabled
    query = request.query.copy()
    query["user_id"] = request["token"].user_id
    url = (host / "login").with_query(query)
    headers = request.headers.copy()
    headers["Authorization"] = f"Bearer {secret}"
    resp = web.WebSocketResponse()
    await resp.prepare(request)
    async with generic_proxy.http.ws_connect(url, headers=headers) as websocket:
        close = False
        while not close:
            data = await websocket.receive_json()
            if "success" in data:
                close = True
            await resp.send_json(data)
    return resp


@routes.view("/mautrix-whatsapp/{path:.+}")
async def proxy_all(request: web.Request) -> web.Response:
    print("Hello?")
    if not secret:
        raise Error.bridge_disabled
    return await proxy(host, secret, request, "")


@routes.get("/mautrix-whatsapp")
async def check_status(_: web.Request) -> web.Response:
    if not secret:
        raise Error.bridge_disabled
    return web.json_response({})


def init(cfg: Config) -> None:
    global host, secret, config
    config = cfg
    secret = cfg["bridges.mautrix-whatsapp.secret"]
    if secret:
        host = URL(cfg["bridges.mautrix-whatsapp.url"])
