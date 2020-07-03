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
import { parseQuery, useQuery } from "../../lib/useHashLocation.js"
import * as api from "../../lib/api/twitter.js"
import * as config from "../../lib/api/config.js"
// import { makeStyles } from "../../lib/theme.js"
import Alert from "../components/Alert.js"
import Button from "../components/Button.js"
import Spinner from "../components/Spinner.js"

// const useStyles = makeStyles(theme => ({}), { name: "twitter" })

const TwitterBridge = () => {
    // const classes = useStyles()
    const [bridgeState, setBridgeState] = useState(null)
    const [linking, setLinking] = useState(false)
    const [error, setError] = useState(null)
    const [hashQuery] = useQuery()

    useEffect(async () => {
        try {
            await api.initClientInfo()
            setBridgeState(await api.status())
        } catch (err) {
            setError(err.message)
        }
    }, [])

    const query = Object.assign({}, hashQuery, parseQuery(window.location.search.substr(1)))

    useEffect(async () => {
        if (query.oauth_token && query.oauth_verifier) {
            const [hashStart] = location.hash.split("?", 1)
            const url = `${location.protocol}//${location.host}${location.pathname}${hashStart}`
            const data = JSON.parse(localStorage.twitterLinking)
            if (data.token !== query.oauth_token) {
                setError("Mismatching OAuth token in localstorage")
                window.history.replaceState({}, "", url)
                return
            }
            track("Twitter link callback")
            console.log("Linking", query.oauth_token, query.oauth_verifier)
            setLinking(true)
            try {
                await api.link(query.oauth_token, data.secret, query.oauth_verifier)
                setBridgeState(await api.status())
            } catch (err) {
                setError(err.message)
            }
            window.history.replaceState({}, "", url)
            setLinking(false)
        }
    }, [query.oauth_verifier])

    if (!bridgeState) {
        if (error) {
            return html`Error: ${error}`
        }
        return html`<${Spinner} size=80 green />`
    }

    const getStaticLinkURL = () => {
        const query = new URLSearchParams({
            // eslint-disable-next-line camelcase
            manager_token: api.staticLinkStartToken,
        }).toString()
        let path = location.pathname
        if (path.endsWith("/")) {
            path = path.slice(0, -1)
        }
        path += "/ui/twitter-link/start"
        if (!path.startsWith("/")) {
            path = `/${path}`
        }
        return `${location.origin}${path}?${query}`
    }

    const getManagerLinkURL = async () => {
        let data
        try {
            data = await api.makeLoginURL()
        } catch (err) {
            console.error(err)
            setError(err)
            return
        }
        localStorage.twitterLinking = JSON.stringify({
            token: data.oauth_token,
            secret: data.oauth_secret,
        })
        return data.url
    }

    const link = async () => {
        track("Twitter link")
        const url = api.useStaticLinking ? getStaticLinkURL() : await getManagerLinkURL()
        window.open(url, "_blank")
    }

    const unlink = id => async () => {
        try {
            track("Twitter unlink")
            await api.unlink(id)
            setBridgeState(await api.status())
        } catch (err) {
            setError(err)
        }
    }

    return html`
        <${Button} onClick=${link}>Set up Twitter connection</Button>
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
        ${config.internalBridgeInfo && html`<details>
            <summary>Internal bridge state</summary>
            <pre>${JSON.stringify(bridgeState, null, "  ")}</pre>
        </details>`}
    `
}

export default TwitterBridge
