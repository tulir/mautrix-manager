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
import random
import string

from aiohttp import web, ClientResponse

simple_static_page = """<!DOCTYPE html>
<html lang="en">
<head>
  <title>{page}</title>
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


def make_token() -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=16))


def reply(status: int, page: str, title: str, body: str = "") -> web.Response:
    return web.Response(status=status, content_type="text/html",
                        text=simple_static_page.format(page=page, title=title, body=body))


async def handle_error_response(page_title: str, error_title: str, resp: ClientResponse
                                ) -> web.Response:
    try:
        data = await resp.json()
        error = data["error"]
    except (JSONDecodeError, KeyError):
        error = "An unknown error occurred. Check the bridge logs."
    return reply(resp.status, page_title, error_title, error)
