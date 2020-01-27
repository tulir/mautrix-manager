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

from ..config import Config
from .auth import routes as auth_routes, token_middleware
from .docker_proxy import routes as proxy_routes, init as proxy_init

integrations_app = web.Application()
integrations_app.add_routes(auth_routes)

api_app = web.Application(middlewares=[token_middleware])
api_app.add_routes(proxy_routes)


def init(config: Config) -> None:
    proxy_init(config)
