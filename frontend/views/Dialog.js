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
import { html } from "../web_modules/htm/preact.js"
import { createContext } from "../web_modules/preact.js"
import { useContext, useEffect, useRef, useState } from "../web_modules/preact/hooks.js"

import { makeStyles } from "../lib/theme.js"

const useStyles = makeStyles(theme => ({
    root: {
        position: "fixed",
        inset: "0 0 0 0",
        backgroundColor: "rgba(0, 0, 0, .2)",
        display: "none",
        "&$open": {
            display: "flex",
        },
        flexDirection: "column",
        justifyContent: "space-around",
        alignItems: "center",
    },
    modal: {
        borderRadius: ".25rem",
        padding: "1rem",
        backgroundColor: theme.color.background,
        maxWidth: "calc(100% - 3rem)",
        maxHeight: "calc(100% - 3rem)",
        boxSizing: "border-box"
    },
    open: {},
}), { name: "dialog" })

const defaultContextValue = {
    open() {
        throw new Error("Dialog not mounted")
    },
    close() {
        throw new Error("Dialog not mounted")
    },
}
const DialogContext = createContext()

const Dialog = ({ contextRef }) => {
    const classes = useStyles()
    const [open, setOpen] = useState(false)
    const [component, setComponent] = useState(null)
    const [props, setProps] = useState(null)
    const closeTimeout = useRef(null)

    useEffect(() => {
        contextRef.current = {
            openDialog(component, props) {
                clearTimeout(closeTimeout.current)
                setProps(props)
                setComponent(() => component)
                setOpen(true)
            },
            closeDialog() {
                setOpen(false)
                closeTimeout.current = setTimeout(() => {
                    setComponent(null)
                    setProps(null)
                }, 500)
            },
        }
        return () => contextRef.current = defaultContextValue
    }, [])

    return html`
        <div class="${classes.root} ${open ? classes.open : ""}"
             onClick=${contextRef.current.closeDialog}>
            <div class=${classes.modal} onClick=${evt => evt.stopPropagation()}>
                ${open && component && html`<${component} ...${props} />`}
            </div>
        </div>
    `
}

export const DialogProvider = ({ children }) => {
    const contextRef = useRef(defaultContextValue)
    const proxyMethods = {
        openDialog: (...args) => contextRef.current.openDialog(...args),
        closeDialog: (...args) => contextRef.current.closeDialog(...args),
    }
    return html`
        <${Dialog} contextRef=${contextRef} />
        <${DialogContext.Provider} value=${proxyMethods}>
            ${children}
        <//>
    `
}

const useDialog = () => useContext(DialogContext)

export default useDialog
