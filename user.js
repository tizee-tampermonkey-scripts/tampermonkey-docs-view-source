// ==UserScript==
// @name         Documentation Source Viewer
// @namespace    http://github.com/tizee
// @version      1.0.0
// @description  Add "View Source" links to documentation sites with GitHub edit links
// @author       tizee
// @match        https://developers.cloudflare.com/*
// @match        https://packaging.python.org/en/latest/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Configuration for different sites
    const siteConfigs = [
        {
            name: 'Cloudflare',
            selector: 'footer .meta a[href^="https://github.com/cloudflare/cloudflare-docs/edit"]',
            container: 'footer .meta',
            replacements: [
                {
                    from: /https:\/\/github\.com\/cloudflare\/cloudflare-docs\/edit\//,
                    to: 'https://raw.githubusercontent.com/cloudflare/cloudflare-docs/refs/heads/'
                }
            ],
            debug: '[CF DOC]'
        },
        {
            name: 'Python Packaging',
            selector: '.edit-this-page a[href^="https://github.com/pypa/packaging.python.org/edit"]',
            container: '.edit-this-page',
            replacements: [
                {
                    from: /https:\/\/github\.com\/pypa\/packaging.python.org\/edit\//,
                    to: 'https://raw.githubusercontent.com/pypa/packaging.python.org/refs/heads/'
                }
            ],
            debug: '[PY PKG]'
        }
        // Add more site configurations here as needed
    ];

    // Generate a unique ID for the view source link
    function generateViewSourceLinkId(siteName) {
        return `doc-source-viewer-${siteName.toLowerCase().replace(/\s+/g, '-')}`;
    }

    // Generic function to add "View Source" link
    function addViewSourceLink(config) {
        try {
            // Generate unique ID for this site's view source link
            const viewSourceLinkId = generateViewSourceLinkId(config.name);

            // Check if the link already exists
            if (document.getElementById(viewSourceLinkId)) {
                console.debug(`${config.debug} View source link already exists`);
                return true;
            }

            // Find the edit link
            const editLink = document.querySelector(config.selector);
            if (!editLink) {
                console.debug(`${config.debug} Edit link not found for ${config.name}`);
                return false;
            }

            // Find the container
            const container = document.querySelector(config.container);
            if (!container) {
                console.debug(`${config.debug} Container not found for ${config.name}`);
                return false;
            }

            // Clone the edit link
            const viewSourceLink = editLink.cloneNode(true);

            // Apply all replacements to create the source URL
            let newHref = editLink.href;
            for (const replacement of config.replacements) {
                newHref = newHref.replace(replacement.from, replacement.to);
            }

            // Update the link properties
            viewSourceLink.href = newHref;
            viewSourceLink.textContent = "View Source";
            viewSourceLink.title = "View the source document";
            viewSourceLink.id = viewSourceLinkId; // Add the unique ID

            // Add the new link to the container
            container.prepend(viewSourceLink);

            // Log the new link URL for debugging
            console.debug(`${config.debug} Added view source link: ${newHref}`);
            return true;
        } catch (error) {
            console.error(`${config.debug} Error adding view source link:`, error);
            return false;
        }
    }

    // Try each site configuration
    function init() {
        let applied = false;

        for (const config of siteConfigs) {
            if (addViewSourceLink(config)) {
                applied = true;
                break; // Stop after the first successful application
            }
        }

        if (!applied) {
            console.debug('[DOC SRC] No matching configuration found for this page');
        }
    }

    // Initialize after page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Optional: Set up a mutation observer to handle dynamic content loading
    // This is useful for single-page applications where the content might change without a full page reload
    const observeConfig = {
        childList: true,
        subtree: true
    };

    const observer = new MutationObserver(function(mutations) {
        // Check if our target elements exist now
        const shouldReinit = mutations.some(mutation => {
            return Array.from(mutation.addedNodes).some(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Check if any of our containers were added
                    return siteConfigs.some(config =>
                        node.querySelector(config.container) ||
                        node.matches(config.container)
                    );
                }
                return false;
            });
        });

        if (shouldReinit) {
            console.debug('[DOC SRC] Content changed, re-initializing');
            init();
        }
    });

    // Start observing after a short delay to ensure the page has loaded
    setTimeout(() => {
        observer.observe(document.body, observeConfig);
    }, 1000);
})();
