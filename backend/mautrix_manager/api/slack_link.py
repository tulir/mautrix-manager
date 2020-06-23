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
from collections import defaultdict
import asyncio

from aiohttp import web, ClientError, ClientSession
from yarl import URL

from mautrix.client import ClientAPI
from mautrix.types import UserID

from ..config import Config
from .initable import initializer
from .static_util import reply, make_token, handle_error_response

host: URL
secret: str
client_id: str
custom_redirect_uri_format: str
http: ClientSession
routes = web.RouteTableDef()
link_tokens: Dict[UserID, str] = defaultdict(make_token)
reverse_link_tokens: Dict[str, UserID] = {}

page_title = "Slack linking"


@routes.get("/slack-link")
async def link_static(request: web.Request) -> web.Response:
    if not secret:
        return reply(501, page_title, "The Slack bridge is disabled in the manager")

    try:
        token = request.query["state"][len("slack-link-"):]
        user_id = reverse_link_tokens[token]
    except (KeyError, IndexError):
        return reply(403, page_title, "Invalid manager token",
                     "Try restarting the linking process from the manager.")

    localpart, homeserver = ClientAPI.parse_user_id(user_id)
    redirect_uri = custom_redirect_uri_format.format(localpart=localpart, homeserver=homeserver)
    try:
        resp = await http.post(host / "oauth" / "link",
                               params={"user_id": user_id},
                               headers={"Authorization": f"Bearer {secret}"},
                               json={"code": request.query["code"],
                                     "redirect_uri": redirect_uri})
    except ClientError:
        return reply(502, page_title, "Failed to contact bridge",
                     "Make sure the bridge is running and reachable.")
    if 200 <= resp.status < 300:
        return reply(resp.status, page_title, "Successfully linked Slack account",
                     "Your Slack account is now bridged to Matrix. "
                     "You can close this page and return to the app.")
    else:
        return await handle_error_response(page_title, "Failed to link Slack account", resp)


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
