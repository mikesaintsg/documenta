/**
 * Documenta - Showcase Application
 *
 * Demonstrates all features of the PDF editor library.
 */

import './styles.css'
import {
	createPdfEditor,
	hasFileSystemAccess,
	DEFAULT_ZOOM,
	MIN_ZOOM,
	MAX_ZOOM,
} from '~/src/index.js'
import type { PdfEditorInterface } from '~/src/types.js'

// ============================================================================
// Application State
// ============================================================================

let editor: PdfEditorInterface | null = null
let toastTimeout: ReturnType<typeof setTimeout> | null = null

// ============================================================================
// DOM Elements
// ============================================================================

const app = document.getElementById('app')
if (!app) throw new Error('App container not found')
const appElement: HTMLElement = app

// ============================================================================
// UI Creation
// ============================================================================

function createUI(): void {
	appElement.innerHTML = `
		<div class="toolbar">
			<span class="toolbar-title">Documenta</span>

			<div class="toolbar-group">
				<input type="file" id="file-input" class="file-input" accept=".pdf,application/pdf">
				<button id="btn-open" class="btn btn-primary">Open PDF</button>
				<button id="btn-save" class="btn" disabled>Save</button>
				<button id="btn-download" class="btn" disabled>Download</button>
			</div>

			<div class="toolbar-divider"></div>

			<div class="toolbar-group">
				<button id="btn-prev" class="btn btn-icon" disabled title="Previous Page">◀</button>
				<input type="number" id="input-page" class="input-page" value="1" min="1" disabled>
				<span class="page-info">/ <span id="page-count">0</span></span>
				<button id="btn-next" class="btn btn-icon" disabled title="Next Page">▶</button>
			</div>

			<div class="toolbar-divider"></div>

			<div class="toolbar-group">
				<button id="btn-zoom-out" class="btn btn-icon" disabled title="Zoom Out">−</button>
				<span id="zoom-value" class="zoom-value">100%</span>
				<button id="btn-zoom-in" class="btn btn-icon" disabled title="Zoom In">+</button>
				<button id="btn-fit-width" class="btn" disabled>Fit Width</button>
				<button id="btn-fit-page" class="btn" disabled>Fit Page</button>
			</div>

			<div class="toolbar-divider"></div>

			<div class="toolbar-group">
				<button id="btn-mode-select" class="btn btn-icon" disabled title="Text Select Mode">📝</button>
				<button id="btn-mode-edit" class="btn btn-icon" disabled title="Text Edit Mode">✏️</button>
				<button id="btn-search" class="btn" disabled>Search</button>
			</div>
		</div>

		<div class="main-content">
			<div id="viewer-container" class="viewer-container">
				<div id="welcome" class="welcome">
					<h2>Welcome to Documenta</h2>
					<p>Open a PDF file to get started</p>
					<p class="welcome-features">Features: Text Selection, Inline Editing, Search</p>
					<button id="btn-open-welcome" class="btn btn-primary">Open PDF</button>
				</div>
				<div id="page-wrapper" class="page-wrapper" style="display: none;">
					<canvas id="page-canvas" class="page-canvas"></canvas>
				</div>
			</div>
		</div>

		<div class="status-bar">
			<div class="status-bar-left">
				<span id="status-file">No file loaded</span>
				<span class="status-indicator">
					<span id="status-dot" class="status-dot" style="display: none;"></span>
					<span id="status-saved"></span>
				</span>
			</div>
			<span id="status-fs-api">${hasFileSystemAccess() ? 'File System Access API available' : 'Using fallback download'}</span>
		</div>

		<div id="toast" class="toast"></div>
	`

	attachEventListeners()
}

// ============================================================================
// Event Listeners
// ============================================================================

