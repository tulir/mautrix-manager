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


class _ErrorMeta:
    def __init__(self, *args, **kwargs) -> None:
        pass

    @staticmethod
    def _make_error(errcode: str, error: str) -> Dict[str, str]:
        return {
            "body": json.dumps({
                "error": error,
                "errcode": errcode,
            }),
            "content_type": "application/json",
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS, GET, POST, PUT, DELETE, HEAD",
                "Access-Control-Allow-Headers": "Authorization, Content-Type",
            }
        }

    @property
    def request_not_json(self) -> web.HTTPException:
        return web.HTTPBadRequest(**self._make_error("M_NOT_JSON",
                                                     "Request body is not valid JSON"))

    @property
    def missing_auth_header(self) -> web.HTTPException:
        return web.HTTPForbidden(**self._make_error("M_MISSING_TOKEN",
                                                    "Missing authorization header"))

    @property
    def invalid_auth_header(self) -> web.HTTPException:
        return web.HTTPForbidden(**self._make_error("M_UNKNOWN_TOKEN",
                                                    "Invalid authorization header"))

    @property
    def invalid_auth_token(self) -> web.HTTPException:
        return web.HTTPForbidden(**self._make_error("M_UNKNOWN_TOKEN",
                                                    "Invalid authorization token"))

    @property
    def invalid_openid_payload(self) -> web.HTTPException:
        return web.HTTPBadRequest(**self._make_error("M_BAD_JSON", "Missing one or more "
                                                                   "fields in OpenID payload"))

    @property
    def invalid_openid_token(self) -> web.HTTPException:
        return web.HTTPForbidden(**self._make_error("M_UNKNOWN_TOKEN",
                                                    "Invalid OpenID token"))

    @property
    def no_access(self) -> web.HTTPException:
        return web.HTTPUnauthorized(**self._make_error(
            "M_UNAUTHORIZED", "You are not authorized to access this mautrix-manager instance"))

    @property
    def no_access_docker(self) -> web.HTTPException:
        return web.HTTPUnauthorized(**self._make_error(
            "M_UNAUTHORIZED", "You are not authorized to access the Docker API proxy"))

    @property
    def no_impersonation(self) -> web.HTTPException:
        return web.HTTPUnauthorized(**self._make_error(
            "M_UNAUTHORIZED", "You are not authorized to impersonate other users"))

    @property
    def bridge_disabled(self) -> web.HTTPException:
        return web.HTTPNotImplemented(**self._make_error("NET.MAUNIUM.BRIDGE_DISABLED",
                                                         "This bridge is disabled in the manager"))

    @property
    def homeserver_mismatch(self) -> web.HTTPException:
        return web.HTTPUnauthorized(**self._make_error(
            "M_UNAUTHORIZED", "Request matrix_server_name and OpenID sub homeserver don't match"))


class Error(metaclass=_ErrorMeta):
    pass
