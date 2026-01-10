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
/** Current mode - only one mode can be active at a time */
type EditorMode = 'pan' | 'text-select' | 'text-edit' | 'draw-pen' | 'draw-highlighter' | 'draw-eraser'
let currentMode: EditorMode = 'pan'
let isMenuOpen = false

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
			<div class="toolbar-header">
				<span class="toolbar-title">Documenta</span>
				<div class="toolbar-quick-actions">
					<label for="file-input" class="file-input-label">
						<input type="file" id="file-input" class="file-input" accept=".pdf,application/pdf,application/x-pdf">
					</label>
					<button id="btn-open" class="btn btn-primary btn-icon" title="Open PDF">📂</button>
					<button id="btn-save" class="btn btn-icon" disabled title="Save">💾</button>
				</div>
				<button id="menu-toggle" class="menu-toggle" aria-expanded="false" aria-label="Toggle menu">☰</button>
			</div>

			<div id="toolbar-menu" class="toolbar-menu">
				<!-- Navigation Section -->
				<div class="toolbar-section">
					<span class="toolbar-section-label">Navigate</span>
					<div class="toolbar-group">
						<button id="btn-prev" class="btn btn-icon" disabled title="Previous Page">◀</button>
						<input type="number" id="input-page" class="input-page" value="1" min="1" disabled>
						<span class="page-info">/ <span id="page-count">0</span></span>
						<button id="btn-next" class="btn btn-icon" disabled title="Next Page">▶</button>
					</div>
				</div>

				<div class="toolbar-divider"></div>

				<!-- Zoom Section -->
				<div class="toolbar-section">
					<span class="toolbar-section-label">Zoom</span>
					<div class="toolbar-group">
						<button id="btn-zoom-out" class="btn btn-icon" disabled title="Zoom Out">−</button>
						<span id="zoom-value" class="zoom-value">100%</span>
						<button id="btn-zoom-in" class="btn btn-icon" disabled title="Zoom In">+</button>
						<button id="btn-fit-width" class="btn" disabled>Fit Width</button>
						<button id="btn-fit-page" class="btn" disabled>Fit Page</button>
					</div>
				</div>

				<div class="toolbar-divider"></div>

				<!-- Mode Section - Text Tools -->
				<div class="toolbar-section">
					<span class="toolbar-section-label">Text Tools</span>
					<div class="toolbar-group">
						<button id="btn-mode-pan" class="btn btn-icon btn-active" title="Pan Mode (scroll/navigate)">🖐️</button>
						<button id="btn-mode-select" class="btn btn-icon" disabled title="Select Text">📝</button>
						<button id="btn-mode-edit" class="btn btn-icon" disabled title="Edit Text (double-tap)">✏️</button>
						<button id="btn-search" class="btn btn-icon" disabled title="Search Text">🔍</button>
					</div>
				</div>

				<div class="toolbar-divider"></div>

				<!-- Mode Section - Drawing Tools -->
				<div class="toolbar-section">
					<span class="toolbar-section-label">Drawing Tools</span>
					<div class="toolbar-group">
						<button id="btn-draw-pen" class="btn btn-icon" disabled title="Pen">🖊️</button>
						<button id="btn-draw-highlight" class="btn btn-icon" disabled title="Highlighter">🖍️</button>
						<button id="btn-draw-eraser" class="btn btn-icon" disabled title="Eraser">🧽</button>
						<button id="btn-draw-undo" class="btn btn-icon" disabled title="Undo Stroke">↩️</button>
						<button id="btn-draw-redo" class="btn btn-icon" disabled title="Redo Stroke">↪️</button>
					</div>
				</div>

				<div class="toolbar-divider"></div>

				<!-- Page Management Section -->
				<div class="toolbar-section">
					<span class="toolbar-section-label">Pages</span>
					<div class="toolbar-group">
						<button id="btn-add-page" class="btn btn-icon" disabled title="Add Blank Page">➕</button>
						<button id="btn-delete-page" class="btn btn-icon" disabled title="Delete Page">🗑️</button>
						<button id="btn-rotate-page" class="btn btn-icon" disabled title="Rotate Page">🔄</button>
					</div>
				</div>

				<div class="toolbar-divider"></div>

				<!-- File Operations Section -->
				<div class="toolbar-section">
					<span class="toolbar-section-label">File</span>
					<div class="toolbar-group">
						<button id="btn-download" class="btn" disabled>Download</button>
					</div>
				</div>
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
				<span id="status-mode" class="status-mode">Mode: Pan</span>
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
	// Menu toggle (for mobile)
	const menuToggle = document.getElementById('menu-toggle') as HTMLButtonElement
	const toolbarMenu = document.getElementById('toolbar-menu') as HTMLDivElement

	menuToggle.addEventListener('click', () => {
		isMenuOpen = !isMenuOpen
		menuToggle.setAttribute('aria-expanded', String(isMenuOpen))
		toolbarMenu.classList.toggle('is-open', isMenuOpen)
		menuToggle.textContent = isMenuOpen ? '✕' : '☰'
	})

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

	// Mode buttons - unified mode switching
	const btnModePan = document.getElementById('btn-mode-pan') as HTMLButtonElement
	const btnModeSelect = document.getElementById('btn-mode-select') as HTMLButtonElement
	const btnModeEdit = document.getElementById('btn-mode-edit') as HTMLButtonElement
	const btnSearch = document.getElementById('btn-search') as HTMLButtonElement

	btnModePan.addEventListener('click', () => setMode('pan'))
	btnModeSelect.addEventListener('click', () => setMode('text-select'))
	btnModeEdit.addEventListener('click', () => setMode('text-edit'))
	btnSearch.addEventListener('click', handleSearch)

	// Drawing tools
	const btnDrawPen = document.getElementById('btn-draw-pen') as HTMLButtonElement
	const btnDrawHighlight = document.getElementById('btn-draw-highlight') as HTMLButtonElement
	const btnDrawEraser = document.getElementById('btn-draw-eraser') as HTMLButtonElement
	const btnDrawUndo = document.getElementById('btn-draw-undo') as HTMLButtonElement
	const btnDrawRedo = document.getElementById('btn-draw-redo') as HTMLButtonElement

	btnDrawPen.addEventListener('click', () => setMode('draw-pen'))
	btnDrawHighlight.addEventListener('click', () => setMode('draw-highlighter'))
	btnDrawEraser.addEventListener('click', () => setMode('draw-eraser'))
	btnDrawUndo.addEventListener('click', handleDrawingUndo)
	btnDrawRedo.addEventListener('click', handleDrawingRedo)

	// Page management
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

	// Initialize to pan mode (safest default for mobile)
	setMode('pan')

	// Setup text selection feedback
	const textLayer = editor?.getTextLayer()
	if (textLayer) {
		textLayer.onTextSelect((selection) => {
			if (selection && selection.selectedText.length > 0) {
				const charCount = selection.selectedText.length
				showToast(`Selected ${charCount} chars - press Ctrl+C to copy`)
			}
		})

		textLayer.onTextEdit((edit) => {
			showToast(`Edited: "${edit.originalText}" → "${edit.newText}"`)
			updateSavedStatus(false)
		})
	}

	// Setup drawing feedback
	const drawingLayer = editor?.getDrawingLayer()
	if (drawingLayer) {
		drawingLayer.onStrokeComplete(() => {
			updateSavedStatus(false)
		})
	}

	// Check for form fields
	if (editor?.hasFormFields()) {
		updateFormStatus(true)
		showToast(`Loaded: ${fileName} (${pageCount} pages) - Form fields detected`)
	} else {
		updateFormStatus(false)
		showToast(`Loaded: ${fileName} (${pageCount} pages)`)
	}

	// Close the mobile menu after loading
	isMenuOpen = false
	const menuToggle = document.getElementById('menu-toggle') as HTMLButtonElement
	const toolbarMenu = document.getElementById('toolbar-menu') as HTMLDivElement
	if (menuToggle && toolbarMenu) {
		menuToggle.setAttribute('aria-expanded', 'false')
		toolbarMenu.classList.remove('is-open')
		menuToggle.textContent = '☰'
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
		case 'z':
			// Undo with Ctrl/Cmd+Z
			if ((event.ctrlKey || event.metaKey) && !event.shiftKey) {
				if (currentMode.startsWith('draw-')) {
					event.preventDefault()
					handleDrawingUndo()
				}
			}
			// Redo with Ctrl/Cmd+Shift+Z
			if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
				if (currentMode.startsWith('draw-')) {
					event.preventDefault()
					handleDrawingRedo()
				}
			}
			break
		case 'Escape':
			// Return to pan mode
			event.preventDefault()
			setMode('pan')
			break
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
// Unified Mode Switching
// ============================================================================

