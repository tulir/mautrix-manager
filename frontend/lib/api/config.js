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

let configFetched = false
export let dockerControls = undefined
export let internalBridgeInfo = undefined

export const update = () => {
    if (configFetched) {
        return Promise.resolve()
    }
    return asyncUpdate().catch(err => {
        console.error("Error fetching manager config:", err)
    })
}

const asyncUpdate = async () => {
    const resp = await tryFetch(`${apiPrefix}/manager/config`, {}, {
        service: "mautrix-manager",
        requestType: "config",
    })
    configFetched = true
    dockerControls = resp.docker_controls
    internalBridgeInfo = resp.internal_bridge_info
    console.log(dockerControls, internalBridgeInfo)
    return resp
}
