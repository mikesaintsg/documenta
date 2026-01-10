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
				<label for="file-input" class="file-input-label">
					<input type="file" id="file-input" class="file-input" accept=".pdf,application/pdf,application/x-pdf">
				</label>
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

			<div class="toolbar-divider"></div>

			<div class="toolbar-group">
				<button id="btn-draw-pen" class="btn btn-icon" disabled title="Pen Tool">🖊️</button>
				<button id="btn-draw-highlight" class="btn btn-icon" disabled title="Highlighter">🖍️</button>
				<button id="btn-draw-eraser" class="btn btn-icon" disabled title="Eraser">🧽</button>
			</div>

			<div class="toolbar-divider"></div>

			<div class="toolbar-group">
				<button id="btn-add-page" class="btn btn-icon" disabled title="Add Blank Page">➕</button>
				<button id="btn-delete-page" class="btn btn-icon" disabled title="Delete Page">🗑️</button>
				<button id="btn-rotate-page" class="btn btn-icon" disabled title="Rotate Page">🔄</button>
			</div>
		</div>

		<div class="main-content">
			<div id="viewer-container" class="viewer-container">
				<div id="welcome" class="welcome">
					<h2>Welcome to Documenta</h2>
					<p>Open a PDF file to get started</p>
					<p class="welcome-features">Features: Text Selection, Inline Editing, Search, Drawing, Page Management, Form Filling</p>
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
				<span id="status-form" class="status-form"></span>
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

	// Drawing tools (Tier 3)
	const btnDrawPen = document.getElementById('btn-draw-pen') as HTMLButtonElement
	const btnDrawHighlight = document.getElementById('btn-draw-highlight') as HTMLButtonElement
	const btnDrawEraser = document.getElementById('btn-draw-eraser') as HTMLButtonElement

	btnDrawPen.addEventListener('click', handlePenTool)
	btnDrawHighlight.addEventListener('click', handleHighlightTool)
	btnDrawEraser.addEventListener('click', handleEraserTool)

	// Page management (Tier 3)
	const btnAddPage = document.getElementById('btn-add-page') as HTMLButtonElement
	const btnDeletePage = document.getElementById('btn-delete-page') as HTMLButtonElement
	const btnRotatePage = document.getElementById('btn-rotate-page') as HTMLButtonElement

	btnAddPage.addEventListener('click', handleAddPage)
	btnDeletePage.addEventListener('click', handleDeletePage)
	btnRotatePage.addEventListener('click', handleRotatePage)

	// Keyboard shortcuts
	document.addEventListener('keydown', handleKeyboard)

	// Mobile gestures: Pinch-to-zoom and swipe navigation
	setupMobileGestures()
}

// ============================================================================
// Mobile Gesture Support
// ============================================================================

function setupMobileGestures(): void {
	const viewerContainer = document.getElementById('viewer-container')
	if (!viewerContainer) return

	let initialDistance = 0
	let initialZoom = 1
	let touchStartX = 0
	let touchStartY = 0
	let isSwiping = false

	viewerContainer.addEventListener('touchstart', (e: TouchEvent) => {
		if (e.touches.length === 2) {
			// Pinch gesture start
			const touch1 = e.touches[0]
			const touch2 = e.touches[1]
			if (touch1 && touch2) {
				initialDistance = Math.hypot(
					touch2.clientX - touch1.clientX,
					touch2.clientY - touch1.clientY,
				)
				initialZoom = editor?.getZoom() ?? 1
			}
		} else if (e.touches.length === 1) {
			// Potential swipe start
			const touch = e.touches[0]
			if (touch) {
				touchStartX = touch.clientX
				touchStartY = touch.clientY
				isSwiping = true
			}
		}
	}, { passive: true })

	viewerContainer.addEventListener('touchmove', (e: TouchEvent) => {
		if (e.touches.length === 2 && editor) {
			// Pinch-to-zoom
			const touch1 = e.touches[0]
			const touch2 = e.touches[1]
			if (touch1 && touch2 && initialDistance > 0) {
				const currentDistance = Math.hypot(
					touch2.clientX - touch1.clientX,
					touch2.clientY - touch1.clientY,
				)
				const scale = currentDistance / initialDistance
				const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, initialZoom * scale))
				editor.setZoom(newZoom)
			}
		}
	}, { passive: true })

	viewerContainer.addEventListener('touchend', (e: TouchEvent) => {
		if (e.touches.length === 0 && isSwiping && editor?.isLoaded()) {
			const touch = e.changedTouches[0]
			if (touch) {
				const deltaX = touch.clientX - touchStartX
				const deltaY = touch.clientY - touchStartY
				const absX = Math.abs(deltaX)
				const absY = Math.abs(deltaY)

				// Horizontal swipe for page navigation (requires significant horizontal movement)
				if (absX > 80 && absX > absY * 2) {
					if (deltaX > 0) {
						// Swipe right = previous page
						editor.goToPreviousPage()
						showToast('Previous page')
					} else {
						// Swipe left = next page
						editor.goToNextPage()
						showToast('Next page')
					}
				}
			}
		}
		isSwiping = false
		initialDistance = 0
	}, { passive: true })
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

	// Check for form fields (Tier 3)
	if (editor?.hasFormFields()) {
		updateFormStatus(true)
		showToast(`Loaded: ${fileName} (${pageCount} pages) - Form fields detected`)
	} else {
		updateFormStatus(false)
		showToast(`Loaded: ${fileName} (${pageCount} pages)`)
	}
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
	const pageWrapper = document.getElementById('page-wrapper') as HTMLDivElement
	const pageNumber = editor.getCurrentPage()
	const zoom = editor.getZoom()

	// Render the PDF page to canvas
	editor.renderPage(pageNumber, canvas)

	// Render text layer overlay (for text selection and inline editing)
	const textLayer = editor.getTextLayer()
	if (textLayer) {
		textLayer.render(pageNumber, pageWrapper, zoom)
	}

	// Render drawing layer (attach event listeners to canvas for drawing)
	const drawingLayer = editor.getDrawingLayer()
	if (drawingLayer) {
		drawingLayer.render(pageNumber, canvas, zoom)
	}
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
		// Tier 3 controls
		'btn-draw-pen',
		'btn-draw-highlight',
		'btn-draw-eraser',
		'btn-add-page',
		'btn-delete-page',
		'btn-rotate-page',
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

