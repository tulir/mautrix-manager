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
from typing import Callable, List

from aiohttp.web import Application

from ..config import Config

Initializer = Callable[[Config, Application], None]
initializers: List[Initializer] = []


def initializer(fn: Initializer) -> Initializer:
    initializers.append(fn)
    return fn


def init(config: Config, app: Application) -> None:
    for initer in initializers:
        initer(config, app)
