/**
 * @typedef {Object} CopyOptions
 * @property {'plaintext' | 'markdown'} format - The format in which to copy the URL(s).
*/

chrome.commands.onCommand.addListener(async cmd => {
    if (cmd === 'copy-tab-url') {
        await copyUrl({ format: 'plaintext' })
    } else if (cmd === 'copy-tab-url-md') {
        await copyUrl({ format: 'markdown' })
    }
})

/** A global promise to avoid concurrency issues */
let creating;
/**
 * @param {string} path Path to the offscreen document
 * @returns 
 */
async function setupOffscreenDocument(path) {
    // Check all windows controlled by the service worker to see if one
    // of them is the offscreen document with the given path
    const offscreenUrl = chrome.runtime.getURL(path)
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [offscreenUrl]
    })
    if (existingContexts.length > 0) {
        console.warn('offscreen document already exists')
        return;
    }

    // Create the offscreen document
    if (creating) {
        await creating
    } else {
        creating = chrome.offscreen.createDocument({
            url: path,
            reasons: [chrome.offscreen.Reason.CLIPBOARD],
            justification: 'write url text to the clipboard',
        });
        await creating
        creating = null
    }
}

/**
 * Copies the URLs of all highlighted tabs in the current window to the clipboard,
 * formatted according to the specified options.
 * @param {Object} options - Options for formatting the URLs.
 * @param {string} options.format - The format to use when formatting each URL.
 */
async function copyUrl(options) {
    const tabs = await chrome.tabs.query({ highlighted: true, currentWindow: true })
    if (!tabs || tabs.length === 0) { return }
    const urls = tabs.map(tab => formatUrl(tab, options.format)).join('\n')

    await setupOffscreenDocument('offscreen.html')

    const response = await chrome.runtime.sendMessage({ action: 'copy', target: 'offscreen-doc', text: urls })
    if (response.success) {
        chrome.notifications.create({
            type: 'basic',
            title: 'Copy Tab URL',
            message: `Copied ${tabs.length} URL(s) to clipboard`,
            iconUrl: 'assets/icon48.png'
        })
    } else {
        console.error("Clipboard copy failed", response.error)
        chrome.notifications.create({
            type: 'basic',
            title: 'Copy Tab URL',
            message: "Failed to copy tab URLs",
            iconUrl: 'assets/icon48.png'
        })
    }
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

// Note: Once extension service workers can use the Clipboard API,
// Note: replace the offscreen document based implementation with something like this.
// navigator.clipboard.writeText(value)
