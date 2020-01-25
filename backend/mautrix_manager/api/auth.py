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
from typing import TYPE_CHECKING
import json

from mautrix.client import Client
from aiohttp import web

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

invalid_auth_header = {
    "body": json.dumps({"error": "Invalid authorization header"}),
    "content_type": "application/json",
}
invalid_auth_token = {
    "body": json.dumps({"error": "Invalid authorization header"}),
    "content_type": "application/json",
}
homeserver_mismatch = {
    "body": json.dumps({"error": "Request matrix_server_name and "
                                 "OpenID sub homeserver don't match"}),
    "content_type": "application/json",
}


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


@routes.post("/account/register")
async def exchange_token(request: web.Request) -> web.Response:
    data: 'OpenIDPayload' = await request.json()
    # TODO make OpenID request
    user_id = ...
    _, homeserver = Client.parse_user_id(user_id)
    if homeserver != data["matrix_server_name"]:
        return web.HTTPUnauthorized(**homeserver_mismatch)
    token = Token.random(user_id)
    await token.insert()
    return web.json_response({"token": token.secret})


@routes.post("/account/logout")
async def logout(request: web.Request) -> web.Response:
    token = await get_token(request)
    await token.delete()
    return web.json_response({}, status=204)
