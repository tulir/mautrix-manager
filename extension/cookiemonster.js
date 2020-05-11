// mautrix-cookiemonster - A browser extension to eat cookies to log into bridges.
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
"use strict"

const init = document.getElementById("init")
const tokenReceived = document.getElementById("token-received")
const cookieNotFound = document.getElementById("cookie-not-found")
const cookieEaten = document.getElementById("cookie-eaten")
const loggedIn = document.getElementById("logged-in")
const loginError = document.getElementById("login-error")

const bridgeType = {
	"net.maunium.facebook": {
		url: "https://messenger.com",
		name: "Facebook Messenger",
		urlPrefix: "https://www.messenger.com/",
		cookies: ["xs", "c_user"],
	},
	"net.maunium.hangouts": {
		// https://github.com/tdryer/hangups/blob/v0.4.10/hangups/auth.py#L31-L46
		url: "https://accounts.google.com/o/oauth2/programmatic_auth?scope=https%3A%2F%2Fwww.google.com%2Faccounts%2FOAuthLogin+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email&client_id=936475272427.apps.googleusercontent.com&device_name=Mautrix-Hangouts+Bridge",
		name: "Hangouts",
		urlPrefix: "https://accounts.google.com/o/oauth2/programmatic_auth",
		cookies: ["oauth_code"],
	},
}

let apiDetails = null

const createCookieRow = (name, value) => {
	const cookieRow = document.createElement("tr")
	const nameColumn = document.createElement("td")
	const nameColumnCode = document.createElement("code")
	nameColumnCode.innerText = name
	nameColumn.appendChild(nameColumnCode)
	const valueColumn = document.createElement("td")
	const valueColumnCode = document.createElement("input")
	valueColumnCode.name = name
	valueColumnCode.value = value
	valueColumn.appendChild(valueColumnCode)
	cookieRow.appendChild(nameColumn)
	cookieRow.appendChild(valueColumn)
	return cookieRow
}

const eatCookies = async (tab, names) => {
	const cookies = await browser.cookies.getAll({
		storeId: tab.cookieStoreId,
		url: tab.url,
	})
	const cookieTable = document.getElementById("cookie-eaten-cookies")
	cookieTable.innerHTML = ""
	for (const name of names) {
		const cookie = cookies.find(cookie => cookie.name === name)
		if (!cookie) {
			return false
		}
		cookieTable.appendChild(createCookieRow(name, cookie.value))
	}
	return true
}

const main = async () => {
	const tabs = await browser.tabs.query({
		active: true,
		windowId: browser.windows.WINDOW_ID_CURRENT,
	})
	const tab = tabs[0]
	if (window.localStorage.token) {
		const token = window.localStorage.token
		apiDetails = {token, ...JSON.parse(atob(token.split(":")[1]))}
	}
	const urlPrefix = apiDetails ? bridgeType[apiDetails.bridge_type].urlPrefix : null
	if (!urlPrefix || !tab.url.startsWith(urlPrefix)) {
		await browser.tabs.executeScript({file: "token.js"})
		return
	}
	const ok = await eatCookies(tab, bridgeType[apiDetails.bridge_type].cookies)
	init.style.display = "none"
	cookieNotFound.style.display = ok ? "none" : "block"
	cookieEaten.style.display = ok ? "block" : "none"
	if (ok) {
		document.getElementById("cookie-eaten-homeserver").innerText = apiDetails.homeserver
		document.getElementById("cookie-eaten-bridge-type").innerText = bridgeType[apiDetails.bridge_type].name
	}
}

const submitCookies = evt => {
	evt.preventDefault()
	const cookieTable = document.getElementById("cookie-eaten-cookies")
	const cookies = {}
	for (const field of cookieTable.getElementsByTagName("input")) {
		cookies[field.name] = field.value
	}
	fetch(apiDetails.login_api, {
		method: "POST",
		headers: {
			"Authorization": `Bearer ${apiDetails.token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(cookies),
	}).then(resp => {
		if (resp.status === 200) {
			loggedIn.style.display = "block"
		} else {
			loginError.style.display = "block"
		}
	}).catch(err => {
		loginError.style.display = "block"
	}).finally(() => {
		cookieEaten.style.display = "none"
	})
}

const navigateLogin = async () => {
	await browser.tabs.create({
		active: true,
		url: bridgeType[apiDetails.bridge_type].url,
	})
	window.close()
}

browser.runtime.onMessage.addListener(async ({ loggedIn, token, url }) => {
	if (!token) {
		return
	}
	await storage.local.set({ token, url, mxid })
	document.getElementById("token-received-user").innerText = apiDetails.mxid
	document.getElementById("token-received-homeserver").innerText = apiDetails.homeserver
	document.getElementById("token-received-bridge-type").innerText = bridgeType[apiDetails.bridge_type].name
	init.style.display = "none"
	tokenReceived.style.display = "block"
})

document.getElementById("token-received-nav").addEventListener("click", navigateLogin)
document.getElementById("cookie-eaten-form").addEventListener("submit", submitCookies)

main().catch(console.error)
