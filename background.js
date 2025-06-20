chrome.commands.onCommand.addListener(cmd => {
    if (cmd === 'copy-tab-url') {
        copyUrl()
    }
})

function copyUrl() {
    chrome.tabs.query({ highlighted: true, currentWindow: true }, tabs => {
        const urls = tabs.map(tab => tab.url).join('\n')
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (text) => navigator.clipboard.writeText(text),
            args: [urls]
        })
    })
}

