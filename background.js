const highlightsManager = {
    addHighlight: (highlight, source) => {
        chrome.storage.local.get({ highlights: [] }, (data) => {
            const highlights = data.highlights
            highlights.push({
                id: Date.now().toString(),
                highlight: highlight,
                source: source
            })
            chrome.storage.local.set({ highlights: highlights })
        })
        chrome.runtime.sendMessage({ action: 'highlightsUpdated' })
    },
    deleteAllHighlights: () => {
        chrome.storage.local.set({ highlights: [] })
        chrome.runtime.sendMessage({ action: 'highlightsUpdated' })
    },
    deleteHighlightById: (id) => {
        chrome.storage.local.get({ highlights: [] }, (data) => {
            const highlights = data.highlights
            const index = highlights.findIndex(highlight => highlight.id === id)

            if (index !== -1) {
                highlights.splice(index, 1)

                chrome.storage.local.set({ highlights: highlights })
            }
        })
        chrome.runtime.sendMessage({ action: 'highlightsUpdated' })
    }
}

chrome.runtime.onInstalled.addListener(() => {
    const pageContext = {
        id: 'highlight-it',
        title: 'Highlight it',
        contexts: ['selection']
    }
    chrome.contextMenus.create(pageContext)
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'highlight-it') {
        highlightsManager.addHighlight(info.selectionText, info.pageUrl)
    }
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(request)
    if (request.action === 'deleteAllHighlights') {
        highlightsManager.deleteAllHighlights()
        sendResponse({ message: 'Notas eliminadas con éxito.' })
    } else if (request.action === 'deleteHighlight') {
        highlightsManager.deleteHighlightById(request.id)
        sendResponse({ message: 'Nota eliminada con éxito.' })
    }
})