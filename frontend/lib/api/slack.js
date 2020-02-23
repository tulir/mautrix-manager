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

import { tryFetch, apiPrefix, queryToURL } from "./tryGet.js"

const service = "Slack bridge"
const prefix = `${apiPrefix}/mx-puppet-slack`
let clientID = null

export const status = () => tryFetch(`${prefix}/status`, {}, {
    service,
    requestType: "status",
})

export const initClientInfo = async () => {
    if (!clientID) {
        const resp = await tryFetch(prefix, {}, {
            service,
            requestType: "bridge status",
        })
        clientID = resp.client_id
    }
    return clientID
}

export const makeLoginURL = () => queryToURL("https://slack.com/oauth/authorize", {
    // eslint-disable-next-line camelcase
    client_id: clientID,
    // eslint-disable-next-line camelcase
    redirect_uri: window.location.href.replace(window.location.hash, "#/slack"),
    scope: "client",
    state: "slack-link",
})

export const link = code => tryFetch(`${prefix}/oauth/link`, {
    method: "POST",
    body: JSON.stringify({
        code,
        // eslint-disable-next-line camelcase
        redirect_uri: window.location.href.replace(window.location.hash, "#/slack"),
    }),
    headers: {
        Authorization: `Bearer ${localStorage.accessToken}`,
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
