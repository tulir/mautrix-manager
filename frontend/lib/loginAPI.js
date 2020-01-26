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

export const resolveWellKnown = async (server) => {
    try {
        const resp = await fetch(`https://${server}/.well-known/matrix/client`)
        const data = await resp.json()
        return data["m.homeserver"].base_url
    } catch (err) {
        console.error("Resolution failed:", err)
        throw new Error(`Failed to resolve URL for ${server}`)
    }
}

export const loginMatrix = async (address, username, password) => {
    let resp
    try {
        resp = await fetch(`${address}/_matrix/client/r0/login`, {
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
        })
    } catch (err) {
        console.error("Login failed:", err)
        throw new Error(`Could not connect to ${address}`)
    }
    let data
    try {
        data = await resp.json()
    } catch (err) {
        console.error("Login JSON parse failed:", err)
        throw new Error(`Invalid login response from ${address}`)
    }
    if (resp.status !== 200) {
        console.error("Unexpected login status", resp.status, data)
        throw new Error(data.error || `Invalid login response from ${address}`)
    }
    if (data.well_known && data.well_known["m.homeserver"]) {
        address = data.well_known["m.homeserver"].base_url || address
    }
    return [data.access_token, data.user_id, address]
}

export const requestOpenIDToken = async (address, userID, accessToken) => {
    let resp
    try {
        const url = `${address}/_matrix/client/r0/user/${userID}/openid/request_token`
        resp = await fetch(url, {
            method: "POST",
            body: "{}",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        })
    } catch (err) {
        console.error("OpenID token request failed:", err)
        throw new Error(`Failed to request OpenID token for ${userID}`)
    }
    let data
    try {
        data = await resp.json()
    } catch (err) {
        console.error("OpenID token request JSON parse failed:", err)
        throw new Error("Invalid OpenID response")
    }
    if (resp.status !== 200) {
        console.error("Unexpected OpenID token request status", resp.status, data)
        throw new Error(data.error || "Invalid OpenID response")
    }
    return data
}

export const requestIntegrationToken = async (tokenData) => {
    let resp
    try {
        resp = await fetch("/_matrix/integrations/v1/account/register", {
            method: "POST",
            body: JSON.stringify(tokenData),
            headers: {
                "Content-Type": "application/json",
            },
        })
    } catch (err) {
        console.error("Integration manager register failed:", err)
        throw new Error("Could not connect to mautrix-manager")
    }
    let data
    try {
        data = await resp.json()
    } catch (err) {
        console.error("Integration register JSON parse failed:", err)
        throw new Error("Invalid mautrix-manager registration response")
    }
    if (resp.status !== 200) {
        console.error("Unexpected integration manager register status", resp.status, data)
        throw new Error(data.error || "Invalid mautrix-manager registration response")
    }
    return data
}
