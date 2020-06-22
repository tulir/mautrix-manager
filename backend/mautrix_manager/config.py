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
from typing import NamedTuple
import random
import string

from mautrix.util.config import BaseFileConfig, ConfigUpdateHelper
from mautrix.types import UserID
from mautrix.client import Client

Permissions = NamedTuple("Permissions", user=bool, admin=bool, level=str)


class Config(BaseFileConfig):
    @staticmethod
    def _new_token() -> str:
        return "".join(random.choices(string.ascii_lowercase + string.digits, k=64))

    def do_update(self, helper: ConfigUpdateHelper) -> None:
        copy = helper.copy

        copy("homeserver.domain")
        copy("homeserver.client_url")
        copy("homeserver.federation_url")

        copy("docker.host")
        copy("mixpanel.token")

        copy("server.host")
        copy("server.port")
        copy("server.database")
        copy("server.override_resource_path")

        for bridge in ("mautrix-telegram", "mautrix-whatsapp", "mautrix-facebook",
                       "mautrix-hangouts", "mx-puppet-slack", "mx-puppet-twitter",
                       "mx-puppet-instagram"):
            copy(f"bridges.{bridge}.url")
            copy(f"bridges.{bridge}.secret")

        copy("bridges.mx-puppet-slack.client_id")
        copy("bridges.mx-puppet-slack.custom_oauth_redirect")
        copy("bridges.mx-puppet-twitter.custom_oauth_redirect")

        copy("permissions")

        copy("logging")

    def _get_permissions(self, key: str) -> Permissions:
        level = self["permissions"].get(key, "")
        admin = level == "admin"
        user = admin or level == "user"
        return Permissions(user=user, admin=admin, level=level)

    def get_permissions(self, mxid: UserID) -> Permissions:
        permissions = self["permissions"]
        if mxid in permissions:
            return self._get_permissions(mxid)

        _, homeserver = Client.parse_user_id(mxid)
        if homeserver in permissions:
            return self._get_permissions(homeserver)

        return self._get_permissions("*")