/**
 * Set the current editing mode.
 * Modes are mutually exclusive - only one can be active at a time.
 *
 * Modes:
 * - 'pan': Default mode, scrolling and navigation
 * - 'text-select': Text selection mode (overlay layer active)
 * - 'text-edit': Text edit mode (double-click to edit)
 * - 'draw-pen': Pen drawing tool
 * - 'draw-highlighter': Highlighter drawing tool
 * - 'draw-eraser': Eraser tool
 */
function setMode(mode: EditorMode): void {
	if (!editor) return

	// Toggle off to pan mode if clicking same button
	const targetMode: EditorMode = (currentMode === mode && mode !== 'pan') ? 'pan' : mode

	currentMode = targetMode

	// Deactivate all layers first
	const textLayer = editor.getTextLayer()
	const drawingLayer = editor.getDrawingLayer()

	// Disable text layer if switching away from text modes
	if (!targetMode.startsWith('text-')) {
		textLayer?.setEditMode('none')
		textLayer?.setVisible(false)
	}

	// Disable drawing layer if switching away from draw modes
	if (!targetMode.startsWith('draw-')) {
		editor.setDrawingEnabled(false)
	}

	// Now activate the selected mode
	switch (targetMode) {
		case 'pan':
			// Just navigation mode - both layers inactive
			showToast('Pan mode - scroll to navigate')
			break

		case 'text-select':
			if (textLayer) {
				textLayer.setVisible(true)
				textLayer.setEditMode('select')
			}
			showToast('Text selection mode - drag to select')
			break

		case 'text-edit':
			if (textLayer) {
				textLayer.setVisible(true)
				textLayer.setEditMode('edit')
			}
			showToast('Text edit mode - double-tap to edit')
			break

		case 'draw-pen':
			editor.setDrawingEnabled(true)
			if (drawingLayer) {
				drawingLayer.setTool('pen')
			}
			showToast('Pen tool - draw on the page')
			break

		case 'draw-highlighter':
			editor.setDrawingEnabled(true)
			if (drawingLayer) {
				drawingLayer.setTool('highlighter')
			}
			showToast('Highlighter tool')
			break

		case 'draw-eraser':
			editor.setDrawingEnabled(true)
			if (drawingLayer) {
				drawingLayer.setTool('eraser')
			}
			showToast('Eraser tool - tap strokes to erase')
			break
	}

	// Update all UI buttons
	updateAllModeButtons()
	updateStatusMode()
}