function updateFormStatus(hasForm: boolean): void {
	const statusForm = document.getElementById('status-form') as HTMLSpanElement
	if (hasForm) {
		statusForm.textContent = '📋 Fillable form'
		statusForm.style.color = '#48bb78'
	} else {
		statusForm.textContent = ''
	}
}

function updateDrawingButtons(activeTool: 'pen' | 'highlighter' | 'eraser' | 'none'): void {
	const btnPen = document.getElementById('btn-draw-pen') as HTMLButtonElement
	const btnHighlight = document.getElementById('btn-draw-highlight') as HTMLButtonElement
	const btnEraser = document.getElementById('btn-draw-eraser') as HTMLButtonElement

	btnPen.classList.toggle('btn-active', activeTool === 'pen')
	btnHighlight.classList.toggle('btn-active', activeTool === 'highlighter')
	btnEraser.classList.toggle('btn-active', activeTool === 'eraser')
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
// Drawing Handlers (Tier 3)
// ============================================================================

function handlePenTool(): void {
	if (!editor) return
	const drawingLayer = editor.getDrawingLayer()
	if (drawingLayer) {
		const isActive = drawingLayer.isActive() && drawingLayer.getState().currentTool === 'pen'
		if (isActive) {
			editor.setDrawingEnabled(false)
			updateDrawingButtons('none')
			showToast('Drawing mode disabled')
		} else {
			editor.setDrawingEnabled(true)
			drawingLayer.setTool('pen')
			updateDrawingButtons('pen')
			showToast('Pen tool - draw on the PDF')
		}
	}
}

function handleHighlightTool(): void {
	if (!editor) return
	const drawingLayer = editor.getDrawingLayer()
	if (drawingLayer) {
		const isActive = drawingLayer.isActive() && drawingLayer.getState().currentTool === 'highlighter'
		if (isActive) {
			editor.setDrawingEnabled(false)
			updateDrawingButtons('none')
			showToast('Drawing mode disabled')
		} else {
			editor.setDrawingEnabled(true)
			drawingLayer.setTool('highlighter')
			updateDrawingButtons('highlighter')
			showToast('Highlighter - highlight on the PDF')
		}
	}
}

function handleEraserTool(): void {
	if (!editor) return
	const drawingLayer = editor.getDrawingLayer()
	if (drawingLayer) {
		const isActive = drawingLayer.isActive() && drawingLayer.getState().currentTool === 'eraser'
		if (isActive) {
			editor.setDrawingEnabled(false)
			updateDrawingButtons('none')
			showToast('Drawing mode disabled')
		} else {
			editor.setDrawingEnabled(true)
			drawingLayer.setTool('eraser')
			updateDrawingButtons('eraser')
			showToast('Eraser - remove strokes')
		}
	}
}

// ============================================================================
// Page Management Handlers (Tier 3)
// ============================================================================

function handleAddPage(): void {
	if (!editor) return
	const currentPage = editor.getCurrentPage()
	const newPage = editor.addBlankPage(currentPage)
	if (newPage > 0) {
		editor.goToPage(newPage)
		updatePageInfo(newPage, editor.getPageCount())
		showToast(`Added blank page at position ${newPage}`)
	}
}

function handleDeletePage(): void {
	if (!editor) return
	const pageCount = editor.getPageCount()
	if (pageCount <= 1) {
		showToast('Cannot delete the only page')
		return
	}

	const currentPage = editor.getCurrentPage()
	const confirmed = confirm(`Delete page ${currentPage}?`)
	if (confirmed) {
		editor.deletePage(currentPage)
		updatePageInfo(editor.getCurrentPage(), editor.getPageCount())
		renderCurrentPage()
		showToast(`Page ${currentPage} deleted`)
	}
}

function handleRotatePage(): void {
	if (!editor) return
	const currentPage = editor.getCurrentPage()
	const currentRotation = editor.getPageRotation(currentPage)
	const rotations = [0, 90, 180, 270] as const
	const currentIndex = rotations.indexOf(currentRotation)
	const nextRotation = rotations[(currentIndex + 1) % 4] ?? 0
	editor.rotatePage(currentPage, nextRotation)
	renderCurrentPage()
	showToast(`Page rotated to ${nextRotation}°`)
}

// ============================================================================
// Initialize
// ============================================================================

createUI()
