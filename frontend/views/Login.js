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
        padding: "2.5rem",
        marginTop: "3rem",
        borderRadius: ".25rem",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
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
        margin: ".5rem 0 0",
        borderRadius: ".25rem",
        border: "none",
        color: "white",
        fontSize: "1rem",
        padding: 0,
        "&:hover": {
            backgroundColor: "#009624",
        },
    },

    focus: {},
})

const resolveWellKnown = async (server) => {
    try {
        const resp = await fetch(`https://${server}/.well-known/matrix/client`)
        const data = await resp.json()
        return data["m.homeserver"].base_url
    } catch (err) {
        console.error("Resolution failed:", err)
        return null
    }
}

const login = async (address, username, password) => {
    try {
        const resp = await fetch(`${address}/_matrix/client/r0/login`, {
            method: "POST",
            body: JSON.stringify({
                type: "m.login.password",
                identifier: {
                    type: "m.id.user",
                    user: username,
                },
                password,
                // eslint-disable-next-line camelcase
                initial_device_display_name: "mautrix-manager",
            }),
            headers: {
                "Content-Type": "application/json",
            },
        })
        const data = await resp.json()
        if (data.well_known && data.well_known["m.homeserver"]) {
            address = data.well_known["m.homeserver"].base_url || address
        }
        return [data.access_token, data.user_id, address]
    } catch (err) {
        console.error("Login failed:", err)
        return [null, address]
    }
}

const requestOpenIDToken = async (address, userID, accessToken) => {
    try {
        const url = `${address}/_matrix/client/r0/user/${userID}/openid/request_token`
        const resp = await fetch(url, {
            method: "POST",
            body: "{}",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        })
        return await resp.json()
    } catch (err) {
        console.error("OpenID token request failed:", err)
        return null
    }
}

const requestIntegrationToken = async (tokenData) => {
    try {
        const resp = await fetch("/_matrix/integrations/v1/account/register", {
            method: "POST",
            body: JSON.stringify(tokenData),
            headers: {
                "Content-Type": "application/json",
            },
        })
        return await resp.json()
    } catch (err) {
        console.error("Integration manager register failed:", err)
        return null
    }
}

const LoginView = ({ onLoggedIn }) => {
    const classes = useStyles()

    const serverRef = useRef()
    const [userIDFocused, setUserIDFocused] = useState(false)
    const [username, setUsername] = useState("")
    const [server, setServer] = useState("")
    const [password, setPassword] = useState("")

    const usernameKeyDown = evt => {
        if (evt.key === ":") {
            serverRef.current.focus()
            evt.preventDefault()
        }
    }

    const onFocus = () => setUserIDFocused(true)
    const onBlur = () => setUserIDFocused(false)

    const submit = async () => {
        const url = await resolveWellKnown(server)
        if (!url) return
        const [accessToken, userID, realURL] = await login(url, username, password)
        if (!accessToken) return
        const openIDToken = await requestOpenIDToken(realURL, userID, accessToken)
        if (!openIDToken) return
        const integrationData = await requestIntegrationToken(openIDToken)
        if (!integrationData) return
        localStorage.accessToken = integrationData.token
        localStorage.accessLevel = integrationData.level
        onLoggedIn()
    }

    const trySubmit = evt => {
        evt.preventDefault()
        submit().catch(err => console.error("Fatal error:", err))
    }

    return html`<main class=${classes.root}>
        <form class=${classes.loginBox} onSubmit=${trySubmit}>
            <h1 class=${classes.header}>mautrix-manager</h1>
            <div class="${classes.username} ${classes.input} ${userIDFocused ? classes.focus : ""}">
                <span>@</span>
                <input type="text" placeholder="username" name="username" value=${username}
                       onChange=${evt => setUsername(evt.target.value)}
                       onKeyDown=${usernameKeyDown} onFocus=${onFocus} onBlur=${onBlur} />
                <span>:</span>
                <input type="text" placeholder="example.com" name="server" value=${server}
                       onChange=${evt => setServer(evt.target.value)} ref=${serverRef}
                       onFocus=${onFocus} onBlur=${onBlur} />
            </div>
            <input type="password" placeholder="password" name="password" value=${password}
                   class="${classes.password} ${classes.input}"
                   onChange=${evt => setPassword(evt.target.value)} />
            <button type="submit" class=${classes.submit}>Log in</button>
        </form>
    </main>`
}

export default LoginView
