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

import { tryFetch, apiPrefix } from "./tryGet.js"

const service = "WhatsApp bridge"
const prefix = `${apiPrefix}/mautrix-whatsapp`

export const ping = () => tryFetch(`${prefix}/ping`, {}, {
    service,
    requestType: "ping",
})

const makeSimplePost = endpoint => () => tryFetch(`${prefix}/${endpoint}`, {
    method: "POST",
}, {
    service,
    requestType: endpoint.replace("_", " "),
})

export const logout = makeSimplePost("logout")
export const disconnect = makeSimplePost("disconnect")
export const reconnect = makeSimplePost("reconnect")
export const deleteSession = makeSimplePost("delete_connection")
export const deleteConnection = makeSimplePost("delete_session")

export const login = async (onCode) => {
    const localPrefix = prefix.startsWith("/") ? prefix : window.location.pathname + prefix
    const url = `${window.location.protocol.replace("http", "ws")}//
${window.location.host}${localPrefix}/login?access_token=${localStorage.accessToken}`
    return new Promise(resolve => {
        const socket = new WebSocket(url)
        socket.addEventListener("message", evt => {
            const data = JSON.parse(evt.data)
            if (data.code) {
                onCode(data.code)
            } else {
                socket.close(1000)
                resolve(data)
            }
        })
    })
}