function attachEventListeners(): void {
	// File input
	const fileInput = document.getElementById('file-input') as HTMLInputElement
	const btnOpen = document.getElementById('btn-open') as HTMLButtonElement
	const btnOpenWelcome = document.getElementById('btn-open-welcome') as HTMLButtonElement

	fileInput.addEventListener('change', handleFileSelect)
	btnOpen.addEventListener('click', () => fileInput.click())
	btnOpenWelcome.addEventListener('click', () => fileInput.click())

	// Save/Download
	const btnSave = document.getElementById('btn-save') as HTMLButtonElement
	const btnDownload = document.getElementById('btn-download') as HTMLButtonElement

	btnSave.addEventListener('click', handleSave)
	btnDownload.addEventListener('click', handleDownload)

	// Navigation
	const btnPrev = document.getElementById('btn-prev') as HTMLButtonElement
	const btnNext = document.getElementById('btn-next') as HTMLButtonElement
	const inputPage = document.getElementById('input-page') as HTMLInputElement

	btnPrev.addEventListener('click', () => editor?.goToPreviousPage())
	btnNext.addEventListener('click', () => editor?.goToNextPage())
	inputPage.addEventListener('change', handlePageInput)
	inputPage.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			handlePageInput()
		}
	})

	// Zoom
	const btnZoomIn = document.getElementById('btn-zoom-in') as HTMLButtonElement
	const btnZoomOut = document.getElementById('btn-zoom-out') as HTMLButtonElement
	const btnFitWidth = document.getElementById('btn-fit-width') as HTMLButtonElement
	const btnFitPage = document.getElementById('btn-fit-page') as HTMLButtonElement

	btnZoomIn.addEventListener('click', () => editor?.zoomIn())
	btnZoomOut.addEventListener('click', () => editor?.zoomOut())
	btnFitWidth.addEventListener('click', () => editor?.fitToWidth())
	btnFitPage.addEventListener('click', () => editor?.fitToPage())

	// Text mode buttons
	const btnModeSelect = document.getElementById('btn-mode-select') as HTMLButtonElement
	const btnModeEdit = document.getElementById('btn-mode-edit') as HTMLButtonElement
	const btnSearch = document.getElementById('btn-search') as HTMLButtonElement

	btnModeSelect.addEventListener('click', handleSelectMode)
	btnModeEdit.addEventListener('click', handleEditMode)
	btnSearch.addEventListener('click', handleSearch)

	// Keyboard shortcuts
	document.addEventListener('keydown', handleKeyboard)
}

// ============================================================================
// Event Handlers
// ============================================================================

async function handleFileSelect(event: Event): Promise<void> {
	const input = event.target as HTMLInputElement
	const file = input.files?.[0]

	if (!file) return

	// Clean up existing editor
	if (editor) {
		editor.destroy()
		editor = null
	}

	const container = document.getElementById('viewer-container') as HTMLElement

	editor = createPdfEditor({
		container,
		initialZoom: DEFAULT_ZOOM,
		onLoad: handleDocumentLoad,
		onPageChange: handlePageChange,
		onZoomChange: handleZoomChange,
		onSave: handleSaveResult,
		onError: handleError,
	})

	try {
		await editor.load(file)
	} catch {
		showToast('Failed to load PDF')
	}

	// Reset file input
	input.value = ''
}

function handleDocumentLoad(fileName: string, pageCount: number): void {
	// Hide welcome, show page wrapper
	const welcome = document.getElementById('welcome') as HTMLElement
	const pageWrapper = document.getElementById('page-wrapper') as HTMLDivElement

	welcome.style.display = 'none'
	pageWrapper.style.display = 'block'

	// Update UI state
	updateControlsEnabled(true)
	updatePageInfo(1, pageCount)
	updateZoomDisplay(DEFAULT_ZOOM)
	updateStatusFile(fileName)
	updateSavedStatus(true)

	// Render first page
	renderCurrentPage()

	// Initialize text layer in select mode by default
	const textLayer = editor?.getTextLayer()
	if (textLayer) {
		textLayer.setEditMode('select')
		updateModeButtons('select')
	}

	showToast(`Loaded: ${fileName} (${pageCount} pages)`)
}

function handlePageChange(pageNumber: number): void {
	if (!editor) return

	const pageCount = editor.getPageCount()
	updatePageInfo(pageNumber, pageCount)
	renderCurrentPage()
}

function handleZoomChange(zoom: number): void {
	updateZoomDisplay(zoom)
	renderCurrentPage()
}

function handleSaveResult(success: boolean): void {
	if (success) {
		updateSavedStatus(true)
		showToast('Document saved successfully')
	} else {
		showToast('Failed to save document')
	}
}

function handleError(error: Error): void {
	showToast(`Error: ${error.message}`)
}

function handlePageInput(): void {
	if (!editor) return

	const input = document.getElementById('input-page') as HTMLInputElement
	const pageNumber = parseInt(input.value, 10)

	if (!isNaN(pageNumber)) {
		editor.goToPage(pageNumber)
	}
}

async function handleSave(): Promise<void> {
	if (!editor) return
	await editor.save()
}

function handleDownload(): void {
	if (!editor) return
	editor.download()
}

function handleKeyboard(event: KeyboardEvent): void {
	if (!editor || !editor.isLoaded()) return

	// Ignore if focused on input or textarea
	const tagName = document.activeElement?.tagName
	if (tagName === 'INPUT' || tagName === 'TEXTAREA') return

	switch (event.key) {
		case 'ArrowLeft':
		case 'PageUp':
			event.preventDefault()
			editor.goToPreviousPage()
			break
		case 'ArrowRight':
		case 'PageDown':
			event.preventDefault()
			editor.goToNextPage()
			break
		case '+':
		case '=':
			event.preventDefault()
			editor.zoomIn()
			break
		case '-':
			event.preventDefault()
			editor.zoomOut()
			break
		case '0':
			event.preventDefault()
			editor.resetZoom()
			break
		case 'c':
			// Copy selection with Ctrl/Cmd+C
			if (event.ctrlKey || event.metaKey) {
				const textLayer = editor.getTextLayer()
				if (textLayer?.getSelection()) {
					event.preventDefault()
					textLayer.copySelection()
					showToast('Text copied to clipboard')
				}
			}
			break
		case 'f':
			// Search with Ctrl/Cmd+F
			if (event.ctrlKey || event.metaKey) {
				event.preventDefault()
				handleSearch()
			}
			break
	}
}

