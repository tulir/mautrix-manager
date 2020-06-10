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
from json import JSONDecodeError
from collections import defaultdict
import asyncio
import random
import string

from aiohttp import web, ClientError, ClientSession
from yarl import URL

from mautrix.client import ClientAPI
from mautrix.types import UserID

from .initable import initializer
from ..config import Config

host: URL
secret: str
client_id: str
custom_redirect_uri_format: str
http: ClientSession
routes = web.RouteTableDef()
link_tokens: Dict[UserID, str] = defaultdict(
    lambda: "".join(random.choices(string.ascii_lowercase + string.digits, k=16)))
reverse_link_tokens: Dict[str, UserID] = {}

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


@routes.get("/slack-link")
async def link_static(request: web.Request) -> web.Response:
    try:
        token = request.query["state"][len("slack-link-"):]
        user_id = reverse_link_tokens[token]
    except (KeyError, IndexError):
        return web.Response(status=403, content_type="text/html",
                            text=htm.format(title="Invalid manager token",
                                            body="Try restarting the linking process "
                                                 "from the manager."))

    if not secret:
        return web.Response(status=501, content_type="text/html",
                            text=htm.format(title="The Slack bridge is disabled in the manager"))

    localpart, homeserver = ClientAPI.parse_user_id(user_id)
    redirect_uri = custom_redirect_uri_format.format(localpart=localpart, homeserver=homeserver)
    try:
        resp = await http.post(host / "oauth" / "link",
                               params={"user_id": user_id},
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


@initializer(ui=True)
def init(cfg: Config, app: web.Application) -> None:
    global http, host, secret, client_id, custom_redirect_uri_format
    http = ClientSession(loop=asyncio.get_event_loop())
    secret = cfg["bridges.mx-puppet-slack.secret"]
    if secret:
        host = URL(cfg["bridges.mx-puppet-slack.url"])
        client_id = cfg["bridges.mx-puppet-slack.client_id"]
        custom_redirect_uri_format = cfg["bridges.mx-puppet-slack.custom_oauth_redirect"]
    app.add_routes(routes)
