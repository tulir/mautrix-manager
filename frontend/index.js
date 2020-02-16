import { render } from "./web_modules/preact.js"
import { html } from "./web_modules/htm/preact.js"
import { Router } from "./web_modules/wouter-preact.js"

import useHashLocation from "./lib/useHashLocation.js"
import { ThemeProvider } from "./lib/theme.js"
import { DialogProvider } from "./views/Dialog.js"
import Main from "./views/Main.js"

render(html`
    <${ThemeProvider}>
        <${Router} hook=${useHashLocation}>
            <${DialogProvider}>
                <${Main}/>
            </DialogProvider>
        </Router>
    </ThemeProvider>
`, document.body)
