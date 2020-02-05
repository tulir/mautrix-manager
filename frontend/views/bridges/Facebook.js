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
import { useEffect, useState } from "/web_modules/preact/hooks.js"
import { html } from "/web_modules/htm/preact.js"

import * as api from "../../lib/api/facebook.js"
import Spinner from "../../lib/Spinner.js"
import { makeStyles } from "../../lib/theme.js"

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
    submit: {
        ...theme.button(),
    },
    error: {
        padding: ".75rem",
        borderRadius: ".25rem",
        border: `2px solid ${theme.color.errorDark}`,
        backgroundColor: theme.color.error,
        margin: ".5rem 0",
        width: "100%",
        boxSizing: "border-box",
    },
}))

const manualInstructions = html`<ol>
    <li>Log in to Facebook normally.</li>
    <li>Press <kbd>F12</kbd> to open developer tools.</li>
    <li>Select the "Application" (Chrome) or "Storage" (Firefox) tab.</li>
    <li>In the sidebar, expand "Cookies" and select <code>https://www.facebook.com</code>.</li>
    <li>In the cookie list, find the <code>c_user</code> and <code>xs</code> rows.</li>
    <li>Copy the values of both rows into the appropriate input fields below.</li>
</ol>`

const FacebookLogin = ({ onLoggedIn }) => {
    const classes = useStyles()
    const [loading, setLoading] = useState(false)
    const [xs, setXS] = useState("")
    const [user, setUser] = useState("")
    const [error, setError] = useState(null)

    const submit = async () => {
        await api.login({
            // eslint-disable-next-line camelcase
            c_user: user,
            xs,
        })
        await onLoggedIn()
    }

    const onSubmit = evt => {
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
            ${manualInstructions}
            <input type="string" value=${user} placeholder="c_user cookie" class=${classes.input}
                   onChange=${evt => setUser(evt.target.value)} />
            <input type="string" value=${xs} placeholder="xs cookie" class=${classes.input}
                   onChange=${evt => setXS(evt.target.value)} />
            <button class=${classes.submit} type="submit">
                ${loading ? html`<${Spinner} size=20 />` : "Request code"}
            </button>
            ${error && html`<div class=${classes.error}>${error}</div>`}
        </form>
    `
}

const useMainStyles = makeStyles(theme => ({
    button: {
        ...theme.button(),
        width: "10rem",
    },
}))

const FacebookBridge = () => {
    const classes = useMainStyles()
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
        ${bridgeState.facebook
        ? html`<button type="button" onClick=${logout} class=${classes.button}>Sign out</button>`
        : html`<${FacebookLogin} onLoggedIn=${onLoggedIn} />`}
        ${error && `Error: ${error}`}
    `
}

export default FacebookBridge
