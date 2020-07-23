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

import track from "../../lib/api/tracking.js"
import { makeStyles } from "../../lib/theme.js"
import * as api from "../../lib/api/docker.js"
import Button from "../components/Button.js"
import Spinner from "../components/Spinner.js"
import useModal from "../Modal.js"
import Logs from "./Logs.js"

const useStyles = makeStyles(theme => ({
    root: {
        backgroundColor: `${theme.color.primary}66`,
        border: `.25rem solid ${theme.color.primary}`,
        borderRadius: ".25rem",
        margin: "2rem 4rem",
        padding: "1rem",
        boxShadow: ".3em .3em .3em #9A9A9B",
    },
    error: {
        backgroundColor: theme.color.error,
        border: `.25rem solid ${theme.color.errorDark}`,
    },
    button: {
        paddingLeft: "1.5rem",
        paddingRight: "1.5rem",
        marginRight: ".5rem",
    },
    containerState: {
        maxHeight: "30rem",
        overflow: "auto",
        scrollbarWidth: "thin",
        scrollbarColor: `${theme.color.primaryDark} ${theme.color.primary}33`,
    },
}), { name: "docker" })

const nameMap = {
    "/telegram": "mautrix-telegram",
    "/facebook": "mautrix-facebook",
    "/hangouts": "mautrix-hangouts",
    "/whatsapp": "mautrix-whatsapp",
    "/slack": "mx-puppet-slack",
    "/twitter": "mx-puppet-twitter",
    "/instagram": "mx-puppet-instagram",
}

const DockerControls = () => {
    const classes = useStyles()
    const [container, setContainer] = useState(null)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(null)
    const [path] = useLocation()
    const { openModal } = useModal()

    const containerName = path.substr(1)

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
            return html`<section class="${classes.root} ${classes.error}">${error}</section>`
        } else {
            return html`<section class=${classes.root}>
                <${Spinner} noCenter />
            </section>`
        }
    }

    const start = async () => {
        track("Docker start", { containerName })
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
        track("Docker stop", { containerName })
        setLoading("stop")
        try {
            await api.stopContainer(container.Id)
        } catch (err) {
            setError(err.message)
        }
        setLoading(null)
        await updateContainerInfo()
    }
    const viewLogs = () => {
        track("Docker logs", { containerName })
        openModal(Logs, { container })
    }

    const isNotLoading = name => loading && loading !== name

    return html`
        <section class=${classes.root}>
            Docker status for ${container.Names[0].substr(1)}: ${container.Status}
            <div>
                <${Button} disabled=${isNotLoading("start") || container.State === "running"}
                           class=${classes.button} onClick=${start}>
                    ${loading === "start" ? html`<${Spinner} size=20 />` : "Start"}
                </Button>
                <${Button} disabled=${isNotLoading("stop") || container.State === "exited"}
                           class=${classes.button} onClick=${stop}>
                    ${loading === "stop" ? html`<${Spinner} size=20 />` : "Stop"}
                </Button>
                <${Button} class=${classes.button} onClick=${viewLogs}
                           disabled=${container.State !== "running"}>
                    Logs
                </Button>
            </div>
            <details>
                <summary>Container state</summary>
                <pre className=${classes.containerState}>
                    ${JSON.stringify(container, null, "  ")}
                </pre>
            </details>
        </section>
    `
}

export default DockerControls
