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
from .auth import routes as auth_routes, token_middleware, init as auth_init
from .docker_proxy import routes as docker_routes, init as docker_init
from .generic_proxy import init as generic_proxy_init
from .telegram_proxy import routes as telegram_routes, init as telegram_init
from .facebook_proxy import routes as facebook_routes, init as facebook_init
from .whatsapp_proxy import routes as whatsapp_routes, init as whatsapp_init

integrations_app = web.Application()
integrations_app.add_routes(auth_routes)

api_app = web.Application(middlewares=[token_middleware])
api_app.add_routes(docker_routes)
api_app.add_routes(telegram_routes)
api_app.add_routes(facebook_routes)
api_app.add_routes(whatsapp_routes)


def init(config: Config) -> None:
    auth_init(config)
    docker_init(config)
    generic_proxy_init()
    telegram_init(config)
    facebook_init(config)
    whatsapp_init(config)
