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
import { useEffect, useState, useRef } from "../../web_modules/preact/hooks.js"
import { html } from "../../web_modules/htm/preact.js"

import track from "../../lib/api/tracking.js"
import * as api from "../../lib/api/facebook.js"
import * as config from "../../lib/api/config.js"
import { makeStyles } from "../../lib/theme.js"
import Alert from "../components/Alert.js"
import Button from "../components/Button.js"
import Spinner from "../components/Spinner.js"

const useStyles = makeStyles(theme => ({
    root: {
        display: "flex",
        flexDirection: "column",
        maxWidth: "25rem",
        width: "100%",
        boxSizing: "border-box",
        margin: "0 auto",
        padding: "0 1rem",
    },
    input: {
        ...theme.input(),
        width: "100%",
    },
    addonIcon: {
        maxWidth: "50%",
        padding: "0 .5rem",
        boxSizing: "border-box",
    },
}), { name: "facebook" })

const domainToName = {
    "messenger.com": "Messenger",
    "facebook.com": "Facebook",
}

const ManualInstructions = ({ domain }) => html`<ol>
    <li>
        Open <a href="https://www.${domain}">${domainToName[domain] || domain}</a> in
        a private/incognito window and log in normally.
    </li>
    <li>
        While in the ${domainToName[domain] || domain} tab, open browser developer tools:
        <kbd>F12</kbd> on Windows/Linux or <kbd>Cmd</kbd> + <kbd>Option</kbd> + <kbd>I</kbd> on
        macOS.
    </li>
    <li>Select the "Application" (Chrome) or "Storage" (Firefox) tab.</li>
    <li>In the sidebar, expand "Cookies" and select <code>https://www.${domain}</code>.</li>
    <li>In the cookie list, find the <code>c_user</code> and <code>xs</code> rows.</li>
    <li>Copy the values of both rows into the appropriate input fields below.</li>
    <li>Before submitting, close the private windowe without logging out.</li>
</ol>`

const DesktopLogin = ({ onLoggedIn }) => {
    const classes = useStyles()
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const bridgeOpts = {
        url: `https://www.${api.domain}`,
        domain: api.domain,
        // eslint-disable-next-line camelcase
        cookie_keys: ["xs", "c_user"],
    }

    useEffect(() => {
        const fn = async evt => {
            if (evt.data.type !== "finish-oauth") {
                console.log("Unknown postMessage command:", evt.data)
                return
            }

            const { domain, cookies } = evt.data.payload
            if (domain !== bridgeOpts.domain) {
                return
            }
            track("Facebook login")
            setLoading(true)
            setError(null)
            try {
                await api.login(cookies)
                await onLoggedIn()
                window.open(bridgeOpts.url)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        window.addEventListener("message", fn)
        return () => window.removeEventListener("message", fn)
    }, [])

    const onStartOAuthClick = () => {
        window.parent.postMessage({
            type: "start-oauth",
            payload: bridgeOpts,
        }, "*")
    }

    return html`
        <div class=${classes.root}>
            <h2>Sign into Facebook</h2>
            <p>
                To start using the Matrix-Facebook Messenger bridge,
                please sign in with your Facebook account.
            </p>
            <${Button} onClick=${onStartOAuthClick}>
                ${loading ? html`<${Spinner} size=20 />` : "Sign in"}
            </Button>
            <${Alert} message=${error} />
        </div>
    `
}

const BrowserLogin = ({ onLoggedIn }) => {
    const classes = useStyles()
    const [loading, setLoading] = useState(false)
    const [xs, setXS] = useState("")
    const [user, setUser] = useState("")
    const [error, setError] = useState(null)
    const xsRef = useRef()

    const onUserKeyDown = evt => {
        if (evt.key === "Enter") {
            xsRef.current.focus()
        }
    }

    const submit = async () => {
        await api.login({
            // eslint-disable-next-line camelcase
            c_user: user,
            xs,
            domain: api.domain,
        })
        await onLoggedIn()
    }

    const onSubmit = evt => {
        track("Facebook login")
        evt.preventDefault()
        setLoading(true)
        setError(null)
        submit()
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }

    return html`
        <form class=${classes.root} onSubmit=${onSubmit}>
            <h2>Sign into Facebook</h2>
            <p>
                To start using the Matrix-Facebook Messenger bridge, please sign in below.
            </p>
            <${ManualInstructions} domain=${api.domain} />
            <input type="number" value=${user} placeholder="c_user cookie" class=${classes.input}
                   onChange=${evt => setUser(evt.target.value)} onKeyDown=${onUserKeyDown} />
            <input type="string" value=${xs} placeholder="xs cookie" class=${classes.input}
                   onChange=${evt => setXS(evt.target.value)} ref=${xsRef} />
            <${Button} type="submit" disabled=${!user || !xs}>
                ${loading ? html`<${Spinner} size=20 />` : "Sign in"}
            </Button>
            <${Alert} message=${error} />
        </form>
    `
}

const FacebookBridge = ({ useDesktopLogin = false }) => {
    const [bridgeState, setBridgeState] = useState(null)
    const [error, setError] = useState(null)

    useEffect(async () => {
        try {
            await api.initClientInfo()
            setBridgeState(await api.whoami())
        } catch (err) {
            setError(err.message)
        }
    }, [])

    const logout = async () => {
        track("Facebook logout")
        try {
            await api.logout()
            setBridgeState(await api.whoami())
        } catch (err) {
            setError(err.message)
        }
    }

    if (!bridgeState) {
        if (error) {
            return html`Error: ${error}`
        }
        return html`<${Spinner} size=80 green />`
    }

    const onLoggedIn = async () => setBridgeState(await api.whoami())

    return html`
        ${bridgeState.facebook ? html`
            Signed in as ${bridgeState.facebook.name}
            <${Button} onClick=${logout} style="display: block; width: 10rem;">Sign out</Button>
        ` : html`
            ${useDesktopLogin ? html`
                <${DesktopLogin} onLoggedIn=${onLoggedIn} />
            ` : html`
                <${BrowserLogin} onLoggedIn=${onLoggedIn} />
            `}
        `}
        <${Alert} message=${error} />
        ${config.internalBridgeInfo && html`<details>
            <summary>Internal bridge state</summary>
            <pre>${JSON.stringify(bridgeState, null, "  ")}</pre>
        </details>`}
    `
}

export default FacebookBridge
