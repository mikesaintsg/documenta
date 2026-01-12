/**
 * Documenta - Mobile-First PDF Editor Showcase
 *
 * A production-ready, mobile-first PDF editor demonstrating
 * all features of the Documenta library.
 */

import './styles.css'
import { createPdfEditor, hasFileSystemAccess, isValidPdfFile } from '~/src/index.js'
import type { EditorInterface, EditorMode, DrawingTool } from '~/src/types.js'
import { DEFAULT_ZOOM } from '~/src/constants.js'

// ============================================================================
// Application State
// ============================================================================

interface AppState {
	editor: EditorInterface | null
	currentMode: EditorMode
	currentTool: DrawingTool
	isMenuOpen: boolean
	showToast: boolean
	toastMessage: string
}

const state: AppState = {
	editor: null,
	currentMode: 'pan',
	currentTool: 'pen',
	isMenuOpen: false,
	showToast: false,
	toastMessage: '',
}

// ============================================================================
// DOM Elements
// ============================================================================

const app = document.getElementById('app')
if (!app) throw new Error('App container not found')

// Create app structure
app.innerHTML = `
	<header class="toolbar" role="toolbar" aria-label="PDF Editor Toolbar">
		<div class="toolbar-header">
			<h1 class="toolbar-title">📄 Documenta</h1>
			<div class="toolbar-quick-actions">
				<button id="btn-open" class="btn btn-primary btn-icon" aria-label="Open PDF" title="Open PDF">
					📂
				</button>
				<button id="btn-save" class="btn btn-icon" aria-label="Save PDF" title="Save PDF" disabled>
					💾
				</button>
				<button id="btn-menu" class="menu-toggle" aria-label="Toggle menu" aria-expanded="false">
					☰
				</button>
			</div>
		</div>
		<div id="toolbar-menu" class="toolbar-menu">
			<section class="toolbar-section" aria-label="Mode Selection">
				<span class="toolbar-section-label">Mode</span>
				<div class="toolbar-group" role="radiogroup" aria-label="Editor Mode">
					<button id="btn-pan" class="btn btn-icon btn-active" role="radio" aria-checked="true" title="Pan/Scroll">
						✋
					</button>
					<button id="btn-text" class="btn btn-icon" role="radio" aria-checked="false" title="Select Text">
						📝
					</button>
					<button id="btn-draw" class="btn btn-icon" role="radio" aria-checked="false" title="Draw">
						✏️
					</button>
				</div>
			</section>
			<div class="toolbar-divider"></div>
			<section class="toolbar-section" aria-label="Navigation">
				<span class="toolbar-section-label">Page</span>
				<div class="toolbar-group">
					<button id="btn-prev" class="btn btn-icon" aria-label="Previous Page" title="Previous" disabled>
						◀
					</button>
					<label class="file-input-label" for="input-page">Go to page</label>
					<input id="input-page" type="number" class="input-page" min="1" value="1" aria-label="Current Page" disabled>
					<span id="page-count" class="page-info">/ 0</span>
					<button id="btn-next" class="btn btn-icon" aria-label="Next Page" title="Next" disabled>
						▶
					</button>
				</div>
			</section>
			<div class="toolbar-divider"></div>
			<section class="toolbar-section" aria-label="Zoom">
				<span class="toolbar-section-label">Zoom</span>
				<div class="toolbar-group">
					<button id="btn-zoom-out" class="btn btn-icon" aria-label="Zoom Out" title="Zoom Out" disabled>
						➖
					</button>
					<span id="zoom-value" class="zoom-value">100%</span>
					<button id="btn-zoom-in" class="btn btn-icon" aria-label="Zoom In" title="Zoom In" disabled>
						➕
					</button>
					<button id="btn-fit" class="btn btn-icon" aria-label="Fit to Width" title="Fit to Width" disabled>
						↔️
					</button>
				</div>
			</section>
			<div class="toolbar-divider"></div>
			<section id="drawing-tools" class="toolbar-section" aria-label="Drawing Tools" style="display: none;">
				<span class="toolbar-section-label">Tools</span>
				<div class="toolbar-group" role="radiogroup" aria-label="Drawing Tool">
					<button id="btn-pen" class="btn btn-icon btn-active" role="radio" aria-checked="true" title="Pen">
						🖊️
					</button>
					<button id="btn-highlighter" class="btn btn-icon" role="radio" aria-checked="false" title="Highlighter">
						🖍️
					</button>
					<button id="btn-eraser" class="btn btn-icon" role="radio" aria-checked="false" title="Eraser">
						🧹
					</button>
				</div>
				<div class="toolbar-group" aria-label="Drawing Colors">
					<button id="color-black" class="btn btn-icon color-btn color-active" style="background-color: #000" aria-label="Black" title="Black"></button>
					<button id="color-red" class="btn btn-icon color-btn" style="background-color: #dc2626" aria-label="Red" title="Red"></button>
					<button id="color-blue" class="btn btn-icon color-btn" style="background-color: #2563eb" aria-label="Blue" title="Blue"></button>
					<button id="color-green" class="btn btn-icon color-btn" style="background-color: #16a34a" aria-label="Green" title="Green"></button>
					<button id="color-yellow" class="btn btn-icon color-btn" style="background-color: #eab308" aria-label="Yellow" title="Yellow"></button>
				</div>
				<div class="toolbar-group">
					<button id="btn-undo" class="btn btn-icon" aria-label="Undo" title="Undo" disabled>
						↩️
					</button>
					<button id="btn-redo" class="btn btn-icon" aria-label="Redo" title="Redo" disabled>
						↪️
					</button>
					<button id="btn-clear" class="btn btn-icon" aria-label="Clear Page" title="Clear Page" disabled>
						🗑️
					</button>
				</div>
			</section>
		</div>
	</header>

	<main class="main-content">
		<div id="viewer-container" class="viewer-container">
			<div id="welcome" class="welcome">
				<h2>Welcome to Documenta</h2>
				<p>A mobile-first PDF editor built for touch</p>
				<button id="btn-open-welcome" class="btn btn-primary">
					📂 Open PDF
				</button>
				<p class="welcome-features">
					✨ Pan & Zoom • 📝 Select Text • ✏️ Draw & Annotate
				</p>
			</div>
		</div>
	</main>

	<footer class="status-bar">
		<div class="status-bar-left">
			<span id="file-name" class="status-indicator">No file loaded</span>
			<span id="status-mode" class="status-mode">PAN</span>
		</div>
		<div class="status-indicator">
			<span id="save-status" class="status-dot"></span>
			<span id="save-text">Saved</span>
		</div>
	</footer>

	<div id="toast" class="toast" role="alert" aria-live="polite"></div>

	<input id="file-input" type="file" class="file-input" accept=".pdf,application/pdf" aria-hidden="true">
`

