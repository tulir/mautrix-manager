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
import { useState, useRef } from "/web_modules/preact/hooks.js"
import { html } from "/web_modules/htm/preact.js"
import { createUseStyles } from "/web_modules/react-jss.js"

const useStyles = createUseStyles({
    root: {
        position: "fixed",
        inset: "0 0 0 0",
        backgroundColor: "#00C853",
        display: "flex",
        justifyContent: "space-around",
    },
    loginBox: {
        backgroundColor: "white",
        width: "25rem",
        height: "22.5rem",
        padding: "2.5rem 2.5rem 2rem",
        marginTop: "3rem",
        borderRadius: ".25rem",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        "&$hasError": {
            minHeight: "27rem",
            height: "auto",
            marginBottom: "auto",
        },
    },
    header: {
        color: "#00C853",
        margin: ".5rem auto 3rem",
    },
    input: {
        margin: ".5rem 0",
        borderRadius: ".25rem",
        border: "1px solid #ddd",
        padding: "1px",
        "&:hover, &:focus, &$focus": {
            borderColor: "#00C853",
        },
        "&:focus, &$focus": {
            borderWidth: "2px",
            padding: 0,
        },
    },
    username: {
        display: "flex",
        "& > input": {
            border: "none",
            padding: ".75rem .125rem",
            color: "#212121",
            minWidth: 0,
            fontSize: "1rem",
            "&:last-of-type": {
                paddingRight: ".5rem",
                borderRadius: "0 .25rem .25rem 0",
            },
        },
        "& > span": {
            userSelect: "none",
            padding: ".75rem 0",
            color: "#212121",
            "&:first-of-type": {
                paddingLeft: ".5rem",
            },
        },
    },
    password: {
        padding: "calc(.75rem + 1px) 1rem",
        fontSize: "1rem",
        "&:focus": {
            padding: ".75rem calc(1rem - 1px)",
        },
    },
    submit: {
        backgroundColor: "#00C853",
        cursor: "pointer",
        height: "3rem",
        margin: ".5rem 0",
        borderRadius: ".25rem",
        border: "none",
        color: "white",
        fontSize: "1rem",
        padding: 0,
        "&:hover": {
            backgroundColor: "#009624",
        },
        "&:disabled": {
            backgroundColor: "#ccc",
            cursor: "default",
        },
    },
    error: {
        padding: "1rem",
        borderRadius: ".25rem",
        border: "2px solid #B71C1C",
        backgroundColor: "rgba(240, 85, 69, .5)",
        margin: ".5rem 0",
        width: "100%",
        boxSizing: "border-box",
    },

    focus: {},
    hasError: {},
})

const resolveWellKnown = async (server) => {
    try {
        const resp = await fetch(`https://${server}/.well-known/matrix/client`)
        const data = await resp.json()
        return data["m.homeserver"].base_url
    } catch (err) {
        console.error("Resolution failed:", err)
        throw new Error(`Failed to resolve URL for ${server}`)
    }
}

const login = async (address, username, password) => {
    let resp
    try {
        resp = await fetch(`${address}/_matrix/client/r0/login`, {
            method: "POST",
            body: JSON.stringify({
                type: "m.login.password",
                identifier: {
                    type: "m.id.user",
                    user: username,
                },
                password,
                /* eslint-disable camelcase */
                device_id: "mautrix-manager",
                initial_device_display_name: "mautrix-manager",
                /* eslint-enable camelcase */
            }),
            headers: {
                "Content-Type": "application/json",
            },
        })
    } catch (err) {
        console.error("Login failed:", err)
        throw new Error(`Could not connect to ${address}`)
    }
    let data
    try {
        data = await resp.json()
    } catch (err) {
        console.error("Login JSON parse failed:", err)
        throw new Error(`Invalid login response from ${address}`)
    }
    if (resp.status !== 200) {
        console.error("Unexpected login status", resp.status, data)
        throw new Error(data.error || `Invalid login response from ${address}`)
    }
    if (data.well_known && data.well_known["m.homeserver"]) {
        address = data.well_known["m.homeserver"].base_url || address
    }
    return [data.access_token, data.user_id, address]
}

