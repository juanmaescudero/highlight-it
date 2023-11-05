document.addEventListener('DOMContentLoaded', () => {
    function updateHighlightLists() {
        chrome.storage.local.get({ highlights: [] }, (data) => {
            const highlights = data.highlights
            const highlightLists = document.querySelector('.highlights-list')
            highlightLists.innerHTML = ''
            console.log(highlightLists)
            if (highlights.length) {
                highlights.forEach((highlight) => {
                    const el = document.createElement('li')
                    el.className = 'highlight'
    
                    const p = document.createElement('p')
                    p.textContent = highlight.highlight
                    p.onclick = () => window.open(highlight.source, '_blank')
                    el.appendChild(p)
    
                    const src = document.createElement('p')
                    src.className = 'source'
                    src.textContent = highlight.source
                    src.onclick = () => window.open(highlight.source, '_blank')
                    el.appendChild(src)
    
                    const img = document.createElement('img')
                    img.src = "/assets/icon-delete.png"
                    img.onclick = () => chrome.runtime.sendMessage({ action: 'deleteHighlight', id: highlight.id })
                    el.appendChild(img)
    
                    highlightLists.appendChild(el)
                })
            } else {
                const el = document.createElement('li')
                el.className = 'info'

                const p = document.createElement('p')
                p.textContent = "Highlight any text on the web page and right-click to start adding highlights."
                el.appendChild(p)

                highlightLists.appendChild(el)
            }
        })
    }

    updateHighlightLists()

    const deleteButton = document.querySelector('.delete-all-btn')

    deleteButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'deleteAllHighlights' }, (res) => {
            updateHighlightLists()
        })
    })

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'highlightsUpdated') {
            updateHighlightLists()
        }
    })
})
