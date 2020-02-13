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
import { html } from "../web_modules/htm/preact.js"
import { Router } from "../web_modules/preact-router.js"
import { createHashHistory } from "../web_modules/history.js"

import { makeStyles } from "../lib/theme.js"
import TelegramBridge from "./bridges/Telegram.js"
import FacebookBridge from "./bridges/Facebook.js"
import WhatsAppBridge from "./bridges/WhatsApp.js"
import LoginView from "./Login.js"

const useStyles = makeStyles({})

const Main = () => {
    const classes = useStyles()
    const [loggedIn, setLoggedIn] = useState(Boolean(localStorage.accessToken))

    const handleExtension = () => {
        window.dispatchEvent(new CustomEvent("mautrix-cookie-monster-response"), {
            detail: {
                loggedIn,
                token: localStorage.accessToken,
                url: window.location.origin,
            },
        })
    }

    useEffect(() => {
        window.addEventListener("mautrix-cookie-monster-appeared", handleExtension)
        return () => window.removeEventListener("mautrix-cookie-monster-appeared", handleExtension)
    }, [loggedIn])

    if (!loggedIn) {
        return html`<${LoginView}
            onLoggedIn=${() => setLoggedIn(Boolean(localStorage.accessToken))}
        />`
    }

    return html`
        Logged in as ${localStorage.mxUserID}
        <nav>
            <a href="/">Home</a>
            —
            <a href="/telegram">Telegram</a>
            —
            <a href="/facebook">Facebook</a>
            —
            <a href="/whatsapp">WhatsApp</a>
        </nav>
        <${Router} history=${createHashHistory()}>
            <div path="/">This is the home</div>
            <${TelegramBridge} path="/telegram" />
            <${FacebookBridge} path="/facebook" />
            <${WhatsAppBridge} path="/whatsapp" />
        </Router>
    `
}

export default Main