function updateAllModeButtons(): void {
	// Get all mode buttons
	const btnPan = document.getElementById('btn-mode-pan') as HTMLButtonElement
	const btnSelect = document.getElementById('btn-mode-select') as HTMLButtonElement
	const btnEdit = document.getElementById('btn-mode-edit') as HTMLButtonElement
	const btnPen = document.getElementById('btn-draw-pen') as HTMLButtonElement
	const btnHighlight = document.getElementById('btn-draw-highlight') as HTMLButtonElement
	const btnEraser = document.getElementById('btn-draw-eraser') as HTMLButtonElement

	// Remove active class from all
	btnPan?.classList.remove('btn-active')
	btnSelect?.classList.remove('btn-active')
	btnEdit?.classList.remove('btn-active')
	btnPen?.classList.remove('btn-active')
	btnHighlight?.classList.remove('btn-active')
	btnEraser?.classList.remove('btn-active')

	// Add active class to current mode
	switch (currentMode) {
		case 'pan':
			btnPan?.classList.add('btn-active')
			break
		case 'text-select':
			btnSelect?.classList.add('btn-active')
			break
		case 'text-edit':
			btnEdit?.classList.add('btn-active')
			break
		case 'draw-pen':
			btnPen?.classList.add('btn-active')
			break
		case 'draw-highlighter':
			btnHighlight?.classList.add('btn-active')
			break
		case 'draw-eraser':
			btnEraser?.classList.add('btn-active')
			break
	}
}

function updateStatusMode(): void {
	const statusMode = document.getElementById('status-mode') as HTMLSpanElement
	if (!statusMode) return

	const modeLabels: Record<EditorMode, string> = {
		'pan': 'Pan',
		'text-select': 'Select Text',
		'text-edit': 'Edit Text',
		'draw-pen': 'Pen',
		'draw-highlighter': 'Highlighter',
		'draw-eraser': 'Eraser',
	}

	statusMode.textContent = `Mode: ${modeLabels[currentMode]}`
}

function handleDrawingUndo(): void {
	if (!editor) return
	const drawingLayer = editor.getDrawingLayer()
	if (drawingLayer) {
		drawingLayer.undo()
		renderCurrentPage()
		showToast('Undo stroke')
	}
}

function handleDrawingRedo(): void {
	if (!editor) return
	const drawingLayer = editor.getDrawingLayer()
	if (drawingLayer) {
		drawingLayer.redo()
		renderCurrentPage()
		showToast('Redo stroke')
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
		// Drawing controls
		'btn-draw-pen',
		'btn-draw-highlight',
		'btn-draw-eraser',
		'btn-draw-undo',
		'btn-draw-redo',
		// Page management controls
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
// Page Management Handlers
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
