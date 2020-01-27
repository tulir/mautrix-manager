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
from typing import Dict
import json

from aiohttp import web


class Error:
    @staticmethod
    def _make_error(errcode: str, error: str) -> Dict[str, str]:
        return {
            "body": json.dumps({
                "error": error,
                "errcode": errcode,
            }),
            "content_type": "application/json",
        }

    @classmethod
    @property
    def request_not_json(cls) -> None:
        raise web.HTTPBadRequest(**cls._make_error("M_NOT_JSON",
                                                   "Request body is not valid JSON"))

    @classmethod
    @property
    def missing_auth_header(cls) -> None:
        raise web.HTTPForbidden(**cls._make_error("M_MISSING_TOKEN",
                                                  "Missing authorization header"))

    @classmethod
    @property
    def invalid_auth_header(cls) -> None:
        raise web.HTTPForbidden(**cls._make_error("M_UNKNOWN_TOKEN",
                                                  "Invalid authorization header"))

    @classmethod
    @property
    def invalid_auth_token(cls) -> None:
        raise web.HTTPForbidden(**cls._make_error("M_UNKNOWN_TOKEN",
                                                  "Invalid authorization token"))

    @classmethod
    @property
    def invalid_openid_payload(cls) -> None:
        raise web.HTTPBadRequest(**cls._make_error("M_BAD_JSON", "Missing one or more "
                                                                 "fields in OpenID payload"))

    @classmethod
    @property
    def invalid_openid_token(cls) -> None:
        raise web.HTTPForbidden(**cls._make_error("M_UNKNOWN_TOKEN",
                                                  "Invalid OpenID token"))

    @classmethod
    @property
    def no_access(cls) -> None:
        raise web.HTTPUnauthorized(**cls._make_error("M_UNAUTHORIZED",
                                                     "You are not authorized to access this "
                                                     "mautrix-manager instance"))

    @classmethod
    @property
    def no_access_docker(cls) -> None:
        raise web.HTTPUnauthorized(**cls._make_error("M_UNAUTHORIZED",
                                                     "You are not authorized to access the Docker "
                                                     "API proxy"))

    @classmethod
    @property
    def homeserver_mismatch(cls) -> None:
        raise web.HTTPUnauthorized(**cls._make_error("M_UNAUTHORIZED",
                                                     "Request matrix_server_name and OpenID "
                                                     "sub homeserver don't match"))