const requestOpenIDToken = async (address, userID, accessToken) => {
    let resp
    try {
        const url = `${address}/_matrix/client/r0/user/${userID}/openid/request_token`
        resp = await fetch(url, {
            method: "POST",
            body: "{}",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        })
    } catch (err) {
        console.error("OpenID token request failed:", err)
        throw new Error(`Failed to request OpenID token for ${userID}`)
    }
    let data
    try {
        data = await resp.json()
    } catch (err) {
        console.error("OpenID token request JSON parse failed:", err)
        throw new Error("Invalid OpenID response")
    }
    if (resp.status !== 200) {
        console.error("Unexpected OpenID token request status", resp.status, data)
        throw new Error(data.error || "Invalid OpenID response")
    }
    return data
}

const requestIntegrationToken = async (tokenData) => {
    let resp
    try {
        resp = await fetch("/_matrix/integrations/v1/account/register", {
            method: "POST",
            body: JSON.stringify(tokenData),
            headers: {
                "Content-Type": "application/json",
            },
        })
    } catch (err) {
        console.error("Integration manager register failed:", err)
        throw new Error("Could not connect to mautrix-manager")
    }
    let data
    try {
        data = await resp.json()
    } catch (err) {
        console.error("Integration register JSON parse failed:", err)
        throw new Error("Invalid mautrix-manager registration response")
    }
    if (resp.status !== 200) {
        console.error("Unexpected integration manager register status", resp.status, data)
        throw new Error(data.error || "Invalid mautrix-manager registration response")
    }
    return data
}

const LoginView = ({ onLoggedIn }) => {
    const classes = useStyles()

    const serverRef = useRef()
    const passwordRef = useRef()
    const [userIDFocused, setUserIDFocused] = useState(false)
    const [username, setUsername] = useState("")
    const [server, setServer] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState(null)

    const keyDown = evt => {
        if ((evt.target.name === "username" && evt.key === ":") || evt.key === "Enter") {
            if (evt.target.name === "username") {
                serverRef.current.focus()
            } else if (evt.target.name === "server") {
                passwordRef.current.focus()
            }
            evt.preventDefault()
        }
    }

    const onFocus = () => setUserIDFocused(true)
    const onBlur = () => setUserIDFocused(false)

    const submit = async () => {
        try {
            const url = await resolveWellKnown(server)
            const [accessToken, userID, realURL] = await login(url, username, password)
            const openIDToken = await requestOpenIDToken(realURL, userID, accessToken)
            const integrationData = await requestIntegrationToken(openIDToken)
            localStorage.accessToken = integrationData.token
            localStorage.accessLevel = integrationData.level
            onLoggedIn()
        } catch (err) {
            setError(err.message)
        }
    }

    const onSubmit = evt => {
        evt.preventDefault()
        submit().catch(err => console.error("Fatal error:", err))
    }

    return html`<main class=${classes.root}>
        <form class="${classes.loginBox} ${error ? classes.hasError : ""}" onSubmit=${onSubmit}>
            <h1 class=${classes.header}>mautrix-manager</h1>
            <div class="${classes.username} ${classes.input} ${userIDFocused ? classes.focus : ""}">
                <span>@</span>
                <input type="text" placeholder="username" name="username" value=${username}
                       onChange=${evt => setUsername(evt.target.value)}
                       onKeyDown=${keyDown} onFocus=${onFocus} onBlur=${onBlur} />
                <span>:</span>
                <input type="text" placeholder="example.com" name="server" value=${server}
                       onChange=${evt => setServer(evt.target.value)} ref=${serverRef}
                       onKeyDown=${keyDown} onFocus=${onFocus} onBlur=${onBlur} />
            </div>
            <input type="password" placeholder="password" name="password" value=${password}
                   class="${classes.password} ${classes.input}" ref=${passwordRef}
                   onChange=${evt => setPassword(evt.target.value)} />
            <button type="submit" class=${classes.submit}
                    disabled=${!username || !server || !password}>
                Log in
            </button>
            ${error && html`<div class=${classes.error}>
                ${error}
            </div>`}
        </form>
    </main>`
}

export default LoginView
