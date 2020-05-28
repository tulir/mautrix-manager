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
import { html } from "../../web_modules/htm/preact.js"

import track from "../../lib/api/tracking.js"
import { useQuery } from "../../lib/useHashLocation.js"
import * as api from "../../lib/api/slack.js"
import { makeStyles } from "../../lib/theme.js"
import Alert from "../components/Alert.js"
import Spinner from "../components/Spinner.js"

const useStyles = makeStyles(theme => ({}), { name: "slack" })

const SlackBridge = () => {
    const classes = useStyles()
    const [bridgeState, setBridgeState] = useState(null)
    const [linking, setLinking] = useState(false)
    const [error, setError] = useState(null)
    const [query, setQuery] = useQuery()

    useEffect(async () => {
        try {
            await api.initClientInfo()
            setBridgeState(await api.status())
        } catch (err) {
            setError(err.message)
        }
    }, [])

    useEffect(async () => {
        if (query.state === "slack-link") {
            // Make sure the client info is initialized before calling api.link()
            // This may result in two calls to the info endpoint, but whatever
            await api.initClientInfo()
            track("Slack link callback")
            console.log("Linking", query.code)
            setLinking(true)
            try {
                await api.link(query.code)
                setBridgeState(await api.status())
            } catch (err) {
                setError(err.message)
            }
            setQuery({})
            setLinking(false)
        }
    }, [query.state])

    if (!bridgeState) {
        if (error) {
            return html`Error: ${error}`
        }
        return html`<${Spinner} size=80 green />`
    }

    const unlink = id => async () => {
        try {
            track("Slack unlink")
            await api.unlink(id)
            setBridgeState(await api.status())
        } catch (err) {
            setError(err)
        }
    }

    return html`
        <a href=${api.makeLoginURL()} onClick=${() => track("Slack link")} target="_blank">
            Set up Slack connection
        </a>
        <ul>
            ${bridgeState.puppets.map(puppet => html`
                <li>
                    ${puppet.description}
                    <button onClick=${unlink(puppet.puppetId)}>Unlink</button>
                </li>
            `)}
            ${linking && html`<${Spinner} green noCenter size=20 />`}
        </ul>
        <${Alert} message=${error} />
        <details>
            <summary>Internal bridge state</summary>
            <pre>${JSON.stringify(bridgeState, null, "  ")}</pre>
        </details>
    `
}

export default SlackBridge
