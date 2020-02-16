import { html } from "../../web_modules/htm/preact.js"

import { makeStyles } from "../../lib/theme.js"

const useStyles = makeStyles(theme => ({
    root: {
        padding: ".75rem",
        borderRadius: ".25rem",
        margin: ".5rem 0",
        width: "100%",
        boxSizing: "border-box",
    },
    error: {
        border: `2px solid ${theme.color.errorDark}`,
        backgroundColor: theme.color.error,
    },
}), { name: "alert" })

const Alert = ({ message, severity = "error", hideIfEmpty = true }) => {
    const classes = useStyles()

    if (hideIfEmpty && !message) {
        return null
    }

    return html`
        <div class="${classes.root} ${classes[severity]}">
            ${message}
        </div>
    `
}

export default Alert
