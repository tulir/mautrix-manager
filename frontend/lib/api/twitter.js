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

const service = "Twitter bridge"
const prefix = `${apiPrefix}/mx-puppet-twitter`

export const status = () => tryFetch(`${prefix}/status`, {}, {
    service,
    requestType: "status",
})

export const makeLoginURL = () => tryFetch(`${prefix}/oauth/request`, {
    method: "POST",
    body: JSON.stringify({
        // eslint-disable-next-line camelcase
        oauth_callback: window.location.href.replace(window.location.hash, "#/twitter"),
    }),
    headers: {
        "Content-Type": "application/json",
    },
}, {
    service: "Twitter API",
    requestType: "login request",
})

export const link = (token, secret, verifier) => tryFetch(`${prefix}/oauth/link`, {
    method: "POST",
    body: JSON.stringify({
        /* eslint-disable camelcase */
        oauth_token: token,
        oauth_secret: secret,
        oauth_verifier: verifier,
        /* eslint-enable camelcase */
    }),
    headers: {
        "Content-Type": "application/json",
    },
}, {
    service,
    requestType: "login",
})

export const unlink = id => tryFetch(`${prefix}/${id}/unlink`, { method: "POST" }, {
    service,
    requestType: "logout",
})
