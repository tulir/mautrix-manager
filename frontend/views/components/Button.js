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

import { makeStyles } from "../../lib/theme.js"

const useStyles = makeStyles(theme => ({
    root: {
        cursor: "pointer",
        height: "2.5rem",
        margin: ".5rem 0",
        borderRadius: ".25rem",
        fontSize: "1rem",
        boxSizing: "border-box",
        padding: 0,
        "&:disabled": {
            cursor: "default",
        },
    },
    thick: {
        height: "3rem",
    },
    thin: {
        height: "2rem",
    },
    filled: {
        backgroundColor: theme.color.primary,
        color: theme.color.primaryContrastText,
        border: "none",
        "&:hover": {
            backgroundColor: theme.color.primaryDark,
        },
        "&:disabled": {
            backgroundColor: theme.color.disabled,
        },
    },
    outlined: {
        backgroundColor: theme.color.background,
        border: `2px solid ${theme.color.primary}`,
        color: theme.color.primary,
        "&:hover": {
            backgroundColor: theme.color.primaryLight,
            color: theme.color.primaryContrastText,
        },
        "&:disabled": {
            backgroundColor: theme.color.background,
            borderColor: theme.color.disabled,
        },
    }
}), { name: "button" })

const Button = ({
    type = "button", class: className, children,
    variant = "filled", size = "normal",
    ...props
}) => {
    const classes = useStyles({
        variant,
        size,
    })
    return html`<button class="${classes.root} ${classes[variant]} ${classes[size]} ${className}"
                        type=${type} ...${props}>
        ${children}
    </button>`
}

export default Button
