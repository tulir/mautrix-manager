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
from typing import Dict, NamedTuple
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
custom_redirect_uri_format: str
http: ClientSession
routes = web.RouteTableDef()

link_start_tokens: Dict[UserID, str] = defaultdict(make_token)
reverse_link_start_tokens: Dict[str, UserID] = {}

LinkTokenInfo = NamedTuple("LinkTokenInfo", oauth_secret=str, oauth_token=str, user_id=UserID)
link_tokens: Dict[str, LinkTokenInfo] = {}

page_title = "Twitter linking"


@routes.get("/twitter-link/start")
async def start_link_static(request: web.Request) -> web.Response:
    if not secret:
        return reply(501, page_title, "The Twitter bridge is disabled in the manager")

    try:
        token = request.query["manager_token"]
        user_id = reverse_link_start_tokens[token]
    except (KeyError, IndexError):
        return reply(403, page_title, "Invalid manager token",
                     "Try restarting the linking process from the manager.")

    localpart, homeserver = ClientAPI.parse_user_id(user_id)
    redirect_uri = custom_redirect_uri_format.format(localpart=localpart, homeserver=homeserver)

    link_token = make_token()
    redirect_uri = str(URL(redirect_uri).update_query({"link_token": link_token}))

    try:
        resp = await http.post(host / "oauth" / "request",
                               params={"user_id": user_id},
                               headers={"Authorization": f"Bearer {secret}"},
                               json={"oauth_callback": redirect_uri})
    except ClientError:
        return reply(502, page_title, "Failed to contact bridge",
                     "Make sure the bridge is running and reachable.")
    resp_data = await resp.json()
    link_tokens[link_token] = LinkTokenInfo(oauth_secret=resp_data["oauth_secret"],
                                            oauth_token=resp_data["oauth_token"],
                                            user_id=user_id)
    if 200 <= resp.status < 300:
        return web.Response(status=302, headers={"Location": resp_data["url"]})
    else:
        return await handle_error_response(page_title, "Failed to link Twitter account", resp)


@routes.get("/twitter-link/callback")
async def link_static(request: web.Request) -> web.Response:
    if not secret:
        return reply(501, page_title, "The Twitter bridge is disabled in the manager")

    try:
        token = request.query["link_token"]
        link_info = link_tokens[token]
    except (KeyError, IndexError):
        return reply(403, page_title, "Invalid link token",
                     "Try restarting the linking process from the manager.")

    if link_info.oauth_token != request.query["oauth_token"]:
        return reply(400, page_title, "Mismatching OAuth token",
                     "Try restarting the linking process from the manager.")

    try:
        resp = await http.post(host / "oauth" / "link",
                               params={"user_id": link_info.user_id},
                               headers={"Authorization": f"Bearer {secret}"},
                               json={"oauth_token": request.query["oauth_token"],
                                     "oauth_verifier": request.query["oauth_verifier"],
                                     "oauth_secret": link_info.oauth_secret})
    except ClientError:
        return reply(502, page_title, "Failed to contact bridge",
                     "Make sure the bridge is running and reachable.")
    if 200 <= resp.status < 300:
        return reply(resp.status, page_title, "Successfully linked Twitter account",
                     "Your Twitter account is now bridged to Matrix. "
                     "You can close this page and return to the app.")
    else:
        return await handle_error_response(page_title, "Failed to link Twitter account", resp)


@initializer(ui=True)
def init(cfg: Config, app: web.Application) -> None:
    global http, host, secret, custom_redirect_uri_format
    http = ClientSession(loop=asyncio.get_event_loop())
    secret = cfg["bridges.mx-puppet-twitter.secret"]
    if secret:
        host = URL(cfg["bridges.mx-puppet-twitter.url"])
        custom_redirect_uri_format = cfg["bridges.mx-puppet-twitter.custom_oauth_redirect"]
    app.add_routes(routes)
