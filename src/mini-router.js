// mini-router.js
const miniRouter = (() => {
    const routes = [];
    let currentPath = '';
    const parser = document.createElement('a'); // Helper to parse URLs

    // Function to convert path strings with params (e.g., /vn/:slug) to regex
    const pathToRegex = (path) => {
        // Escape special regex characters, replace :param with a capture group
        const regexString = '^' + path.replace(/\//g, '\\/').replace(/:\w+/g, '([^\\/]+)') + '$';
        return new RegExp(regexString, 'i'); // Case-insensitive matching
    };

    // Add a route definition
    const route = (path, handler) => {
        routes.push({ path: pathToRegex(path), handler });
    };

    // Find the matching route and execute its handler
    const dispatch = (path) => {
        console.log(`Dispatching: ${path}`);
        currentPath = path || '/'; // Default to root if path is empty/falsy

        for (const r of routes) {
            const match = currentPath.match(r.path);
            if (match) {
                // Extract params (captured groups)
                const params = {};
                const paramNames = (r.path.toString().match(/:\w+/g) || []).map(name => name.substring(1));
                paramNames.forEach((name, index) => {
                    params[name] = match[index + 1]; // match[0] is the full string
                });

                console.log(`Route matched: ${r.path}, Params:`, params);
                // Execute handler with context (path, params)
                r.handler({ path: currentPath, params });
                return; // Stop after first match
            }
        }
        console.warn(`No route found for path: ${currentPath}`);
        // Optional: Handle 404 - redirect to home or show a message
        // navigate('/'); // Example: redirect to home if no match
    };

    // Navigate to a new path, update history, and dispatch
    const navigate = (path, push = true) => {
        parser.href = path; // Use the 'a' element to easily get the pathname

        // Only handle internal links
        if (parser.origin !== window.location.origin) {
            window.location.href = path; // External link, let the browser handle it
            return;
        }

        const targetPath = parser.pathname + parser.search + parser.hash;

        if (targetPath !== currentPath) {
            if (push) {
                window.history.pushState({ path: targetPath }, '', targetPath);
            } else {
                window.history.replaceState({ path: targetPath }, '', targetPath);
            }
            dispatch(targetPath);
        }
    };

    // Listen for popstate (back/forward buttons)
    const handlePopState = (event) => {
        const path = event.state?.path || window.location.pathname;
        console.log(`Popstate event, path: ${path}`);
        dispatch(path);
    };

    // Global click handler to intercept link clicks
    const handleLinkClick = (event) => {
        let target = event.target;
        // Find the anchor tag, traversing up if the click was on a child element
        while (target && target.tagName !== 'A') {
            target = target.parentNode;
        }

        // Check if it's a valid anchor tag we should handle
        if (
            target &&
            target.tagName === 'A' &&
            target.href && // Has an href
            !target.target && // Doesn't open in a new tab (_blank)
            !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && // No modifier keys
            target.origin === window.location.origin // Is an internal link
            // Optional: Add checks for download attribute or specific classes/protocols to ignore
        ) {
            event.preventDefault(); // Prevent default browser navigation
            const href = target.getAttribute('href'); // Use getAttribute to get the raw value
            navigate(href);
        }
    };

    // Initialize the router
    const start = () => {
        window.addEventListener('popstate', handlePopState);
        document.addEventListener('click', handleLinkClick);
        // Initial dispatch based on the current URL when the page loads
        dispatch(window.location.pathname);
    };

    return {
        route,
        navigate,
        start,
        // Expose dispatch if needed externally, though usually not required
        // dispatch
    };
})();

// Export or make it globally available if not using modules
// window.miniRouter = miniRouter;
