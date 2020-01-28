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

export const getMe = async () => {
    let resp
    try {
        resp = await fetch("/api/mautrix-telegram/user/me", {
            headers: {
                Authorization: `Bearer ${localStorage.accessToken}`,
            },
        })
    } catch (err) {
        console.error("Telegram bridge info request failed:", err)
        throw new Error("Failed to contact Telegram bridge")
    }
    let data
    try {
        data = await resp.json()
    } catch (err) {
        console.error("Telegram /me request JSON parse failed:", err)
        throw new Error("Invalid response from Telegram bridge")
    }
    if (resp.status >= 300) {
        console.error("Unexpected Telegram /me request status:", resp.status, data)
        throw new Error(data.error || "Invalid response from Telegram bridge")
    }
    return data
}

export const logout = async () => {
    let resp
    try {
        resp = await fetch("/api/mautrix-telegram/user/me/logout", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.accessToken}`,
            },
        })
    } catch (err) {
        console.error("Telegram bridge logout request failed:", err)
        throw new Error("Failed to contact Telegram bridge")
    }
    if (resp.status >= 300) {
        const data = await resp.json()
        throw new Error(data.error || "Failed to log out")
    }
}

export const login = async (endpoint, payload) => {
    let resp
    try {
        resp = await fetch(`/api/mautrix-telegram/user/me/login/${endpoint}`, {
            body: JSON.stringify(payload),
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.accessToken}`,
                "Content-Type": "application/json",
            },
        })
    } catch (err) {
        console.error("Telegram bridge logout request failed:", err)
        throw new Error("Failed to contact Telegram bridge")
    }
    let data
    try {
        data = await resp.json()
    } catch (err) {
        console.error("Telegram login request JSON parse failed:", err)
        throw new Error("Invalid response from Telegram bridge")
    }
    if (resp.status >= 300) {
        console.error("Unexpected Telegram login request status:", resp.status, data)
        throw new Error(data.error || "Invalid response from Telegram bridge")
    }
    return data
}
