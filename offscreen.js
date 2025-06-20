// We use a <textarea> element for two main reasons:
//  1. preserve the formatting of multiline text,
//  2. select the node's content using this element's `.select()` method.
const textarea = document.getElementById('text');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Return early if this message isn't meant for the offscreen document.
    if (message.target !== 'offscreen-doc') {
        return;
    }

    // Dispatch message to the appropriate handler
    if (message.action === "copy") {
        handleClipboardWrite(message.text, sendResponse)
    } else {
        const err = `Unexpected message action received: ${message.action}`
        sendResponse({ success: false, error: err })
    }
});


// Use the offscreen document's `document` interface to write a new value to the
// system clipboard.
//
// The `navigator.clipboard` API requires that the window be focused, but offscreen documents cannot be
// focused. As such, we have to fall back to `document.execCommand()`.
//
// @see https://github.com/GoogleChrome/chrome-extensions-samples/blob/main/functional-samples/cookbook.offscreen-clipboard-write/offscreen.js
async function handleClipboardWrite(data, sendResponse) {
    try {
        // Error if we received the wrong kind of data.
        if (typeof data !== 'string') {
            return sendResponse({ success: false, error: `Value provided must be a 'string', git '${typeof data}' ` })
        }

        // `document.execCommand('copy')` works against the user's selection in a web
        // page. As such, we must insert the string we want to copy to the web page
        // and to select that content in the page before calling `execCommand()`.
        textarea.value = data
        textarea.select()
        document.execCommand('copy')
        sendResponse({ success: true })
    } catch (e) {
        sendResponse({ success: false, error: e.toString() })
    } finally {
        // Close the offscreen document when we are finally done
        window.close()
    }
}
