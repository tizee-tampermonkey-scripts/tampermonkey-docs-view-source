# Documentation Source Viewer

A Tampermonkey userscript that adds "View Source" links to documentation sites with GitHub edit links.

## Features

- Automatically adds a "View Source" link next to "Edit this page" links on supported documentation sites
- Works with multiple documentation platforms through a configurable system
- Handles dynamically loaded content using a mutation observer
- Prevents duplicate links from being added
- Easy to extend for additional documentation sites

## Currently Supported Sites

- Cloudflare Documentation (`developers.cloudflare.com`)
- Python Packaging Documentation (`packaging.python.org`)
- Python UV tool Documentation (`https://docs.astral.sh/uv/`)
- Python PEP Documentation (`https://peps.python.org/`)

## How It Works

The script looks for GitHub edit links on documentation pages and creates a corresponding "View Source" link that points to the raw source file in the GitHub repository. This allows you to view the original markup file (Markdown, reStructuredText, etc.) that was used to generate the documentation page.

## Installation

1. Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Click on the Tampermonkey icon and select "Create a new script..."
3. Copy and paste the entire script into the editor
4. Save the script (Ctrl+S or File > Save)

## Adding Support for New Sites

### For Sites with Edit Links

To add support for a new documentation site, add a new configuration object to the `siteConfigs` array with the following properties:

```javascript
{
    name: 'Site Name',                     // Name of the documentation site
    selector: 'CSS selector for edit link', // CSS selector to find the GitHub edit link
    container: 'CSS selector for container', // CSS selector for where to add the View Source link
    replacements: [                         // URL transformation rules
        {
            from: /pattern-to-replace/,     // Regular expression to match in the edit URL
            to: 'replacement-pattern'        // String to replace it with
        }
    ],
    debug: '[SITE CODE]'                    // Debug prefix for console messages
}
```

### For Sites without Edit Links but with Known Repository Structure

```javascript
{
    name: 'Site Name',                      // Name of the documentation site
    type: 'custom-pattern',                 // Type of configuration
    container: 'selector1, selector2',      // CSS selectors for where to add the View Source link
    urlPattern: {
        pageUrlRegex: /https:\/\/example\.com\/docs\/(.+)/, // Regex to extract documentation path
        repoUrl: 'https://github.com/org/repo/raw/refs/heads/main/docs/$1.md', // URL pattern using captured group
        transformations: [                  // Optional transformations to apply to the path
            { from: /\/index$/, to: '' }    // Example: remove /index from paths
        ]
    },
    debug: '[SITE CODE]'                    // Debug prefix for console messages
}

## Contributing

Feel free to add support for additional documentation sites by forking this repository and submitting a pull request with your changes.

## License

This script is provided under the MIT License.
