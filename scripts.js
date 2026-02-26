document.addEventListener('DOMContentLoaded', () => {

    // ── Tabs ──────────────────────────────────────────────────────────────────
    const tabBtns = document.querySelectorAll('.tab-btn')
    const tabContents = document.querySelectorAll('.tab-content')

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'))
            tabContents.forEach(c => c.classList.add('hidden'))
            btn.classList.add('active')
            document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden')
        })
    })

    // ── Helpers ───────────────────────────────────────────────────────────────
    function getCategoryColor(categoryId, categories) {
        if (!categoryId) return null
        const cat = categories.find(c => c.id === categoryId)
        return cat ? cat.color : null
    }

    function getCategoryName(categoryId, categories) {
        if (!categoryId) return null
        const cat = categories.find(c => c.id === categoryId)
        return cat ? cat.name : null
    }

    // ── Highlights ────────────────────────────────────────────────────────────
    function updateHighlightLists(filterCategoryId) {
        chrome.storage.local.get({ highlights: [], categories: [] }, (data) => {
            const highlights = data.highlights
            const categories = data.categories
            const highlightLists = document.querySelector('.highlights-list')
            highlightLists.innerHTML = ''

            // Poblar el select de filtro
            const filterSelect = document.getElementById('category-filter')
            const currentFilter = filterCategoryId !== undefined ? filterCategoryId : filterSelect.value
            filterSelect.innerHTML = '<option value="all">All categories</option>'
            categories.forEach(cat => {
                const opt = document.createElement('option')
                opt.value = cat.id
                opt.textContent = cat.name
                if (currentFilter === cat.id) opt.selected = true
                filterSelect.appendChild(opt)
            })
            if (currentFilter === 'all' || currentFilter === undefined) {
                filterSelect.value = 'all'
            }

            // Filtrar
            const filtered = currentFilter && currentFilter !== 'all'
                ? highlights.filter(h => h.categoryId === currentFilter)
                : highlights

            if (filtered.length) {
                filtered.forEach((highlight) => {
                    const catColor = getCategoryColor(highlight.categoryId, categories)
                    const catName = getCategoryName(highlight.categoryId, categories)

                    const el = document.createElement('li')
                    el.className = 'highlight'
                    if (catColor) {
                        el.style.borderColor = catColor
                        el.style.backgroundColor = catColor + '22'
                        el.style.setProperty('--highlight-hover-bg', catColor + '55')
                    }
                    el.style.cursor = 'pointer'
                    el.onclick = () => {
                        const encoded = encodeURIComponent(highlight.highlight)
                        const url = highlight.source + '#:~:text=' + encoded
                        window.open(url, '_blank')
                    }

                    // Badge de categoría (en flujo normal, arriba del todo)
                    if (catName) {
                        const badge = document.createElement('span')
                        badge.className = 'category-badge'
                        badge.textContent = catName
                        if (catColor) badge.style.backgroundColor = catColor
                        el.appendChild(badge)
                    }

                    // Fila principal: texto + select + botón borrar
                    const row = document.createElement('div')
                    row.className = 'highlight-row'

                    const p = document.createElement('p')
                    p.textContent = highlight.highlight
                    row.appendChild(p)

                    // Select para cambiar categoría
                    const catSelect = document.createElement('select')
                    catSelect.className = 'inline-cat-select'
                    const noneOpt = document.createElement('option')
                    noneOpt.value = ''
                    noneOpt.textContent = '—'
                    catSelect.appendChild(noneOpt)
                    categories.forEach(cat => {
                        const opt = document.createElement('option')
                        opt.value = cat.id
                        opt.textContent = cat.name
                        if (highlight.categoryId === cat.id) opt.selected = true
                        catSelect.appendChild(opt)
                    })
                    catSelect.addEventListener('change', (e) => {
                        e.stopPropagation()
                        chrome.runtime.sendMessage({
                            action: 'updateHighlightCategory',
                            id: highlight.id,
                            categoryId: catSelect.value || null
                        })
                    })
                    catSelect.addEventListener('click', (e) => e.stopPropagation())
                    row.appendChild(catSelect)

                    const img = document.createElement('img')
                    img.src = '/assets/icon-delete.png'
                    img.onclick = (e) => {
                        e.stopPropagation()
                        chrome.runtime.sendMessage({ action: 'deleteHighlight', id: highlight.id })
                    }
                    row.appendChild(img)

                    el.appendChild(row)

                    // URL fuente (dentro del flujo, al fondo)
                    const src = document.createElement('p')
                    src.className = 'source'
                    src.textContent = highlight.source
                    el.appendChild(src)

                    highlightLists.appendChild(el)
                })
            } else {
                const el = document.createElement('li')
                el.className = 'info'
                const p = document.createElement('p')
                p.textContent = highlights.length
                    ? 'No highlights in this category.'
                    : 'Select any text on a web page and right-click to add a highlight.'
                el.appendChild(p)
                highlightLists.appendChild(el)
            }
        })
    }

    updateHighlightLists()

    document.getElementById('category-filter').addEventListener('change', (e) => {
        updateHighlightLists(e.target.value)
    })

    // Buy Me a Coffee — abrir en nueva pestaña de forma fiable en extensiones
    document.querySelector('.bmc-btn').addEventListener('click', (e) => {
        e.preventDefault()
        chrome.tabs.create({ url: 'https://buymeacoffee.com/develjuanma' })
    })

    // ── Categorías ────────────────────────────────────────────────────────────
    const CATEGORY_COLORS = [
        '#FFEE2F', '#FF6B6B', '#48B2FF', '#6BCB77', '#FF9F43',
        '#A29BFE', '#FD79A8', '#00CEC9', '#E17055', '#74B9FF'
    ]

    function renderCategories() {
        chrome.storage.local.get({ categories: [] }, (data) => {
            const categories = data.categories
            const list = document.getElementById('categories-list')
            list.innerHTML = ''

            if (categories.length === 0) {
                const li = document.createElement('li')
                li.className = 'info'
                const p = document.createElement('p')
                p.textContent = 'No categories yet. Create one!'
                li.appendChild(p)
                list.appendChild(li)
                return
            }

            categories.forEach((cat) => {
                const li = document.createElement('li')
                li.className = 'category-item'

                // Dot de color clickable con input color oculto
                const colorBtn = document.createElement('button')
                colorBtn.className = 'color-dot-btn'
                colorBtn.title = 'Change color'
                colorBtn.style.backgroundColor = cat.color
                const colorInput = document.createElement('input')
                colorInput.type = 'color'
                colorInput.value = cat.color
                colorInput.addEventListener('input', (e) => {
                    colorBtn.style.backgroundColor = e.target.value
                })
                colorInput.addEventListener('change', (e) => {
                    const newColor = e.target.value
                    chrome.storage.local.get({ categories: [] }, (data) => {
                        const categories = data.categories
                        const cat2 = categories.find(c => c.id === cat.id)
                        if (cat2) cat2.color = newColor
                        chrome.storage.local.set({ categories }, () => {
                            renderCategories()
                            updateHighlightLists()
                        })
                    })
                })
                colorBtn.appendChild(colorInput)
                li.appendChild(colorBtn)

                const nameSpan = document.createElement('span')
                nameSpan.className = 'category-name'
                nameSpan.textContent = cat.name
                li.appendChild(nameSpan)

                const editBtn = document.createElement('button')
                editBtn.className = 'cat-edit-btn'
                editBtn.title = 'Edit'
                editBtn.textContent = 'Edit'
                editBtn.onclick = () => startEditCategory(cat, li)
                li.appendChild(editBtn)

                const deleteBtn = document.createElement('button')
                deleteBtn.className = 'cat-delete-btn'
                deleteBtn.title = 'Delete'
                deleteBtn.textContent = 'Delete'
                deleteBtn.onclick = () => deleteCategory(cat.id)
                li.appendChild(deleteBtn)

                list.appendChild(li)
            })
        })
    }

    function startEditCategory(cat, li) {
        li.innerHTML = ''

        const input = document.createElement('input')
        input.type = 'text'
        input.value = cat.name
        input.maxLength = 30
        input.className = 'edit-category-input'
        li.appendChild(input)

        const saveBtn = document.createElement('button')
        saveBtn.textContent = 'Save'
        saveBtn.className = 'cat-save-btn'
        saveBtn.onclick = () => {
            const newName = input.value.trim()
            if (!newName) return
            chrome.storage.local.get({ categories: [] }, (data) => {
                const categories = data.categories
                const cat2 = categories.find(c => c.id === cat.id)
                if (cat2) cat2.name = newName
                chrome.storage.local.set({ categories }, () => {
                    chrome.runtime.sendMessage({ action: 'rebuildContextMenus' })
                    renderCategories()
                    updateHighlightLists()
                })
            })
        }
        li.appendChild(saveBtn)

        const cancelBtn = document.createElement('button')
        cancelBtn.textContent = 'Cancel'
        cancelBtn.className = 'cat-cancel-btn'
        cancelBtn.onclick = () => renderCategories()
        li.appendChild(cancelBtn)

        input.focus()
    }

    function deleteCategory(id) {
        chrome.storage.local.get({ categories: [], highlights: [] }, (data) => {
            const categories = data.categories.filter(c => c.id !== id)
            // Desasociar highlights de esa categoría
            const highlights = data.highlights.map(h => {
                if (h.categoryId === id) h.categoryId = null
                return h
            })
            chrome.storage.local.set({ categories, highlights }, () => {
                chrome.runtime.sendMessage({ action: 'rebuildContextMenus' })
                renderCategories()
                updateHighlightLists()
            })
        })
    }

    document.getElementById('add-category-btn').addEventListener('click', () => {
        const input = document.getElementById('new-category-input')
        const name = input.value.trim()
        if (!name) return
        chrome.storage.local.get({ categories: [] }, (data) => {
            const categories = data.categories
            // Asignar color automáticamente (circular)
            const color = CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length]
            categories.push({ id: Date.now().toString(), name, color })
            chrome.storage.local.set({ categories }, () => {
                chrome.runtime.sendMessage({ action: 'rebuildContextMenus' })
                input.value = ''
                renderCategories()
                updateHighlightLists()
            })
        })
    })

    document.getElementById('new-category-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('add-category-btn').click()
    })

    renderCategories()

    // ── Mensajes en tiempo real ───────────────────────────────────────────────
    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === 'highlightsUpdated') {
            updateHighlightLists()
        }
    })
})
