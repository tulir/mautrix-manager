import { render } from "/web_modules/preact.js"
import { html } from "/web_modules/htm/preact.js"

import { ThemeProvider } from "./lib/theme.js"
import Main from "./views/Main.js"

render(html`
    <${ThemeProvider}>
        <${Main}/>
    </ThemeProvider>
`, document.body)
