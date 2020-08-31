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
import logging

from ..config import Config
from .errors import Error
from .initable import initializer
from .generic_proxy import proxy

routes = web.RouteTableDef()
config: Config
host: URL
secret: str
domain: str


log = logging.getLogger("mau.manager.proxy")


@routes.view("/mautrix-facebook/{path:.+}")
async def proxy_all(request: web.Request) -> web.Response:
    if not secret:
        raise Error.bridge_disabled
    return await proxy(host, secret, request, "api")


@routes.get("/mautrix-facebook")
async def check_status(_: web.Request) -> web.Response:
    if not secret:
        raise Error.bridge_disabled
    return web.json_response({"domain": domain})


@initializer
def init(cfg: Config, app: web.Application) -> None:
    global host, secret, config, domain
    config = cfg
    secret = cfg["bridges.mautrix-facebook.secret"]
    if secret:
        host = URL(cfg["bridges.mautrix-facebook.url"])
        domain = cfg["bridges.mautrix-facebook.domain"]
        if domain not in ("messenger.com", "facebook.com"):
            log.warning("mautrix-facebook domain should be facebook.com or messenger.com")

    app.add_routes(routes)
