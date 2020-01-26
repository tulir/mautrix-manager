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
from typing import Dict, TYPE_CHECKING
import json

from mautrix.client import Client
from mautrix.types import UserID
from aiohttp import web, ClientSession, ClientError
from yarl import URL

from ..database import Token

if TYPE_CHECKING:
    from typing import TypedDict


    class OpenIDPayload(TypedDict):
        access_token: str
        token_type: str
        matrix_server_name: str
        expires_in: int


    class OpenIDResponse(TypedDict):
        sub: str

routes = web.RouteTableDef()


def make_error(errcode: str, error: str) -> Dict[str, str]:
    return {
        "body": json.dumps({
            "error": error,
            "errcode": errcode,
        }),
        "content_type": "application/json",
    }


invalid_auth_header = make_error("", "Malformed authorization header")
invalid_auth_token = make_error("", "Invalid authorization token")
invalid_openid_payload = make_error("", "Missing one or more fields in OpenID payload")
invalid_openid_token = make_error("", "Invalid OpenID token")
no_access = make_error("", "You are not authorized to access this mautrix-manager instance")
homeserver_mismatch = make_error("", "Request matrix_server_name and "
                                     "OpenID sub homeserver don't match")


async def get_token(request: web.Request) -> Token:
    auth = request.headers["Authorization"]
    if not auth.startswith("Bearer "):
        raise web.HTTPBadRequest(**invalid_auth_header)
    token = await Token.get(auth[len("Bearer "):])
    if not token:
        raise web.HTTPUnauthorized(**invalid_auth_token)
    return token


@routes.get("/account")
async def get_auth(request: web.Request) -> web.Response:
    token = await get_token(request)
    return web.json_response({"user_id": token.user_id})


async def check_openid_token(federation_url: str, token: str) -> UserID:
    async with ClientSession() as sess:
        url = ((URL(federation_url) / "_matrix" / "federation" / "v1" / "openid" / "userinfo")
               .with_query({"access_token": token}))
        async with sess.get(url) as resp:
            data: OpenIDResponse = await resp.json()
            return UserID(data["sub"])


@routes.post("/account/register")
async def exchange_token(request: web.Request) -> web.Response:
    config = request.app["config"]
    data: 'OpenIDPayload' = await request.json()
    if "access_token" not in data or "matrix_server_name" not in data:
        raise web.HTTPBadRequest(**invalid_openid_payload)
    try:
        user_id = await check_openid_token(config["homeserver.federation_url"],
                                           data["access_token"])
        _, homeserver = Client.parse_user_id(user_id)
    except (ClientError, json.JSONDecodeError, KeyError, ValueError):
        raise web.HTTPUnauthorized(**invalid_openid_token)
    if homeserver != data["matrix_server_name"]:
        raise web.HTTPUnauthorized(**homeserver_mismatch)
    permissions = config.get_permissions(user_id)
    if not permissions.admin:
        raise web.HTTPUnauthorized(**no_access)
    token = Token.random(user_id)
    await token.insert()
    return web.json_response({
        "token": token.secret,
        "level": permissions.level,
    })


@routes.post("/account/logout")
async def logout(request: web.Request) -> web.Response:
    token = await get_token(request)
    await token.delete()
    return web.json_response({}, status=204)