function handleSelectMode(): void {
	if (!editor) return
	const textLayer = editor.getTextLayer()
	if (textLayer) {
		textLayer.setEditMode('select')
		updateModeButtons('select')
		showToast('Text selection mode')
	}
}

function handleEditMode(): void {
	if (!editor) return
	const textLayer = editor.getTextLayer()
	if (textLayer) {
		textLayer.setEditMode('edit')
		updateModeButtons('edit')
		showToast('Text edit mode - double-click to edit')
	}
}

function handleSearch(): void {
	if (!editor) return
	const query = prompt('Search text:')
	if (!query) return

	const results = editor.searchText(query)
	if (results.length === 0) {
		showToast('No matches found')
	} else {
		// Go to first result page
		const firstResult = results[0]
		if (firstResult) {
			editor.goToPage(firstResult.pageNumber)
			showToast(`Found ${results.length} matches`)
		}
	}
}

// ============================================================================
// Rendering
// ============================================================================

function renderCurrentPage(): void {
	if (!editor || !editor.isLoaded()) return

	const canvas = document.getElementById('page-canvas') as HTMLCanvasElement
	const pageNumber = editor.getCurrentPage()

	editor.renderPage(pageNumber, canvas)
}

// ============================================================================
// UI Updates
// ============================================================================

function updateControlsEnabled(enabled: boolean): void {
	const controls = [
		'btn-save',
		'btn-download',
		'btn-prev',
		'btn-next',
		'input-page',
		'btn-zoom-in',
		'btn-zoom-out',
		'btn-fit-width',
		'btn-fit-page',
		'btn-mode-select',
		'btn-mode-edit',
		'btn-search',
	]

	for (const id of controls) {
		const el = document.getElementById(id) as HTMLButtonElement | HTMLInputElement | null
		if (el) {
			el.disabled = !enabled
		}
	}
}

function updateModeButtons(mode: 'select' | 'edit' | 'none'): void {
	const btnSelect = document.getElementById('btn-mode-select') as HTMLButtonElement
	const btnEdit = document.getElementById('btn-mode-edit') as HTMLButtonElement

	btnSelect.classList.toggle('btn-active', mode === 'select')
	btnEdit.classList.toggle('btn-active', mode === 'edit')
}

function updatePageInfo(currentPage: number, totalPages: number): void {
	const inputPage = document.getElementById('input-page') as HTMLInputElement
	const pageCount = document.getElementById('page-count') as HTMLSpanElement
	const btnPrev = document.getElementById('btn-prev') as HTMLButtonElement
	const btnNext = document.getElementById('btn-next') as HTMLButtonElement

	inputPage.value = String(currentPage)
	inputPage.max = String(totalPages)
	pageCount.textContent = String(totalPages)

	btnPrev.disabled = currentPage <= 1
	btnNext.disabled = currentPage >= totalPages
}

function updateZoomDisplay(zoom: number): void {
	const zoomValue = document.getElementById('zoom-value') as HTMLSpanElement
	const btnZoomIn = document.getElementById('btn-zoom-in') as HTMLButtonElement
	const btnZoomOut = document.getElementById('btn-zoom-out') as HTMLButtonElement

	zoomValue.textContent = `${Math.round(zoom * 100)}%`
	btnZoomIn.disabled = zoom >= MAX_ZOOM
	btnZoomOut.disabled = zoom <= MIN_ZOOM
}

function updateStatusFile(fileName: string): void {
	const statusFile = document.getElementById('status-file') as HTMLSpanElement
	statusFile.textContent = fileName
}

function updateSavedStatus(saved: boolean): void {
	const statusDot = document.getElementById('status-dot') as HTMLSpanElement
	const statusSaved = document.getElementById('status-saved') as HTMLSpanElement

	statusDot.style.display = 'inline-block'
	statusDot.className = saved ? 'status-dot' : 'status-dot unsaved'
	statusSaved.textContent = saved ? 'Saved' : 'Unsaved changes'
}

function showToast(message: string): void {
	const toast = document.getElementById('toast') as HTMLElement

	if (toastTimeout) {
		clearTimeout(toastTimeout)
	}

	toast.textContent = message
	toast.classList.add('visible')

	toastTimeout = setTimeout(() => {
		toast.classList.remove('visible')
		toastTimeout = null
	}, 3000)
}

// ============================================================================
// Initialize
// ============================================================================

createUI()
