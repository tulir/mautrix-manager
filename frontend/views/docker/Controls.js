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
import { useEffect, useState } from "../../web_modules/preact/hooks.js"
import { useLocation } from "../../web_modules/wouter-preact.js"
import { html } from "../../web_modules/htm/preact.js"

import { makeStyles } from "../../lib/theme.js"
import * as api from "../../lib/api/docker.js"
import Alert from "../components/Alert.js"
import Spinner from "../components/Spinner.js"
import useModal from "../Modal.js"
import Logs from "./Logs.js"

const useStyles = makeStyles(theme => ({
    root: {
        margin: "1rem 0",
    },
    button: {
        ...theme.button(),
        paddingLeft: "1.5rem",
        paddingRight: "1.5rem",
        marginRight: ".5rem",
    },
}), { name: "docker" })

const nameMap = {
    "/telegram": "mautrix-telegram",
    "/facebook": "mautrix-facebook",
    "/hangouts": "mautrix-hangouts",
    "/whatsapp": "mautrix-whatsapp",
    "/slack": "mx-puppet-slack",
}

const DockerControls = () => {
    const classes = useStyles()
    const [container, setContainer] = useState(null)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(null)
    const [path] = useLocation()
    const { openModal } = useModal()

    const containerName = nameMap[path]

    const updateContainerInfo = async () => {
        try {
            setContainer(await api.findContainerByName(containerName))
        } catch (err) {
            setError(err.message)
        }
    }

    useEffect(async () => {
        if (!containerName) {
            return
        }
        setContainer(null)
        await updateContainerInfo()
    }, [containerName])

    if (!containerName) {
        return null
    } else if (!container) {
        if (error) {
            return html`<${Alert} message=${error} />`
        } else {
            return html`<${Spinner} green noCenter />`
        }
    }

    const start = async () => {
        setLoading("start")
        try {
            await api.startContainer(container.Id)
        } catch (err) {
            setError(err.message)
        }
        setLoading(null)
        await updateContainerInfo()
    }
    const stop = async () => {
        setLoading("stop")
        try {
            await api.stopContainer(container.Id)
        } catch (err) {
            setError(err.message)
        }
        setLoading(null)
        await updateContainerInfo()
    }
    const viewLogs = () => openModal(Logs, { container })

    const isNotLoading = name => loading && loading !== name

    return html`
        <div class=${classes.root}>
            Docker status for ${container.Names[0].substr(1)}: ${container.Status}
            <div>
                <button disabled=${isNotLoading("start") || container.State === "running"}
                        class=${classes.button} onClick=${start}>
                    ${loading === "start" ? html`<${Spinner} size=20 />` : "Start"}
                </button>
                <button disabled=${isNotLoading("stop") || container.State === "exited"}
                        class=${classes.button} onClick=${stop}>
                    ${loading === "stop" ? html`<${Spinner} size=20 />` : "Stop"}
                </button>
                <button class=${classes.button} onClick=${viewLogs}
                        disabled=${container.State !== "running"}>
                    Logs
                </button>
            </div>
            <details>
                <summary>Container state</summary>
                <pre>${JSON.stringify(container, null, "  ")}</pre>
            </details>
        </div>
    `
}

export default DockerControls
