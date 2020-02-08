window.addEventListener("mautrix-cookie-monster-response", async evt => {
    if (browser) {
        await browser.runtime.sendMessage(evt.detail)
    } else {
        await new Promise(resolve => chrome.runtime.sendMessage(evt.detail, resolve))
    }
    console.info("Sent data to Mautrix Cookie Monster", evt.detail)
})

window.dispatchEvent(new CustomEvent("mautrix-cookie-monster-appeared"))
