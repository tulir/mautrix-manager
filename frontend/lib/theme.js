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
import { h } from "/web_modules/preact.js"
import {
    createUseStyles, useTheme, ThemeProvider as JSSThemeProvider,
} from "/web_modules/react-jss.js"

const theme = {
    color: {
        primary: "#00C853",
        primaryDark: "#009624",
        text: "#212121",
        border: "#DDD",
        disabled: "#CCC",
        error: "#F7A9A1",
        errorDark: "#B71C1C",
    },
}

export const makeStyles = style => {
    const useStyles = createUseStyles(style)
    return (...props) => {
        const theme = useTheme()
        return useStyles({ ...props, theme })
    }
}

export const ThemeProvider = ({ children }) => h(JSSThemeProvider, { theme }, children)