// Get DOM elements
const elements = {
	// Buttons
	btnOpen: document.getElementById('btn-open') as HTMLButtonElement,
	btnSave: document.getElementById('btn-save') as HTMLButtonElement,
	btnMenu: document.getElementById('btn-menu') as HTMLButtonElement,
	btnPan: document.getElementById('btn-pan') as HTMLButtonElement,
	btnText: document.getElementById('btn-text') as HTMLButtonElement,
	btnDraw: document.getElementById('btn-draw') as HTMLButtonElement,
	btnPrev: document.getElementById('btn-prev') as HTMLButtonElement,
	btnNext: document.getElementById('btn-next') as HTMLButtonElement,
	btnZoomIn: document.getElementById('btn-zoom-in') as HTMLButtonElement,
	btnZoomOut: document.getElementById('btn-zoom-out') as HTMLButtonElement,
	btnFit: document.getElementById('btn-fit') as HTMLButtonElement,
	btnOpenWelcome: document.getElementById('btn-open-welcome') as HTMLButtonElement,
	// Drawing tools
	btnPen: document.getElementById('btn-pen') as HTMLButtonElement,
	btnHighlighter: document.getElementById('btn-highlighter') as HTMLButtonElement,
	btnEraser: document.getElementById('btn-eraser') as HTMLButtonElement,
	btnUndo: document.getElementById('btn-undo') as HTMLButtonElement,
	btnRedo: document.getElementById('btn-redo') as HTMLButtonElement,
	btnClear: document.getElementById('btn-clear') as HTMLButtonElement,
	colorBlack: document.getElementById('color-black') as HTMLButtonElement,
	colorRed: document.getElementById('color-red') as HTMLButtonElement,
	colorBlue: document.getElementById('color-blue') as HTMLButtonElement,
	colorGreen: document.getElementById('color-green') as HTMLButtonElement,
	colorYellow: document.getElementById('color-yellow') as HTMLButtonElement,
	// Inputs
	inputPage: document.getElementById('input-page') as HTMLInputElement,
	fileInput: document.getElementById('file-input') as HTMLInputElement,
	// Displays
	pageCount: document.getElementById('page-count') as HTMLSpanElement,
	zoomValue: document.getElementById('zoom-value') as HTMLSpanElement,
	fileName: document.getElementById('file-name') as HTMLSpanElement,
	statusMode: document.getElementById('status-mode') as HTMLSpanElement,
	saveStatus: document.getElementById('save-status') as HTMLSpanElement,
	saveText: document.getElementById('save-text') as HTMLSpanElement,
	// Containers
	toolbarMenu: document.getElementById('toolbar-menu') as HTMLDivElement,
	viewerContainer: document.getElementById('viewer-container') as HTMLDivElement,
	welcome: document.getElementById('welcome') as HTMLDivElement,
	toast: document.getElementById('toast') as HTMLDivElement,
	drawingTools: document.getElementById('drawing-tools') as HTMLElement,
}

