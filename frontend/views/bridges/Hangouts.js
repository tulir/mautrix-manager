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
import * as api from "../../lib/api/hangouts.js"
import { makeStyles } from "../../lib/theme.js"
import Alert from "../components/Alert.js"
import Button from "../components/Button.js"
import Spinner from "../components/Spinner.js"

const bridgeOpts = {
    url: 'https://facebook.com',
    domain: 'accounts.google.com',
    cookies_keys: ['oauth_code'],
}

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

const LoginInstructions = ({ url }) => html`<ol>
    <li>Open <a href=${url} target="_blank">this link</a> in your browser.</li>
    <li>Log into your Google account normally.</li>
    <li>
        When you reach the loading screen after logging in that says
        <em>"One moment please..."</em>, open browser developer tools: <kbd>F12</kbd> on
        Windows/Linux or <kbd>Cmd</kbd> + <kbd>Option</kbd> + <kbd>I</kbd> on macOS.
    </li>
    <li>Select the "Application" (Chrome) or "Storage" (Firefox) tab.</li>
    <li>In the sidebar, expand "Cookies" and select <code>https://accounts.google.com</code>.</li>
    <li>
        In the cookie list, find the <code>oauth_code</code> row and double click on the value,
        then copy the value and enter it below.
    </li>
</ol>`

const HangoutsLogin = ({ onLoggedIn, useDesktopLogin = false }) => {
    const classes = useStyles()
    const [loading, setLoading] = useState(false)
    const [authURL, setAuthURL] = useState(null)
    const [cookie, setCookie] = useState("")
    const [error, setError] = useState(null)

    const handle = async data => {
        track("Hangouts login", { status: data.status || data.next_step })
        if (data.status === "fail") {
            setError(data.error)
        } else if (data.status === "success") {
            await onLoggedIn()
        } else if (data.status === "cancelled") {
            setError("Login cancelled")
            setAuthURL(null)
        } else if (data.next_step === "authorization") {
            setAuthURL(data.manual_auth_url)
        } else if (data.next_step) {
            setError(`Unknown step ${data.next_step}`)
        } else {
            console.error("Invalid response from bridge:", data)
            setError("Invalid response from bridge")
        }
    }

    const start = async () => {
        await handle(await api.loginStart(true))
    }

    const submit = async () => await handle(await api.loginStep("authorization", {
        authorization: cookie,
    }))

    const call = method => evt => {
        evt.preventDefault()
        setLoading(true)
        setError(null)
        method()
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }

    if (useDesktopLogin) {
        useEffect(() => {
            const fn = async evt => {
                if (evt.data.type !== "finish-oauth") {
                    console.log("Unknown postMessage command:", evt.data)
                    return
                }

                const { domain, cookies } = evt.data.payload;
                if (domain !== bridgeOpts.domain) {
                    return;
                }
                track("Hangouts login");
                setLoading(true)
                setError(null)
                const cookieName = bridgeOpts.cookies_keys[0];
                setCookie(cookies[cookieName]);
                submit()
                    .catch(err => setError(err.message))
                    .finally(() => setLoading(false))
                ;
            }
            window.addEventListener("message", fn)
            return () => window.removeEventListener("message", fn)
        }, []);

        const onStartOAuthClick = () => {
            window.parent.postMessage({
                type: 'start-oauth',
                payload: bridgeOpts,
            }, '*');
        };

        return html`
            <div class=${classes.root}>
                <h2>Sign into Hangouts</h2>
                <p>
                To start using the Matrix-Hangouts bridge, please sign in with your Google account.
                </p>
                ${authURL ? html`
                    <${Button} onClick=${onStartOAuthClick}>
                        ${loading ? html`<${Spinner} size=20 />` : "Sign in"}
                    </Button>
                ` : html`<${Button} onClick=${call(start)}>Start</Button>`}
                <${Alert} message=${error} />
            </div>
        `;
    }

    return html`
        <form class=${classes.root} onSubmit=${call(submit)}>
            <h2>Sign into Hangouts</h2>
            <p>
                To start using the Matrix-Hangouts bridge, please use one of the options below to
                sign in with your Google account.
            </p>
            <h3>Browser extension (easy way)</h3>
            <p>Coming soon</p>
            <h3>Manual login (hard way)</h3>
            ${authURL ? html`
                <${LoginInstructions} url=${authURL} />
                <input type="string" value=${cookie} placeholder="Authorization cookie"
                       class=${classes.input} onChange=${evt => setCookie(evt.target.value)} />
                <${Button} type="submit" disabled=${!cookie}>
                    ${loading ? html`<${Spinner} size=20 />` : "Sign in"}
                </Button>
            ` : html`<${Button} onClick=${call(start)}>Start</Button>`}
            <${Alert} message=${error} />
        </form>
    `
}

const HangoutsBridge = ({ useDesktopLogin }) => {
    const [bridgeState, setBridgeState] = useState(null)
    const [error, setError] = useState(null)

    useEffect(async () => {
        try {
            setBridgeState(await api.whoami())
        } catch (err) {
            setError(err.message)
        }
    }, [])

    const logout = async () => {
        track("Hangouts logout")
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
        <pre>${JSON.stringify(bridgeState, null, "  ")}</pre>
        ${bridgeState.hangouts
        ? html`<${Button} onClick=${logout}>Sign out</Button>`
        : html`<${HangoutsLogin} onLoggedIn=${onLoggedIn} useDesktopLogin=${useDesktopLogin} />`}
        <${Alert} message=${error} />
    `
}

export default HangoutsBridge

