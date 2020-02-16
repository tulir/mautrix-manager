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

const baseURL = `${apiPrefix}/docker/v1.35`
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
        service,
        requestType: "container find",
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

export const startContainer = async id => await tryFetch(`${baseURL}/containers/${id}/start`, {
    method: "POST",
}, {
    service,
    requestType: "container start",
})

export const stopContainer = async id => await tryFetch(`${baseURL}/containers/${id}/stop`, {
    method: "POST",
}, {
    service,
    requestType: "container stop",
    raw: true,
})

const bytesToUInt32 = bytes => (bytes[0] << 24) + (bytes[1] << 16) + (bytes[2] << 8) + bytes[3]

export const streamLogs = async (id, tail = 100) => {
    const resp = await tryFetch(`${baseURL}/containers/${id}/logs`, {
        query: {
            follow: true,
            stdout: true,
            stderr: true,
            tail,
        },
    }, {
        service,
        requestType: "container logs",
        raw: true,
    })
    const reader = resp.body.getReader()
    const decoder = new TextDecoder("utf-8")
    return {
        resp,
        async close() {
            await reader.cancel()
        },
        async * read() {
            let done = false
            while (!done) {
                const chunk = await reader.read()
                if (chunk.value) {
                    let offset = 0
                    while (offset < chunk.value.length) {
                        //const type = chunk.value[offset]
                        if (chunk.value[offset + 1] !== 0 ||
                            chunk.value[offset + 2] !== 0 ||
                            chunk.value[offset + 3] !== 0) {
                            console.error("Invalid docker log header in", chunk)
                            break
                        }
                        const length = bytesToUInt32(chunk.value.slice(offset + 4, offset + 8))
                        if (chunk.value.length < offset + 8 + length) {
                            console.error("Unexpectedly small chunk:", offset, length, chunk.value.length)
                        }
                        yield decoder.decode(chunk.value.slice(offset + 8, offset + 8 + length))
                        offset += 8 + length
                    }
                }
                done = chunk.done
            }
        },
    }
}
