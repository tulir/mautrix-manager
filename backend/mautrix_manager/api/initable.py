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
from typing import Callable, List, Union, Optional

from aiohttp.web import Application

from ..config import Config

Initializer = Callable[[Config, Application], None]
InitializerDecorator = Union[Initializer, Callable[[Initializer], Initializer]]
api_initializers: List[Initializer] = []
ui_initializers: List[Initializer] = []


def initializer(_fn: Optional[Initializer] = None, *, ui: bool = False) -> InitializerDecorator:
    def wrapper(fn: Initializer) -> Initializer:
        if ui:
            ui_initializers.append(fn)
        else:
            api_initializers.append(fn)
        return fn

    if _fn is not None:
        return wrapper(_fn)
    else:
        return wrapper


def init(config: Config, api_app: Application, ui_app: Application) -> None:
    for initer in api_initializers:
        initer(config, api_app)
    for initer in ui_initializers:
        initer(config, ui_app)
