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
import { useState } from "/web_modules/preact/hooks.js"
import { html } from "/web_modules/htm/preact.js"
import { Router } from "/web_modules/preact-router.js"

import { makeStyles } from "../lib/theme.js"
import TelegramBridge from "./bridges/Telegram.js"
import LoginView from "./Login.js"

const useStyles = makeStyles({
    hello: {
        color: "red",
    },
})

const Main = () => {
    const classes = useStyles()
    const [loggedIn, setLoggedIn] = useState(Boolean(localStorage.accessToken))

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
        </nav>
        <${Router}>
            <div path="/">This is the home</div>
            <${TelegramBridge} path="/telegram" />
        </Router>
    `
}

export default Main
