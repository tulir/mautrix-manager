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
import asyncpg

from .token import Token


class Database:
    url: str
    db: asyncpg.pool.Pool

    def __init__(self, url: str) -> None:
        self.url = url

    async def start(self) -> None:
        self.db = await asyncpg.create_pool(self.url, min_size=1)
        Token.init(self.db)

    async def stop(self) -> None:
        await self.db.close()

    async def create_tables(self) -> None:
        await self.db.execute("""CREATE TABLE IF NOT EXISTS access_token (
            user_id VARCHAR(255),
            secret  VARCHAR(255) PRIMARY KEY
        )""")
