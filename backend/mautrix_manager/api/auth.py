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
from typing import Dict, Callable, Awaitable, TYPE_CHECKING
import json

from mautrix.client import Client
from mautrix.types import UserID
from aiohttp import web, ClientSession, ClientError
from yarl import URL

from ..database import Token
from ..config import Config
from .errors import Error

if TYPE_CHECKING:
    from typing import TypedDict


    class OpenIDPayload(TypedDict):
        access_token: str
        token_type: str
        matrix_server_name: str
        expires_in: int


    class OpenIDResponse(TypedDict):
        sub: str

Handler = Callable[[web.Request], Awaitable[web.Response]]

routes = web.RouteTableDef()
config: Config
userinfo_url: URL


def make_error(errcode: str, error: str) -> Dict[str, str]:
    return {
        "body": json.dumps({
            "error": error,
            "errcode": errcode,
        }),
        "content_type": "application/json",
    }


async def get_token(request: web.Request) -> Token:
    try:
        auth = request.headers["Authorization"]
        if not auth.startswith("Bearer "):
            raise Error.invalid_auth_header
        auth = auth[len("Bearer "):]
    except KeyError:
        try:
            auth = request.query["access_token"]
        except KeyError:
            raise Error.missing_auth_header
    token = await Token.get(auth)
    if not token:
        raise Error.invalid_auth_token
    return token


@web.middleware
async def token_middleware(request: web.Request, handler: Handler) -> web.Response:
    token = await get_token(request)
    request["token"] = token
    return await handler(request)


@routes.get("/account")
async def get_auth(request: web.Request) -> web.Response:
    token = await get_token(request)
    return web.json_response({"user_id": token.user_id})


async def check_openid_token(token: str) -> UserID:
    async with ClientSession() as sess:
        async with sess.get(userinfo_url.with_query({"access_token": token})) as resp:
            data: OpenIDResponse = await resp.json()
            return UserID(data["sub"])


@routes.post("/account/register")
async def exchange_token(request: web.Request) -> web.Response:
    try:
        data: 'OpenIDPayload' = await request.json()
    except json.JSONDecodeError:
        raise Error.request_not_json
    if "access_token" not in data or "matrix_server_name" not in data:
        raise Error.invalid_openid_payload
    try:
        user_id = await check_openid_token(data["access_token"])
        _, homeserver = Client.parse_user_id(user_id)
    except (ClientError, json.JSONDecodeError, KeyError, ValueError):
        raise Error.invalid_openid_token
    if homeserver != data["matrix_server_name"]:
        raise Error.homeserver_mismatch
    permissions = config.get_permissions(user_id)
    if not permissions.user:
        raise Error.no_access
    token = Token.random(user_id)
    await token.insert()
    return web.json_response({
        "user_id": user_id,
        "token": token.secret,
        "level": permissions.level,
        "permissions": {
            "docker": permissions.admin,
        },
    })


@routes.post("/account/logout")
async def logout(request: web.Request) -> web.Response:
    token = await get_token(request)
    await token.delete()
    return web.json_response({}, status=204)


def init(cfg: Config) -> None:
    global config, userinfo_url
    config = cfg
    userinfo_url = (URL(config["homeserver.federation_url"])
                    / "_matrix" / "federation" / "v1" / "openid" / "userinfo")
