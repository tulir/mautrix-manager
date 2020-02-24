// From https://github.com/molefrog/wouter#customizing-the-location-hook
import { createRef } from "../web_modules/preact.js"
import { useState, useEffect, useCallback } from "../web_modules/preact/hooks.js"

import track from "./api/tracking.js"

const parseQuery = str => Object.fromEntries(
    str.split("&")
        .map(part => part.split("="))
        .map(([key, value = ""]) => [key, value]))

const setQuery = query => {
    const [start] = window.location.hash.split("?", 1)
    const str = new URLSearchParams(query).toString()
    if (str.length > 0) {
        window.location.hash = `start?${str}`
    } else {
        window.location.hash = start
    }
}

const query = createRef()
query.current = {}

export const useQuery = () => [query.current, setQuery]

const currentLocation = () => {
    const newLocation = window.location.hash.replace(/^#/, "") || "/"
    const queryIndex = newLocation.indexOf("?")
    if (queryIndex !== -1) {
        query.current = parseQuery(newLocation.substr(queryIndex + 1))
        return newLocation.substr(0, queryIndex)
    } else {
        return newLocation
    }
}

const useHashLocation = () => {
    const [location, setLocation] = useState(currentLocation())

    useEffect(() => {
        const handler = () => setLocation(currentLocation())

        window.addEventListener("hashchange", handler)
        return () => window.removeEventListener("hashchange", handler)
    }, [])

    const navigate = useCallback(to => {
        console.log("Navigating to", to)
        track("Manager page change", {
            prevLocation: window.location.hash,
            newLocation: to,
        })
        window.location.hash = to
    }, [])

    return [location, navigate]
}

export default useHashLocation
