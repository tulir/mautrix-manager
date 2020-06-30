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
import * as api from "../../lib/api/instagram.js"
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
    buttonGroup: {
        display: "flex",
        width: "100%",
        "& > button": {
            flex: 1,
            "&:not(:first-of-type)": {
                marginLeft: ".5rem",
            },
        },
    },
}), { name: "instagram" })

const InstagramLogin = ({ onLoggedIn, hasSessions }) => {
    const classes = useStyles()
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState("/login/password")
    const [username, setUsername] = useState("")
    const [sessionID, setSessionID] = useState("")
    const [password, setPassword] = useState("")
    const [code, setCode] = useState("")
    const [error, setError] = useState(null)

    const submit = async () => {
        track("Instagram login", { step })
        let payload
        if (step === "/login/password") payload = { username, password }
        else if (step === "/login/2fa" || step === "/login/checkpoint") payload = { code }
        // eslint-disable-next-line camelcase
        else if (step === "/login/cookie") payload = { session_id: sessionID }
        const resp = await api.login(step, payload)
        if (resp.next_step) {
            setStep(resp.next_step)
        } else {
            await onLoggedIn(resp.puppet_id)
            setStep("/login/done")
        }
    }

    let content
    if (step === "/login/password") {
        content = html`
            <p>Please enter your username and password to sign into the Instagram bridge.</p>
            <input type="text" value=${username} placeholder="Username" class=${classes.input}
                   onChange=${evt => setUsername(evt.target.value)} />
            <input type="password" value=${password} placeholder="Password" class=${classes.input}
                   onChange=${evt => setPassword(evt.target.value)} />
            <div class=${classes.buttonGroup}>
                <${Button} type="submit" disabled=${!username || !password}>
                    ${loading ? html`<${Spinner} size=20 />` : "Sign in"}
                </Button>
                ${/*This is hidden until it has instructions and is confirmed to work
                <${Button} variant="outlined" onClick=${() => setStep("/login/cookie")}>
                    Use cookie login
                </Button>*/ null}
            </div>
        `
    } else if (step === "/login/cookie") {
        content = html`
            <p>
                // TODO: instructions
            </p>
            <input type="text" value=${sessionID} placeholder="Session ID" class=${classes.input}
                   onChange=${evt => setSessionID(evt.target.value)} />
            <div class=${classes.buttonGroup}>
                <${Button} type="submit" disabled=${!sessionID}>
                    ${loading ? html`<${Spinner} size=20 />` : "Sign in"}
                </Button>
                <${Button} variant="outlined" onClick=${() => setStep("/login/password")}>
                    Use normal login
                </Button>
            </div>
        `
    } else if (step === "/login/2fa") {
        content = html`
            <p>
                Username and password accepted, but you have two-factor authentication enabled.
                Please enter the code from SMS or an authenticator app here.
            </p>
            <input type="number" value=${code} placeholder="2-factor code" class=${classes.input}
                   onChange=${evt => setCode(evt.target.value)} />
            <${Button} disabled=${!code} type="submit">
                ${loading ? html`<${Spinner} size=20 />` : "Sign in"}
            </Button>
        `
    } else if (step === "/login/checkpoint") {
        content = html`
            <p>
                Username and password accepted, but Instagram wants to verify it's really you.
                Please enter the code you were sent.
            </p>
            <input type="password" value=${code} placeholder="Checkpoint code"
                   class=${classes.input} onChange=${evt => setCode(evt.target.value)} />
            <${Button} type="submit">
                ${loading ? html`<${Spinner} size=20 />` : "Sign in"}
            </Button>
        `
    } else if (step === "/login/done") {
        content = html`
            <p>Logged in successfully!</p>
        `
    }

    const onSubmit = evt => {
        evt.preventDefault()
        setLoading(true)
        setError(null)
        submit()
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }

    const text = hasSessions
        ? "You're already using the Instagram bridge. If you want to bridge more accounts, " +
        "you can sign in again below."
        : "To start using the Matrix-Instagram bridge, sign in with your Instagram account below."
    return html`<form class=${classes.root} onSubmit=${onSubmit}>
        <h2>Sign into Instagram</h2>
        <p>${text}</p>
        ${content}
        <${Alert} message=${error} />
    </form>`
}

const InstagramBridge = () => {
    const [bridgeState, setBridgeState] = useState(null)
    const [error, setError] = useState(null)

    useEffect(async () => {
        try {
            setBridgeState(await api.status())
        } catch (err) {
            setError(err.message)
        }
    }, [])

    const unlink = id => async () => {
        try {
            track("Instagram unlink")
            await api.unlink(id)
            setBridgeState(await api.status())
        } catch (err) {
            setError(err)
        }
    }

    if (!bridgeState) {
        if (error) {
            return html`Error: ${error}`
        }
        return html`<${Spinner} size=80 green />`
    }

    const onLoggedIn = async () => setBridgeState(await api.status())

    return html`
        <ul>
            ${bridgeState.puppets.map(puppet => html`
                <li>
                    ${puppet.description}
                    <button onClick=${unlink(puppet.puppetId)}>Unlink</button>
                </li>
            `)}
        </ul>
        <${Alert} message=${error} />
        <${InstagramLogin} onLoggedIn=${onLoggedIn} hasSessions=${bridgeState.puppets.length > 0} />
        <details>
            <summary>Internal bridge state</summary>
            <pre>${JSON.stringify(bridgeState, null, "  ")}</pre>
        </details>
    `
}

export default InstagramBridge
