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
import { Route, Link } from "../web_modules/wouter-preact.js"

import { makeStyles } from "../lib/theme.js"
import TelegramBridge from "./bridges/Telegram.js"
import FacebookBridge from "./bridges/Facebook.js"
import WhatsAppBridge from "./bridges/WhatsApp.js"
import DockerControls from "./docker/Controls.js"
import LoginView from "./Login.js"

const useStyles = makeStyles({}, { name: "main" })

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
            <${Link} href="#/">Home</Link>
            —
            <${Link} href="#/telegram">Telegram</Link>
            —
            <${Link} href="#/facebook">Facebook</Link>
            —
            <${Link} href="#/whatsapp">WhatsApp</Link>
        </nav>

        <${DockerControls} />
        <${Route} exact path="/">This is the home</Route>
        <${Route} path="/telegram" component=${TelegramBridge} />
        <${Route} path="/facebook" component=${FacebookBridge} />
        <${Route} path="/whatsapp" component=${WhatsAppBridge} />
    `
}

export default Main
