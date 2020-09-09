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
from mautrix.util.program import Program
from mautrix.util.async_db import Database

from .config import Config
from .server import Server
from .mixpanel import init as init_mixpanel
from .database import upgrade_table, Base
from .version import version


class MautrixManager(Program):
    module = "mautrix_manager"
    name = "mautrix-manager"
    version = version
    command = "python -m mautrix_manager"
    description = "A web interface for managing bridges"

    config_class = Config

    config: Config
    server: Server
    database: Database

    async def start(self) -> None:
        self.database = Database(url=self.config["server.database"], upgrade_table=upgrade_table)
        Base.db = self.database
        init_mixpanel(self.config)
        self.server = Server(self.config)

        await self.database.start()
        await self.server.start()

        await super().start()

    async def stop(self) -> None:
        await super().stop()
        await self.server.stop()


MautrixManager().run()
