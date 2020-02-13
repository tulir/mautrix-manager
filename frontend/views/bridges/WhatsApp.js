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
import { useEffect, useState, useRef, useLayoutEffect } from "../../web_modules/preact/hooks.js"
import { html } from "../../web_modules/htm/preact.js"
import QR from "../../web_modules/qrcode/lib/index.js"

import * as api from "../../lib/api/whatsapp.js"
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
    button: {
        ...theme.button(),
    },
    qrWrapper: {
        display: "flex",
        justifyContent: "space-around",
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

// eslint-disable-next-line max-len
const MenuIcon = () => html`<svg height="24px" viewBox="0 0 24 24" width="24px"><rect fill="#f2f2f2" height="24" rx="3" width="24"></rect><path d="m12 15.5c.825 0 1.5.675 1.5 1.5s-.675 1.5-1.5 1.5-1.5-.675-1.5-1.5.675-1.5 1.5-1.5zm0-2c-.825 0-1.5-.675-1.5-1.5s.675-1.5 1.5-1.5 1.5.675 1.5 1.5-.675 1.5-1.5 1.5zm0-5c-.825 0-1.5-.675-1.5-1.5s.675-1.5 1.5-1.5 1.5.675 1.5 1.5-.675 1.5-1.5 1.5z" fill="#818b90"></path></svg>`
// eslint-disable-next-line max-len
const SettingsIcon = () => html`<svg width="24" height="24" viewBox="0 0 24 24"><rect fill="#F2F2F2" width="24" height="24" rx="3"></rect><path d="M9.34 8.694a4.164 4.164 0 0 0-1.606 3.289c0 1.338.63 2.528 1.61 3.292l-1.46 2.527a7.065 7.065 0 0 1-3.052-5.82c0-2.41 1.206-4.54 3.048-5.816l1.46 2.528zm6.713 2.859c-.217-2.079-1.992-3.739-4.148-3.739-.578 0-1.128.116-1.628.329L8.819 5.617a7.042 7.042 0 0 1 3.086-.704c3.76 0 6.834 2.958 7.059 6.64h-2.91zm-1.065.43a3.083 3.083 0 1 1-6.166 0 3.083 3.083 0 0 1 6.166 0zm-6.164 6.364l1.458-2.523a4.153 4.153 0 0 0 1.623.322 4.154 4.154 0 0 0 4.12-3.524h2.922a7.062 7.062 0 0 1-7.042 6.426c-1.105 0-2.15-.25-3.081-.7zm11.197-7.21a7.88 7.88 0 0 0-.404-1.824l.286-.12a.527.527 0 0 0-.403-.973l-.29.12a8.176 8.176 0 0 0-1.197-1.77l.231-.23a.526.526 0 1 0-.744-.744l-.234.234a8.17 8.17 0 0 0-1.775-1.18l.13-.31a.526.526 0 1 0-.972-.403l-.12.313a8.463 8.463 0 0 0-1.995-.405v-.35A.533.533 0 0 0 12 2.97a.533.533 0 0 0-.535.526v.338a8.02 8.02 0 0 0-2.173.416l-.13-.313a.526.526 0 0 0-.972.402l.129.311a8.171 8.171 0 0 0-1.775 1.18l-.235-.235a.526.526 0 0 0-.743.744l.23.231A8.175 8.175 0 0 0 4.6 8.34l-.29-.12a.526.526 0 0 0-.403.971l.285.122a7.882 7.882 0 0 0-.404 1.824h-.322a.533.533 0 0 0-.526.534c0 .29.235.535.526.535h.28c.02.831.166 1.624.418 2.378l-.257.1a.523.523 0 1 0 .402.968l.252-.105a8.17 8.17 0 0 0 1.191 1.797l-.187.187a.526.526 0 1 0 .744.743l.184-.183a8.173 8.173 0 0 0 1.792 1.208l-.096.231a.526.526 0 1 0 .972.403l.096-.23c.698.24 1.436.387 2.208.428v.243c0 .29.244.526.535.526.29 0 .534-.235.534-.526v-.253a8.012 8.012 0 0 0 2.03-.417l.09.229a.523.523 0 1 0 .967-.403l-.096-.231a8.172 8.172 0 0 0 1.792-1.208l.184.183a.526.526 0 1 0 .743-.744l-.187-.186a8.174 8.174 0 0 0 1.191-1.798l.252.104a.526.526 0 1 0 .403-.971l-.257-.095a8.074 8.074 0 0 0 .417-2.378h.281c.29 0 .526-.244.526-.535a.533.533 0 0 0-.526-.534h-.323z" fill="#818B90"></path></svg>`

const WhatsAppLogin = ({ onLoggedIn }) => {
    const classes = useStyles()
    const [error, setError] = useState(null)
    const [code, setCode] = useState(null)
    const qrCanvas = useRef()

    const startLogin = async () => {
        setError(null)
        const resp = await api.login(setCode)
        if (resp.success) {
            await onLoggedIn()
        } else {
            setError(resp.error)
            setCode(null)
        }
    }

    useLayoutEffect(() => {
        if (code) {
            QR.toCanvas(qrCanvas.current, code)
        }
    }, [code])

    return html`
        <div class=${classes.root}>
            <h2>Sign into WhatsApp</h2>
            <ol>
                <li>Click "Start" below to show the code</li>
                <li>Open WhatsApp on your phone</li>
                <li>
                    Tap Menu <${MenuIcon}/> or Settings <${SettingsIcon}/> and select WhatsApp Web
                </li>
                <li>Point your phone to this screen to capture the code</li>
            </ol>
            ${code ? html`
                <div class=${classes.qrWrapper}>
                    <canvas ref=${qrCanvas} />
                </div>
            ` : html`
                <button class=${classes.button} onClick=${startLogin}>Start</button>
            `}
            ${error && html`<div class=${classes.error}>${error}</div>`}
        </div>
    `
}

const useMainStyles = makeStyles(theme => ({
    button: {
        ...theme.button(),
        width: "10rem",
    },
}))

const WhatsAppBridge = () => {
    const classes = useMainStyles()
    const [bridgeState, setBridgeState] = useState(null)
    const [error, setError] = useState(null)

    useEffect(async () => {
        try {
            setBridgeState(await api.ping())
        } catch (err) {
            setError(err.message)
        }
    }, [])

    const call = (method) => async () => {
        try {
            await method()
            setBridgeState(await api.ping())
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

    const onLoggedIn = async () => setBridgeState(await api.ping())

    return html`
        <pre>${JSON.stringify(bridgeState, null, "  ")}</pre>
        ${bridgeState.whatsapp.has_session
        ? html`<div class=${classes.buttons}>
            <button type="button" onClick=${call(api.logout)} class=${classes.button}>Sign out</button>
            <button type="button" onClick=${call(api.reconnect)} class=${classes.button}>Reconnect</button>
            <button type="button" onClick=${call(api.disconnect)} class=${classes.button}>Disconnect</button>
        </div>`
        : html`<${WhatsAppLogin} onLoggedIn=${onLoggedIn} />`}
        ${error && `Error: ${error}`}
    `
}

export default WhatsAppBridge
