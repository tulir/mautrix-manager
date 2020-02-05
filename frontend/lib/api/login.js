// mautrix-manager - A web interface for managing bridges
// Copyright (C) 2020 Tulir Asokan
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { tryFetch } from "./tryGet.js"

export const resolveWellKnown = async (server) => {
    try {
        const resp = await fetch(`https://${server}/.well-known/matrix/client`)
        const data = await resp.json()
        let url = data["m.homeserver"].base_url
        if (url.endsWith("/")) {
            url = url.slice(0, -1)
        }
        return url
    } catch (err) {
        console.error("Resolution failed:", err)
        throw new Error(`Failed to resolve URL for ${server}`)
    }
}

export const loginMatrix = async (address, username, password) => {
    const data = await tryFetch(`${address}/_matrix/client/r0/login`, {
        method: "POST",
        body: JSON.stringify({
            type: "m.login.password",
            identifier: {
                type: "m.id.user",
                user: username,
            },
            password,
            /* eslint-disable camelcase */
            device_id: "mautrix-manager",
            initial_device_display_name: "mautrix-manager",
            /* eslint-enable camelcase */
        }),
        headers: {
            "Content-Type": "application/json",
        },
    }, {
        service: address,
        requestType: "login",
    })
    if (data.well_known && data.well_known["m.homeserver"]) {
        address = data.well_known["m.homeserver"].base_url || address
        if (address.endsWith("/")) {
            address = address.slice(0, -1)
        }
    }
    return [data.access_token, data.user_id, address]
}

export const requestOpenIDToken = (address, userID, accessToken) => tryFetch(
    `${address}/_matrix/client/r0/user/${userID}/openid/request_token`,
    {
        method: "POST",
        body: "{}",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
    },
    {
        service: "OpenID",
        requestType: "token",
    },
)

export const requestIntegrationToken = tokenData => tryFetch(
    "/_matrix/integrations/v1/account/register", {
        method: "POST",
        body: JSON.stringify(tokenData),
        headers: {
            "Content-Type": "application/json",
        },
    },
    {
        service: "mautrix-manager",
        requestType: "register",
    })
