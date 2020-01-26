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
from pkg_resources import resource_filename
from aiohttp import web

from .api import api_app, integrations_app
from .static import StaticResource
from .config import Config

runner: web.AppRunner


def _create_app(config: Config) -> web.Application:
    app = web.Application()

    app.add_subapp("/_matrix/integrations/v1", integrations_app)
    app.add_subapp("/api", api_app)
    integrations_app["config"] = config
    api_app["config"] = config

    resource_path = (config["server.override_resource_path"]
                     or resource_filename("mautrix_manager", "frontend"))
    app.router.register_resource(StaticResource("/", resource_path, name="frontend"))

    return app


async def start(config: Config) -> None:
    global runner
    runner = web.AppRunner(_create_app(config))
    await runner.setup()
    site = web.TCPSite(runner, config["server.host"], config["server.port"])
    await site.start()


async def stop() -> None:
    await runner.cleanup()
