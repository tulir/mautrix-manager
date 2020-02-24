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

let enabled = undefined

export const checkTrackingEnabled = () => {
    if (enabled !== undefined) {
        return Promise.resolve()
    }
    enabled = null
    return asyncCheckTrackingEnabled().catch(err => {
        console.error("Error checking if Mixpanel tracking is enabled:", err)
        enabled = undefined
    })
}

const asyncCheckTrackingEnabled = async () => {
    const resp = await fetch("api/track", {
        headers: {
            Authorization: `Bearer ${localStorage.accessToken}`,
        },
    })

    const data = await resp.json()
    enabled = data.enabled
    if (enabled) {
        console.info("Mixpanel tracking is enabled")
    }
}

const track = (event, properties = {}) => {
    if (!enabled) {
        return Promise.resolve()
    }
    return fetch("api/track", {
        method: "POST",
        body: JSON.stringify({
            event,
            properties,
        }),
        headers: {
            Authorization: `Bearer ${localStorage.accessToken}`,
            "Content-Type": "application/json",
        },
    }).catch(err => console.warn("Tracking threw exception:", err))
}

export default track
