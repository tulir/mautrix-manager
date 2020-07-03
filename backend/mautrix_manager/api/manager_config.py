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
from typing import Dict

from aiohttp import web

from ..config import Config
from .initable import initializer

routes = web.RouteTableDef()
features: Dict[str, bool]


@routes.get("/manager/config")
async def check_status(_: web.Request) -> web.Response:
    return web.json_response(features)


@initializer
def init(cfg: Config, app: web.Application) -> None:
    global features
    features = cfg["features"]
    app.add_routes(routes)