// ============================================================================
// Toast Notifications
// ============================================================================

function showToast(message: string, duration = 3000): void {
	state.toastMessage = message
	elements.toast.textContent = message
	elements.toast.classList.add('visible')
	state.showToast = true

	setTimeout(() => {
		elements.toast.classList.remove('visible')
		state.showToast = false
	}, duration)
}

// ============================================================================
// UI Update Functions
// ============================================================================

function updateModeButtons(mode: EditorMode): void {
	// Update mode buttons
	elements.btnPan.classList.toggle('btn-active', mode === 'pan')
	elements.btnText.classList.toggle('btn-active', mode === 'text')
	elements.btnDraw.classList.toggle('btn-active', mode === 'draw')

	elements.btnPan.setAttribute('aria-checked', String(mode === 'pan'))
	elements.btnText.setAttribute('aria-checked', String(mode === 'text'))
	elements.btnDraw.setAttribute('aria-checked', String(mode === 'draw'))

	// Show/hide drawing tools
	elements.drawingTools.style.display = mode === 'draw' ? '' : 'none'

	// Update status bar
	elements.statusMode.textContent = mode.toUpperCase()

	state.currentMode = mode
}

function updateToolButtons(tool: DrawingTool): void {
	elements.btnPen.classList.toggle('btn-active', tool === 'pen')
	elements.btnHighlighter.classList.toggle('btn-active', tool === 'highlighter')
	elements.btnEraser.classList.toggle('btn-active', tool === 'eraser')

	elements.btnPen.setAttribute('aria-checked', String(tool === 'pen'))
	elements.btnHighlighter.setAttribute('aria-checked', String(tool === 'highlighter'))
	elements.btnEraser.setAttribute('aria-checked', String(tool === 'eraser'))

	state.currentTool = tool
}

function updateColorButtons(colorId: string): void {
	const colorButtons = [
		elements.colorBlack,
		elements.colorRed,
		elements.colorBlue,
		elements.colorGreen,
		elements.colorYellow,
	]
	for (const btn of colorButtons) {
		btn.classList.toggle('color-active', btn.id === colorId)
	}
}

