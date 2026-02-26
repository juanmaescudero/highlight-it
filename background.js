const highlightsManager = {
    addHighlight: (highlight, source, categoryId) => {
        chrome.storage.local.get({ highlights: [] }, (data) => {
            const highlights = data.highlights
            highlights.push({
                id: Date.now().toString(),
                highlight: highlight,
                source: source,
                categoryId: categoryId || null
            })
            chrome.storage.local.set({ highlights: highlights }, () => {
                chrome.runtime.sendMessage({ action: 'highlightsUpdated' })
            })
        })
    },
    deleteAllHighlights: () => {
        chrome.storage.local.set({ highlights: [] }, () => {
            chrome.runtime.sendMessage({ action: 'highlightsUpdated' })
        })
    },
    deleteHighlightById: (id) => {
        chrome.storage.local.get({ highlights: [] }, (data) => {
            const highlights = data.highlights
            const index = highlights.findIndex(highlight => highlight.id === id)
            if (index !== -1) {
                highlights.splice(index, 1)
                chrome.storage.local.set({ highlights: highlights }, () => {
                    chrome.runtime.sendMessage({ action: 'highlightsUpdated' })
                })
            }
        })
    },
    updateHighlightCategory: (id, categoryId) => {
        chrome.storage.local.get({ highlights: [] }, (data) => {
            const highlights = data.highlights
            const highlight = highlights.find(h => h.id === id)
            if (highlight) {
                highlight.categoryId = categoryId
                chrome.storage.local.set({ highlights: highlights }, () => {
                    chrome.runtime.sendMessage({ action: 'highlightsUpdated' })
                })
            }
        })
    }
}

function rebuildContextMenus() {
    chrome.contextMenus.removeAll(() => {
        chrome.storage.local.get({ categories: [] }, (data) => {
            const categories = data.categories

            chrome.contextMenus.create({
                id: 'highlight-it',
                title: 'Highlight it',
                contexts: ['selection']
            })

            if (categories.length > 0) {
                chrome.contextMenus.create({
                    id: 'highlight-no-category',
                    parentId: 'highlight-it',
                    title: 'No category',
                    contexts: ['selection']
                })
                categories.forEach((cat) => {
                    chrome.contextMenus.create({
                        id: `highlight-cat-${cat.id}`,
                        parentId: 'highlight-it',
                        title: cat.name,
                        contexts: ['selection']
                    })
                })
            }
        })
    })
}

chrome.runtime.onInstalled.addListener(() => {
    rebuildContextMenus()
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'highlight-it') {
        highlightsManager.addHighlight(info.selectionText, info.pageUrl, null)
    } else if (info.menuItemId === 'highlight-no-category') {
        highlightsManager.addHighlight(info.selectionText, info.pageUrl, null)
    } else if (info.menuItemId.startsWith('highlight-cat-')) {
        const categoryId = info.menuItemId.replace('highlight-cat-', '')
        highlightsManager.addHighlight(info.selectionText, info.pageUrl, categoryId)
    }
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'deleteAllHighlights') {
        highlightsManager.deleteAllHighlights()
        sendResponse({ message: 'All highlights deleted.' })
    } else if (request.action === 'deleteHighlight') {
        highlightsManager.deleteHighlightById(request.id)
        sendResponse({ message: 'Highlight deleted.' })
    } else if (request.action === 'updateHighlightCategory') {
        highlightsManager.updateHighlightCategory(request.id, request.categoryId)
        sendResponse({ message: 'Category updated.' })
    } else if (request.action === 'rebuildContextMenus') {
        rebuildContextMenus()
        sendResponse({ message: 'Menus rebuilt.' })
    }
})