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
import { h } from "../web_modules/preact.js"
import {
    createUseStyles, useTheme, ThemeProvider as JSSThemeProvider,
} from "../web_modules/react-jss.js"

const color = {
    // Material UI green 800
    primary: "#2e7d32",
    primaryDark: "#005005",
    primaryLight: "#60ad5e",
    // Material UI blue 700
    secondary: "#1976d2",
    secondaryDark: "#004ba0",
    secondaryLight: "#63a4ff",

    error: "#F7A9A1",
    errorDark: "#B71C1C",

    primaryContrastText: "white",
    background: "white",
    text: "#212121",
    border: "#DDD",
    disabled: "#CCC",
}

const theme = {
    color,
    input: () => ({
        fontSize: "1rem",
        margin: ".5rem 0",
        borderRadius: ".25rem",
        border: `1px solid ${theme.color.border}`,
        padding: "calc(.75rem + 1px) 1rem",
        boxSizing: "border-box",
        "&:hover, &:focus": {
            borderColor: theme.color.primary,
        },
        "&:focus": {
            padding: ".75rem calc(1rem - 1px)",
            borderWidth: "2px",
            // We show focus with the border width.
            outline: "none",
        },
    }),
}

export const makeStyles = (style, options) => {
    const useStyles = createUseStyles(style, options)
    return (...props) => {
        const theme = useTheme()
        return useStyles({
            ...props,
            theme,
        })
    }
}

export const ThemeProvider = ({ children }) => h(JSSThemeProvider, { theme }, children)
