// ==UserScript==
// @name         Documentation Source Viewer
// @namespace    http://github.com/tizee
// @version      1.1.1
// @description  Add "View Source" links to documentation sites with or without GitHub edit links
// @author       tizee
// @match        https://developers.cloudflare.com/*
// @match        https://packaging.python.org/en/latest/*
// @match        https://docs.astral.sh/uv/*
// @match        https://peps.python.org/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Configuration for different sites
    const siteConfigs = [
        // Sites with edit links
        {
            name: 'Cloudflare',
            type: 'edit-link',
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
            type: 'edit-link',
            selector: '.edit-this-page a[href^="https://github.com/pypa/packaging.python.org/edit"]',
            container: '.edit-this-page',
            replacements: [
                {
                    from: /https:\/\/github\.com\/pypa\/packaging.python.org\/edit\//,
                    to: 'https://raw.githubusercontent.com/pypa/packaging.python.org/refs/heads/'
                }
            ],
            debug: '[PY PKG]'
        },
        // Sites without edit links but with known repository structure
        {
            name: 'Astral UV',
            type: 'custom-pattern',
            container: '.md-header__inner.md-grid',
            urlPattern: {
                pageUrlRegex: /https:\/\/docs\.astral\.sh\/uv\/(.+)/,
                repoUrl: 'https://github.com/astral-sh/uv/raw/refs/heads/main/docs/$1.md',
                // Transformations to apply to the captured path
                transformations: [
                    { from: /\/index$/, to: '' },  // Remove /index from URL paths
                    { from: /\/$/, to: '' }        // Remove trailing slash
                ]
            },
            debug: '[ASTRAL UV]'
        },
        {
            name: 'Python PEP',
            type: 'edit-link',
            selector: 'article p a.reference.external[href^="https://github.com/python/peps/blob/"]',
            container: 'article',
            replacements: [
                {
                    from: /https:\/\/github\.com\/python\/peps\/blob\//,
                    to: 'https://raw.githubusercontent.com/python/peps/refs/heads/'
          // https://raw.githubusercontent.com/python/peps/refs/heads/main/peps/pep-0723.rst
                }
            ],
            debug: '[PY PEP]'
        },
        // Add more site configurations here as needed
    ];

    // Generate a unique ID for the view source link
    function generateViewSourceLinkId(siteName) {
        return `doc-source-viewer-${siteName.toLowerCase().replace(/\s+/g, '-')}`;
    }

    // Function to add "View Source" link for sites with edit links
    function addViewSourceLinkFromEditLink(config) {
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

    // Function to add "View Source" link for sites with custom patterns
    function addViewSourceLinkFromCustomPattern(config) {
        try {
            // Generate unique ID for this site's view source link
            const viewSourceLinkId = generateViewSourceLinkId(config.name);

            // Check if the link already exists
            if (document.getElementById(viewSourceLinkId)) {
                console.debug(`${config.debug} View source link already exists`);
                return true;
            }

            // Get the current page URL without hash and search parameters
            let pageUrl = window.location.origin + window.location.pathname;

            // Check if the current URL matches the pattern
            const match = pageUrl.match(config.urlPattern.pageUrlRegex);
            if (!match) {
                console.debug(`${config.debug} URL pattern doesn't match: ${pageUrl}`);
                return false;
            }

            // Extract the path from the match
            let path = match[1];

            // Apply any transformations to the path
            if (config.urlPattern.transformations) {
                for (const transformation of config.urlPattern.transformations) {
                    path = path.replace(transformation.from, transformation.to);
                }
            }

            // Generate the source URL - replace $1 with the processed path
            const sourceUrl = config.urlPattern.repoUrl.replace('$1', path);

            // Find a container to add the link to
            // Try multiple potential containers (comma-separated in the config)
            const containerSelectors = config.container.split(',').map(s => s.trim());

            let container = null;
            for (const selector of containerSelectors) {
                const found = document.querySelector(selector);
                if (found) {
                    container = found;
                    break;
                }
            }

            if (!container) {
                console.debug(`${config.debug} No container found for view source link`);
                return false;
            }

            // Create the view source link
            const viewSourceLink = document.createElement('a');
            viewSourceLink.href = sourceUrl;
            viewSourceLink.textContent = "View Source";
            viewSourceLink.title = "View the source document";
            viewSourceLink.id = viewSourceLinkId;
            viewSourceLink.className = "doc-source-viewer-link";
            viewSourceLink.style.cssText = "margin-right: 10px; font-size: 0.9em; text-decoration: none;";

            // Create a container div if needed
            const linkContainer = document.createElement('div');
            linkContainer.className = "doc-source-viewer-container";
            linkContainer.style.cssText = "margin: 10px 0; padding: 5px; display: flex; align-items: center;";
            linkContainer.appendChild(viewSourceLink);

            // Add the link container at the beginning of the container
            if (container.firstChild) {
                container.insertBefore(linkContainer, container.firstChild);
            } else {
                container.appendChild(linkContainer);
            }

            // Log the new link URL for debugging
            console.debug(`${config.debug} Added custom view source link: ${sourceUrl}`);
            return true;
        } catch (error) {
            console.error(`${config.debug} Error adding custom view source link:`, error);
            return false;
        }
    }

    // Try each site configuration
    function init() {
        let applied = false;

        for (const config of siteConfigs) {
            let success = false;

            if (config.type === 'edit-link') {
                success = addViewSourceLinkFromEditLink(config);
            } else if (config.type === 'custom-pattern') {
                success = addViewSourceLinkFromCustomPattern(config);
            }

            if (success) {
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

    // Set up a mutation observer to handle dynamic content loading
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
                    return siteConfigs.some(config => {
                        if (config.container) {
                            const containerSelectors = config.container.split(',').map(s => s.trim());
                            return containerSelectors.some(selector =>
                                node.querySelector(selector) || node.matches(selector)
                            );
                        }
                        return false;
                    });
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
