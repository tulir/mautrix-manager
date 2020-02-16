// From https://github.com/molefrog/wouter#customizing-the-location-hook
import { useState, useEffect, useCallback } from "../web_modules/preact/hooks.js"

const currentLocation = () => window.location.hash.replace(/^#/, "") || "/"

const useHashLocation = () => {
    const [location, setLocation] = useState(currentLocation())

    useEffect(() => {
        const handler = () => setLocation(currentLocation())

        window.addEventListener("hashchange", handler)
        return () => window.removeEventListener("hashchange", handler)
    }, [])

    const navigate = useCallback(to => {
        console.log("Navigating to", to)
        window.location.hash = to
    }, [])

    return [location, navigate]
}

export default useHashLocation
