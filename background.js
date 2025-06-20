chrome.commands.onCommand.addListener(cmd => {
    if (cmd === 'copy-tab-url') {
        copyUrl({ format: 'plaintext' })
    } else if (cmd === 'copy-tab-url-md') {
        copyUrl({ format: 'markdown' })
    }
})

/**
 * @typedef {Object} CopyOptions
 * @property {'plaintext' | 'markdown'} format - The format in which to copy the URL(s).
*/

/**
 * Copies the URLs of all highlighted tabs in the current window to the clipboard,
 * formatted according to the specified options.
 * @param {Object} options - Options for formatting the URLs.
 * @param {string} options.format - The format to use when formatting each URL.
 */
function copyUrl(options) {
    chrome.tabs.query({ highlighted: true, currentWindow: true }, tabs => {
        const urls = tabs.map(tab => formatUrl(tab, options.format)).join('\n')
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (text) => navigator.clipboard.writeText(text),
            args: [urls]
        })
    })
}

/**
 * Formats the given tab's URL and title according to the specified format.
 * @param {Object} tab - The tab object containing information about the browser tab.
 * @param {string} tab.title - The title of the tab.
 * @param {string} tab.url - The URL of the tab.
 * @param {string} format - The format to use ('markdown' or 'plaintext').
 * @returns {string} The formatted URL string.
 */
function formatUrl(tab, format) {
    switch (format) {
        case 'markdown':
            return `[${tab.title}](${tab.url})`
        case 'plaintext':
        default:
            return tab.url
    }
}