function updatePageInfo(): void {
	if (!state.editor) return

	const currentPage = state.editor.getCurrentPage()
	const pageCount = state.editor.getPageCount()

	elements.inputPage.value = String(currentPage)
	elements.inputPage.max = String(pageCount)
	elements.pageCount.textContent = `/ ${pageCount}`
}

function updateZoomInfo(): void {
	if (!state.editor) return

	const zoom = state.editor.getZoom()
	elements.zoomValue.textContent = `${Math.round(zoom * 100)}%`
}

function updateSaveStatus(): void {
	if (!state.editor) return

	const hasChanges = state.editor.hasUnsavedChanges()
	elements.saveStatus.classList.toggle('unsaved', hasChanges)
	elements.saveText.textContent = hasChanges ? 'Unsaved' : 'Saved'
}

function setControlsEnabled(enabled: boolean): void {
	elements.btnSave.disabled = !enabled
	elements.btnPrev.disabled = !enabled
	elements.btnNext.disabled = !enabled
	elements.inputPage.disabled = !enabled
	elements.btnZoomIn.disabled = !enabled
	elements.btnZoomOut.disabled = !enabled
	elements.btnFit.disabled = !enabled
	elements.btnClear.disabled = !enabled
}

function toggleMenu(): void {
	state.isMenuOpen = !state.isMenuOpen
	elements.toolbarMenu.classList.toggle('is-open', state.isMenuOpen)
	elements.btnMenu.setAttribute('aria-expanded', String(state.isMenuOpen))
}

// ============================================================================
// File Operations
// ============================================================================

async function openFile(): Promise<void> {
	elements.fileInput.click()
}

async function handleFileSelect(e: Event): Promise<void> {
	const input = e.target as HTMLInputElement
	const file = input.files?.[0]

	if (!file) return

	if (!isValidPdfFile(file)) {
		showToast('❌ Please select a valid PDF file')
		return
	}

	await loadPdf(file)
	input.value = '' // Reset for same-file selection
}

async function loadPdf(file: File): Promise<void> {
	try {
		showToast('📄 Loading PDF...')

		if (!state.editor) {
			initializeEditor()
		}

		await state.editor?.load(file)

		// Hide welcome screen
		elements.welcome.style.display = 'none'

		// Update UI
		updatePageInfo()
		updateZoomInfo()

		showToast(`✅ Loaded: ${file.name}`)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		showToast(`❌ Failed to load PDF: ${message}`)
	}
}

