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
import { html } from "../../web_modules/htm/preact.js"
import { useEffect, useRef, useState } from "../../web_modules/preact/hooks.js"
import ANSIToHTML from "../../web_modules/ansi-to-html.js"

import { makeStyles } from "../../lib/theme.js"
import * as api from "../../lib/api/docker.js"
import Spinner from "../components/Spinner.js"

const useStyles = makeStyles({
    root: {
        overflow: "auto",
        height: "100%",
        margin: 0,
    },
    loading: {
        padding: "1rem",
    },
}, { name: "docker-logs" })

const Logs = ({ container }) => {
    const classes = useStyles()
    const [loading, setLoading] = useState(false)
    const stream = useRef(null)
    const logRef = useRef()

    useEffect(() => {
        setLoading(true)
        ;(async () => {
            stream.current = await api.streamLogs(container.Id)
            setLoading(false)
            const ansiConverter = new ANSIToHTML()
            for await (const lines of stream.current.read()) {
                const log = logRef.current
                let scrollDown = false
                if (log.scrollHeight - log.scrollTop - log.clientHeight < 1) {
                    scrollDown = true
                }
                for (const line of lines.split("\n")) {
                    if (!line) {
                        continue
                    }
                    const div = document.createElement("div")
                    div.innerHTML = ansiConverter.toHtml(line, {
                        escapeXML: true,
                        stream: true,
                    })
                    log.appendChild(div)
                }
                if (scrollDown) {
                    log.scrollTop = log.scrollHeight - log.clientHeight
                }
            }
        })()
        return () => stream.current.close()
    }, [])

    if (loading) {
        return html`<div class=${classes.loading}>
            <${Spinner} noMargin noCenter green size=120 />
        </div>`
    }

    return html`<pre class=${classes.root} ref=${logRef}></pre>`
}

export default Logs
