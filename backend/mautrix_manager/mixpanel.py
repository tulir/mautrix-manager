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
import logging
import asyncio
import base64
import json

import aiohttp
from yarl import URL

from .config import Config

log = logging.getLogger("mau.mixpanel")
token: str
http: aiohttp.ClientSession


def is_enabled() -> bool:
    return bool(token)


async def track(event: str, user_id: str, user_agent: str = "", **properties: str) -> None:
    if not token:
        return
    try:
        await http.post(URL("https://api.mixpanel.com/track/").with_query({
            "data": base64.b64encode(json.dumps({
                "event": event,
                "properties": {
                    **properties,
                    "token": token,
                    "distinct_id": user_id,
                }
            }).encode("utf-8")).decode("utf-8"),
        }), headers={
            "User-Agent": user_agent
        } if user_agent else {})
        log.debug(f"Tracked {event} from {user_id}")
    except Exception:
        log.exception(f"Failed to track {event} from {user_id}")

async def engage(user_id: str, user_agent: str = "", **properties: str) -> None:
    if not token:
        return
    try:
        await http.post(URL("https://api.mixpanel.com/engage/").with_query({
            "data": base64.b64encode(json.dumps({
                **properties,
                "token": token,
                "distinct_id": user_id,
            }).encode("utf-8")).decode("utf-8"),
        }), headers={
            "User-Agent": user_agent
        } if user_agent else {})
        log.debug(f"Update user's profile for {user_id}")
    except Exception:
        log.exception(f"Failed to update user's profile for {user_id}")

def init(config: Config) -> None:
    global token, http
    token = config["mixpanel.token"]
    http = aiohttp.ClientSession(loop=asyncio.get_event_loop())
    if token:
        log.info("Mixpanel tracking is enabled")
