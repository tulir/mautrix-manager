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

const TelegramBridge = () => {
    const [bridgeState, setBridgeState] = useState()

    useEffect(async () => {
        const resp = await fetch("/api/mautrix-telegram/me/auto", {
            headers: {
                Authorization: `Bearer ${localStorage.accessToken}`
            }
        })
        const data = await resp.json()
        setBridgeState(data)
    }, [])

    return html`<pre>${JSON.stringify(bridgeState, null, "  ")}</pre>`
}

export default TelegramBridge
