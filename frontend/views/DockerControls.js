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
import { useEffect, useState } from "../web_modules/preact/hooks.js"
import { useLocation } from "../web_modules/wouter-preact.js"
import { html } from "../web_modules/htm/preact.js"

import { makeStyles } from "../lib/theme.js"
import * as api from "../lib/api/docker.js"
import Alert from "./components/Alert.js"
import Spinner from "./components/Spinner.js"

const useStyles = makeStyles({
    root: {
        margin: "1rem 0"
    },

})

const nameMap = {
    "/telegram": "mautrix-telegram",
    "/facebook": "mautrix-facebook",
    "/whatsapp": "mautrix-whatsapp",
}

const DockerControls = () => {
    const classes = useStyles()
    const [container, setContainer] = useState(null)
    const [error, setError] = useState("")
    const [path] = useLocation()

    const containerName = nameMap[path]
    useEffect(async () => {
        if (!containerName) {
            return
        }
        setContainer(null)
        try {
            setContainer(await api.findContainerByName(containerName))
        } catch (err) {
            setError(err.message)
        }
    }, [containerName])

    if (!containerName) {
        return null
    } else if (!container) {
        if (error) {
            return html`<${Alert} message=${error} />`
        } else {
            return html`<${Spinner} green center=${false} />`
        }
    }

    console.log(container)

    return html`
        <div class=${classes.root}>
            Docker status for ${container.Names[0].substr(1)}: ${container.Status}
            <details>
                <summary>Container state</summary>
                <pre>${JSON.stringify(container, null, "  ")}</pre>
            </details>
        </div>
    `
}

export default DockerControls
