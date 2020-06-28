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
from aiohttp import web, hdrs
from re import search as regex_search
from ipaddress import ip_address

from ..config import Config
from .initable import initializer
from ..mixpanel import is_enabled, track, engage

routes = web.RouteTableDef()

cors_headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS, GET, POST",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
}

def get_remote_ip(request: web.Request) -> str:
    try:
        if "Forwarded" in request.headers:
            addresses = regex_search(r"for=(.*?);", request.headers["Forwarded"]).group(1)
            addr = addresses.split(",")[0].strip()
        elif "X-Forwarded-For" in request.headers:
            addr = request.headers["X-Forwarded-For"].split(",")[0].strip()
        else:
            addr = request.remote
        ip_address(addr)
        return addr
    except:
        return ""

@routes.route(hdrs.METH_OPTIONS, "/track")
@routes.route(hdrs.METH_OPTIONS, "/engage")
async def cors_track(_: web.Request) -> web.Response:
    return web.Response(status=200, headers=cors_headers)


@routes.get("/track")
async def check_track(_: web.Request) -> web.Response:
    return web.json_response({
        "enabled": is_enabled(),
    }, headers=cors_headers)


@routes.post("/track")
async def do_track(request: web.Request) -> web.Response:
    data = await request.json()
    try:
        event = data["event"]
        props = data["properties"]
    except KeyError:
        return web.Response(status=400, headers=cors_headers)
    if not isinstance(event, str) or not isinstance(props, dict):
        return web.Response(status=400, headers=cors_headers)
    ip = get_remote_ip(request)
    if ip:
        props["ip"] = ip
    await track(event=event, user_id=request["token"].user_id,
                user_agent=request.headers["User-Agent"], **props)
    return web.Response(status=204, headers=cors_headers)

@routes.post("/engage")
async def do_engage(request: web.Request) -> web.Response:
    props = await request.json()
    if not isinstance(props, dict):
        return web.Response(status=400, headers=cors_headers)
    ip = get_remote_ip(request)
    if ip:
        props["$ip"] = ip
    await engage(user_id=request["token"].user_id,
                user_agent=request.headers["User-Agent"], **props)
    return web.Response(status=204, headers=cors_headers)

@initializer
def init(_: Config, app: web.Application) -> None:
    app.add_routes(routes)