async function saveFile(): Promise<void> {
	if (!state.editor) return

	try {
		if (hasFileSystemAccess()) {
			await state.editor.save()
			showToast('✅ File saved')
		} else {
			state.editor.download()
			showToast('✅ File downloaded')
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		showToast(`❌ Save failed: ${message}`)
	}
}

// ============================================================================
// Editor Initialization
// ============================================================================

function initializeEditor(): void {
	// Create page wrapper for the editor
	const pageWrapper = document.createElement('div')
	pageWrapper.className = 'page-wrapper'
	pageWrapper.id = 'editor-container'
	elements.viewerContainer.appendChild(pageWrapper)

	state.editor = createPdfEditor({
		container: pageWrapper,
		initialZoom: DEFAULT_ZOOM,
		initialMode: 'pan',
		onLoad: (fileName, pageCount) => {
			elements.fileName.textContent = fileName
			elements.pageCount.textContent = `/ ${pageCount}`
			elements.inputPage.value = '1'
			elements.inputPage.max = String(pageCount)
			setControlsEnabled(true)
			updateSaveStatus()
		},
		onPageChange: (pageNumber) => {
			elements.inputPage.value = String(pageNumber)
			updateUndoRedoButtons()
		},
		onZoomChange: (zoom) => {
			elements.zoomValue.textContent = `${Math.round(zoom * 100)}%`
		},
		onModeChange: (mode) => {
			updateModeButtons(mode)
		},
		onSave: (success) => {
			if (success) {
				updateSaveStatus()
			}
		},
		onError: (error) => {
			showToast(`❌ Error: ${error.message}`)
		},
	})
}

function updateUndoRedoButtons(): void {
	const drawingLayer = state.editor?.getDrawingLayer()
	if (drawingLayer && state.currentMode === 'draw') {
		elements.btnUndo.disabled = !drawingLayer.canUndo()
		elements.btnRedo.disabled = !drawingLayer.canRedo()
	} else {
		elements.btnUndo.disabled = true
		elements.btnRedo.disabled = true
	}
}

// ============================================================================
// Event Handlers
// ============================================================================

// File operations
elements.btnOpen.addEventListener('click', openFile)
elements.btnOpenWelcome.addEventListener('click', openFile)
elements.btnSave.addEventListener('click', saveFile)
elements.fileInput.addEventListener('change', handleFileSelect)

// Menu toggle
elements.btnMenu.addEventListener('click', toggleMenu)

// Mode switching
elements.btnPan.addEventListener('click', () => {
	state.editor?.setMode('pan')
})

elements.btnText.addEventListener('click', () => {
	state.editor?.setMode('text')
})

elements.btnDraw.addEventListener('click', () => {
	state.editor?.setMode('draw')
	updateUndoRedoButtons()
})

// Navigation
elements.btnPrev.addEventListener('click', () => {
	state.editor?.goToPreviousPage()
})

elements.btnNext.addEventListener('click', () => {
	state.editor?.goToNextPage()
})

elements.inputPage.addEventListener('change', () => {
	const page = parseInt(elements.inputPage.value, 10)
	if (!isNaN(page) && state.editor) {
		state.editor.goToPage(page)
	}
})

// Zoom
elements.btnZoomIn.addEventListener('click', () => {
	state.editor?.zoomIn()
})

elements.btnZoomOut.addEventListener('click', () => {
	state.editor?.zoomOut()
})

elements.btnFit.addEventListener('click', () => {
	state.editor?.fitToWidth()
})

// Drawing tools
elements.btnPen.addEventListener('click', () => {
	updateToolButtons('pen')
	const drawingLayer = state.editor?.getDrawingLayer()
	if (drawingLayer) {
		drawingLayer.setTool('pen')
	}
})

elements.btnHighlighter.addEventListener('click', () => {
	updateToolButtons('highlighter')
	const drawingLayer = state.editor?.getDrawingLayer()
	if (drawingLayer) {
		drawingLayer.setTool('highlighter')
	}
})

elements.btnEraser.addEventListener('click', () => {
	updateToolButtons('eraser')
	const drawingLayer = state.editor?.getDrawingLayer()
	if (drawingLayer) {
		drawingLayer.setTool('eraser')
	}
})

// Color selection - map color button IDs to RGB values
const colorMap: Record<string, { r: number; g: number; b: number }> = {
	'color-black': { r: 0, g: 0, b: 0 },
	'color-red': { r: 0.863, g: 0.149, b: 0.149 }, // #dc2626
	'color-blue': { r: 0.145, g: 0.388, b: 0.922 }, // #2563eb
	'color-green': { r: 0.086, g: 0.639, b: 0.290 }, // #16a34a
	'color-yellow': { r: 0.918, g: 0.702, b: 0.031 }, // #eab308
}

function setDrawingColor(colorId: string): void {
	updateColorButtons(colorId)
	const color = colorMap[colorId]
	if (color) {
		const drawingLayer = state.editor?.getDrawingLayer()
		if (drawingLayer) {
			drawingLayer.setColor(color)
		}
	}
}

elements.colorBlack.addEventListener('click', () => setDrawingColor('color-black'))
elements.colorRed.addEventListener('click', () => setDrawingColor('color-red'))
elements.colorBlue.addEventListener('click', () => setDrawingColor('color-blue'))
elements.colorGreen.addEventListener('click', () => setDrawingColor('color-green'))
elements.colorYellow.addEventListener('click', () => setDrawingColor('color-yellow'))

// Undo/Redo/Clear
elements.btnUndo.addEventListener('click', () => {
	const drawingLayer = state.editor?.getDrawingLayer()
	if (drawingLayer && drawingLayer.canUndo()) {
		drawingLayer.undo()
		showToast('↩️ Undo')
		updateUndoRedoButtons()
	}
})

elements.btnRedo.addEventListener('click', () => {
	const drawingLayer = state.editor?.getDrawingLayer()
	if (drawingLayer && drawingLayer.canRedo()) {
		drawingLayer.redo()
		showToast('↪️ Redo')
		updateUndoRedoButtons()
	}
})

elements.btnClear.addEventListener('click', () => {
	const drawingLayer = state.editor?.getDrawingLayer()
	if (drawingLayer && state.editor) {
		drawingLayer.clearPage(state.editor.getCurrentPage())
		showToast('🗑️ Page cleared')
	}
})

// ============================================================================
// Keyboard Shortcuts
// ============================================================================

document.addEventListener('keydown', (e) => {
	if (!state.editor) return

	// Prevent shortcuts when typing in input
	if (e.target instanceof HTMLInputElement) return

	const isMeta = e.metaKey || e.ctrlKey

	if (isMeta) {
		switch (e.key.toLowerCase()) {
			case 'o':
				e.preventDefault()
				openFile()
				break
			case 's':
				e.preventDefault()
				saveFile()
				break
			case 'z':
				e.preventDefault()
				if (e.shiftKey) {
					// Redo
					showToast('↪️ Redo')
				} else {
					// Undo
					showToast('↩️ Undo')
				}
				break
			case '=':
			case '+':
				e.preventDefault()
				state.editor.zoomIn()
				break
			case '-':
				e.preventDefault()
				state.editor.zoomOut()
				break
			case '0':
				e.preventDefault()
				state.editor.resetZoom()
				break
		}
	} else {
		switch (e.key) {
			case 'ArrowLeft':
			case 'PageUp':
				state.editor.goToPreviousPage()
				break
			case 'ArrowRight':
			case 'PageDown':
				state.editor.goToNextPage()
				break
			case 'Home':
				state.editor.goToPage(1)
				break
			case 'End':
				state.editor.goToPage(state.editor.getPageCount())
				break
			case 'v':
			case 'V':
				state.editor.setMode('pan')
				break
			case 't':
			case 'T':
				state.editor.setMode('text')
				break
			case 'd':
			case 'D':
				state.editor.setMode('draw')
				break
		}
	}
})

// ============================================================================
// Drag and Drop Support
// ============================================================================

elements.viewerContainer.addEventListener('dragover', (e) => {
	e.preventDefault()
	e.dataTransfer!.dropEffect = 'copy'
	elements.viewerContainer.classList.add('drag-over')
})

elements.viewerContainer.addEventListener('dragleave', () => {
	elements.viewerContainer.classList.remove('drag-over')
})

elements.viewerContainer.addEventListener('drop', async(e) => {
	e.preventDefault()
	elements.viewerContainer.classList.remove('drag-over')

	const file = e.dataTransfer?.files[0]
	if (file && isValidPdfFile(file)) {
		await loadPdf(file)
	} else {
		showToast('❌ Please drop a valid PDF file')
	}
})

// ============================================================================
// Touch Gesture Hints
// ============================================================================

let touchStartTime = 0

elements.viewerContainer.addEventListener('touchstart', () => {
	touchStartTime = Date.now()
})

elements.viewerContainer.addEventListener('touchend', () => {
	const touchDuration = Date.now() - touchStartTime

	// Long press hint
	if (touchDuration > 500 && state.currentMode === 'text') {
		showToast('💡 Tip: Select text by tapping and dragging', 2000)
	}
})

// ============================================================================
// Initialize
// ============================================================================

// Show welcome screen
elements.welcome.style.display = ''

// Log startup
// eslint-disable-next-line no-console
console.log('📄 Documenta PDF Editor initialized')
