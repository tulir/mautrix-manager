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

const service = "Hangouts bridge"
const prefix = `${apiPrefix}/mautrix-hangouts`

export const whoami = () => tryFetch(`${prefix}/whoami`, {}, {
    service,
    requestType: "user info",
})

export const logout = () => tryFetch(`${prefix}/logout`, { method: "POST" }, {
    service,
    requestType: "logout",
})

export const loginStart = manual => tryFetch(`${prefix}/start`, {
    method: "POST",
    query: { manual },
}, {
    service,
    requestType: "login start",
})

export const loginCancel = () => tryFetch(`${prefix}/cancel`, {
    method: "POST",
}, {
    service,
    requestType: "login cancel",
})

export const loginStep = (step, payload) => tryFetch(`${prefix}/${step}`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
}, {
    service,
    requestType: "login cancel",
})
