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
from json import JSONDecodeError
import asyncio

from aiohttp import web, ClientError, ClientSession
from yarl import URL

from mautrix.client import ClientAPI

from ..config import Config
from .errors import Error
from .initable import initializer
from .generic_proxy import proxy

http: ClientSession
routes = web.RouteTableDef()
config: Config
host: URL
secret: str
client_id: str
custom_redirect_uri_format: str


@routes.view("/mx-puppet-slack/{path:.+}")
async def proxy_all(request: web.Request) -> web.Response:
    if not secret:
        raise Error.bridge_disabled
    return await proxy(host, secret, request, "")


@routes.get("/mx-puppet-slack")
async def check_status(request: web.Request) -> web.Response:
    if not secret:
        raise Error.bridge_disabled
    localpart, homeserver = ClientAPI.parse_user_id(request["token"].user_id)
    return web.json_response({
        "client_id": client_id,
        "custom_redirect_uri": (custom_redirect_uri_format.format(localpart=localpart,
                                                                  homeserver=homeserver)
                                if custom_redirect_uri_format else None),
    })


htm = """<!DOCTYPE html>
<html lang="en">
<head>
  <title>Slack linking</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
</head>
<body>
  <center>
    <br>
    <h1>{title}</h1>
    <p>{body}</p>
  </center>
</body>
</html>
"""


@routes.get("/local/slack-link")
async def link_static(request: web.Request) -> web.Response:
    if not secret:
        return web.Response(status=501, content_type="text/html",
                            text=htm.format(title="The Slack bridge is disabled in the manager"))

    localpart, homeserver = ClientAPI.parse_user_id(request["token"].user_id)
    redirect_uri = custom_redirect_uri_format.format(localpart=localpart, homeserver=homeserver)
    try:
        resp = await http.post(host / "oauth" / "link",
                               params={"user_id": request["token"].user_id},
                               headers={"Authorization": f"Bearer {secret}"},
                               json={"code": request.query["code"],
                                     "redirect_uri": redirect_uri})
    except ClientError:
        return web.Response(status=502, content_type="text/html",
                            text=htm.format("Failed to contact bridge",
                                            "Make sure the bridge is running and reachable."))
    if 200 <= resp.status < 300:
        return web.Response(status=resp.status, content_type="text/html",
                            text=htm.format(title="Successfully linked Slack account",
                                            body="Your Slack account is now bridged to Matrix."
                                                 "You can close this page and return to the app."))
    else:
        try:
            data = await resp.json()
            error = data["error"]
        except (JSONDecodeError, KeyError):
            error = "An unknown error occurred. Check the bridge logs."
        return web.Response(status=resp.status, content_type="text/html",
                            text=htm.format(title="Failed to link Slack account",
                                            body=error))


@initializer
def init(cfg: Config, app: web.Application) -> None:
    global http, host, secret, config, client_id, custom_redirect_uri_format
    http = ClientSession(loop=asyncio.get_event_loop())
    config = cfg
    secret = cfg["bridges.mx-puppet-slack.secret"]
    if secret:
        host = URL(cfg["bridges.mx-puppet-slack.url"])
        client_id = cfg["bridges.mx-puppet-slack.client_id"]
        custom_redirect_uri_format = cfg["bridges.mx-puppet-slack.custom_oauth_redirect"]
    app.add_routes(routes)
