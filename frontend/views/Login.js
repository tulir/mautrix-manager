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
import { useState, useRef, useLayoutEffect, useEffect } from "../web_modules/preact/hooks.js"
import { html } from "../web_modules/htm/preact.js"

import {
    resolveWellKnown, loginMatrix, requestOpenIDToken, requestIntegrationToken,
} from "../lib/api/login.js"
import Button from "./components/Button.js"
import Spinner from "./components/Spinner.js"
import { makeStyles } from "../lib/theme.js"
import track, { checkTrackingEnabled } from "../lib/api/tracking.js"

const useStyles = makeStyles(theme => ({
    root: {
        position: "fixed",
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
        backgroundColor: theme.color.primary,
        display: "flex",
        justifyContent: "space-around",
    },
    loginBox: {
        backgroundColor: theme.color.background,
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
        color: theme.color.primary,
        margin: ".5rem auto 3rem",
    },
    input: {
        margin: ".5rem 0",
        borderRadius: ".25rem",
        border: `1px solid ${theme.color.border}`,
        padding: "1px",
        "&:hover, &:focus, &$focus": {
            borderColor: theme.color.primary,
        },
        "&:focus, &$focus": {
            borderWidth: "2px",
            padding: 0,
        },
    },
    username: {
        display: "flex",
        cursor: "text",
        "& > input": {
            border: "none",
            padding: ".75rem .125rem",
            color: theme.color.text,
            minWidth: 0,
            fontSize: "1rem",
            "&:last-of-type": {
                paddingRight: ".5rem",
                borderRadius: "0 .25rem .25rem 0",
            },
            "&:focus": {
                // We show focus with the border width.
                outline: "none",
            },
        },
        "& > span": {
            userSelect: "none",
            padding: ".75rem 0",
            color: theme.color.text,
            "&:first-of-type": {
                paddingLeft: ".5rem",
            },
        },
    },
    password: {
        ...theme.input(),
    },
    error: {
        padding: "1rem",
        borderRadius: ".25rem",
        border: `2px solid ${theme.color.errorDark}`,
        backgroundColor: theme.color.error,
        margin: ".5rem 0",
        width: "100%",
        boxSizing: "border-box",
    },

    focus: {},
    hasError: {},
}), { name: "login" })

const LoginView = ({ onLoggedIn }) => {
    const classes = useStyles()

    const usernameWrapperRef = useRef()
    const usernameRef = useRef()
    const serverRef = useRef()
    const passwordRef = useRef()
    const [loading, setLoading] = useState(false)
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
        } else if (evt.target.name === "server" && !evt.target.value && evt.key === "Backspace") {
            usernameRef.current.focus()
        }
    }

    const paste = evt => {
        if (usernameRef.current.value !== "" || serverRef.current.value !== "") {
            return
        }

        let data = evt.clipboardData.getData("text")
        if (data.startsWith("@")) {
            data = data.substr(1)
        }
        const separator = data.indexOf(":")
        if (separator === -1) {
            setUsername(data)
        } else {
            setUsername(data.substr(0, separator))
            setServer(data.substr(separator + 1))
            serverRef.current.focus()
        }
        evt.preventDefault()
    }

    useLayoutEffect(() => usernameRef.current.focus(), [])
    const onFocus = () => setUserIDFocused(true)
    const onBlur = () => setUserIDFocused(false)

    const submit = async () => {
        try {
            const url = await resolveWellKnown(server)
            const [accessToken, userID, realURL] = await loginMatrix(url, username, password)
            const openIDToken = await requestOpenIDToken(realURL, userID, accessToken)
            const integrationData = await requestIntegrationToken(openIDToken)
            localStorage.mxAccessToken = accessToken
            localStorage.mxHomeserver = realURL
            localStorage.mxUserID = userID
            localStorage.accessToken = integrationData.token
            localStorage.accessLevel = integrationData.level
            checkTrackingEnabled().then(() => track("Manager login", { method: "direct" }))
            onLoggedIn()
        } catch (err) {
            setError(err.message)
        }
    }

    useEffect(() => {
        const fn = async evt => {
            // if (evt.source !== window.opener) {
            //     console.warn("postMessage from unknown source:", evt)
            //     return
            // }
            if (evt.data.type !== "login") {
                console.log("Unknown postMessage command:", evt.data)
                return
            }
            setLoading(true)
            try {
                const integrationData = await requestIntegrationToken(evt.data.token)
                localStorage.mxUserID = integrationData.user_id
                localStorage.accessToken = integrationData.token
                localStorage.accessLevel = integrationData.level
                checkTrackingEnabled().then(() => track("Manager login", { method: "direct" }))
                onLoggedIn()
            } catch (err) {
                setError(err.message)
            }
            setLoading(false)
        }
        window.addEventListener("message", fn)
        return () => window.removeEventListener("message", fn)
    })

    const onSubmit = evt => {
        evt.preventDefault()
        setError(null)
        setLoading(true)
        submit()
            .catch(err => console.error("Fatal error:", err))
            .finally(() => setLoading(false))
    }

    const usernameWrapperClick = evt => evt.target === usernameWrapperRef.current
        && usernameRef.current.focus()

    const disableSubmit = !username || !server || !password
    return html`<main class=${classes.root}>
        <form class="${classes.loginBox} ${error ? classes.hasError : ""}" onSubmit=${onSubmit}>
            <h1 class=${classes.header}>mautrix-manager</h1>
            <div class="${classes.username} ${classes.input} ${userIDFocused ? classes.focus : ""}"
                 ref=${usernameWrapperRef} onClick=${usernameWrapperClick}>
                <span onClick=${() => usernameRef.current.focus()}>@</span>
                <input type="text" placeholder="username" name="username" value=${username}
                       onChange=${evt => setUsername(evt.target.value)} ref=${usernameRef}
                       onKeyDown=${keyDown} onFocus=${onFocus} onBlur=${onBlur} onPaste=${paste} />
                <span onClick=${() => serverRef.current.focus()}>:</span>
                <input type="text" placeholder="example.com" name="server" value=${server}
                       onChange=${evt => setServer(evt.target.value)} ref=${serverRef}
                       onKeyDown=${keyDown} onFocus=${onFocus} onBlur=${onBlur} />
            </div>
            <input type="password" placeholder="password" name="password" value=${password}
                   class="${classes.password} ${classes.input}" ref=${passwordRef}
                   onChange=${evt => setPassword(evt.target.value)} />
            <${Button} type="submit" disabled=${disableSubmit}
                       title=${disableSubmit && "Fill out the form before submitting"}>
                 ${loading ? html`<${Spinner} size=30 />` : "Log in"}
            </Button>
            ${error && html`<div class=${classes.error}>
                ${error}
            </div>`}
        </form>
    </main>`
}

export default LoginView
