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
from .initable import init as init_all
from .auth import routes as auth_routes, token_middleware, init as auth_init
from . import (docker_proxy, generic_proxy, telegram_proxy, facebook_proxy, hangouts_proxy,
               whatsapp_proxy, slack_proxy, twitter_proxy, tracking)

integrations_app = web.Application()
integrations_app.add_routes(auth_routes)

api_app = web.Application(middlewares=[token_middleware])


def init(config: Config) -> None:
    auth_init(config)
    init_all(config, api_app)
