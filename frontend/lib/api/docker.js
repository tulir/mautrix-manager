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
import { apiPrefix, tryFetch } from "./tryGet.js"

const baseURL = `${apiPrefix}/docker/v1.40`
const service = "Docker"

export const findContainerByName = async (container) => {
    const data = await tryFetch(`${baseURL}/containers/json`, {
        query: {
            all: true,
            filters: {
                name: [`/${container}`],
            },
        },
        contentType: "application/json",
    }, {
        service, requestType: "container find"
    })
    if (data.length === 0) {
        console.error("Container with name", container, "not created")
        throw new Error(`Container ${container} not created`)
    } else if (data.length > 1) {
        console.error("Found multiple containers with name", container, data)
        throw new Error(`Multiple containers found with name ${container}`)
    }
    return data[0]
}
