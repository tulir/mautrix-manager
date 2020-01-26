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
from typing import ClassVar
import random
import string

from attr import dataclass
import asyncpg

from mautrix.types import UserID


@dataclass
class Token:
    _db: ClassVar[asyncpg.Connection]

    user_id: UserID
    secret: str

    @staticmethod
    def random(user_id: UserID) -> 'Token':
        return Token(secret="".join(random.choices(string.ascii_lowercase + string.digits, k=64)),
                     user_id=user_id)

    @classmethod
    async def get(cls, secret: str) -> 'Token':
        row: asyncpg.Record = await cls._db.fetchrow("SELECT user_id, secret "
                                                     "FROM access_token WHERE secret=$1", secret)
        return Token(**row)

    async def delete(self) -> None:
        await self._db.execute("DELETE FROM access_token WHERE secret=$1")

    async def insert(self) -> None:
        await self._db.execute("INSERT INTO access_token (user_id, secret) VALUES ($1, $2)",
                               self.user_id, self.secret)

    @classmethod
    def init(cls, db: asyncpg.Connection) -> None:
        cls._db = db
