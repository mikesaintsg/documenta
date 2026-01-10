/**
 * Documenta - Text Layer Implementation
 * @module core/text/TextLayer
 *
 * Provides OCR-based text extraction and inline editing using an overlay strategy.
 * The text layer is rendered as a transparent overlay on top of the PDF canvas,
 * allowing for text selection and inline editing while preserving the original
 * PDF rendering quality.
 */

import * as mupdf from 'mupdf'
import type {
	AnnotationColor,
	Point,
	Rectangle,
	TextBlock,
	TextCharacter,
	TextEdit,
	TextEditCallback,
	TextEditMode,
	TextLayer,
	TextLayerInterface,
	TextLayerOptions,
	TextLine,
	TextSelection,
	TextSelectionCallback,
	Unsubscribe,
} from '../../types.js'
import { generateAnnotationId, mupdfRectToRectangle } from '../../helpers.js'

type ListenerMap<T> = Set<T>

/** Default selection highlight color (semi-transparent blue) */
const DEFAULT_SELECTION_COLOR: AnnotationColor = { r: 0.2, g: 0.5, b: 1.0 }

/**
 * Text Layer implementation for OCR and inline editing
 */
export class TextLayerImpl implements TextLayerInterface {
	#document: mupdf.PDFDocument
	#container: HTMLElement | null = null
	#overlayElement: HTMLDivElement | null = null
	#editInputElement: HTMLTextAreaElement | null = null

	#editMode: TextEditMode = 'none'
	#isVisible = true
	#currentScale = 1
	#currentPageNumber = 0

	#selection: TextSelection | null = null
	#selectionStart: { pageNumber: number; point: Point } | null = null
	#isSelecting = false

	#edits: Map<number, TextEdit[]> = new Map()
	#editHistory: TextEdit[] = []
	#redoStack: TextEdit[] = []
	#currentEdit: {
		pageNumber: number
		bounds: Rectangle
		originalText: string
		fontSize: number
		fontName: string
		color: AnnotationColor
	} | null = null

	#textLayerCache: Map<number, TextLayer> = new Map()
	#selectionColor: AnnotationColor

	// Event listeners
	#textSelectListeners: ListenerMap<TextSelectionCallback> = new Set()
	#textEditListeners: ListenerMap<TextEditCallback> = new Set()

	constructor(document: mupdf.PDFDocument, options: TextLayerOptions = {}) {
		this.#document = document
		this.#selectionColor = options.selectionColor ?? DEFAULT_SELECTION_COLOR

		if (options.onTextSelect) {
			this.#textSelectListeners.add(options.onTextSelect)
		}
		if (options.onTextEdit) {
			this.#textEditListeners.add(options.onTextEdit)
		}
	}

	// =========================================================================
	// Property Accessors
	// =========================================================================

	getEditMode(): TextEditMode {
		return this.#editMode
	}

	getSelection(): TextSelection | null {
		return this.#selection
	}

	getEdits(pageNumber: number): readonly TextEdit[] {
		return this.#edits.get(pageNumber) ?? []
	}

	isVisible(): boolean {
		return this.#isVisible
	}

	// =========================================================================
	// Property Mutators
	// =========================================================================

	setEditMode(mode: TextEditMode): void {
		if (mode !== this.#editMode) {
			// Cancel any in-progress editing
			if (this.#editMode === 'edit' && this.#currentEdit) {
				this.cancelEdit()
			}
			if (this.#editMode === 'select' && this.#selection) {
				this.clearSelection()
			}
			this.#editMode = mode
			this.#updateOverlayCursor()
		}
	}

	setVisible(visible: boolean): void {
		this.#isVisible = visible
		if (this.#overlayElement) {
			this.#overlayElement.style.display = visible ? 'block' : 'none'
		}
	}

	// =========================================================================
	// Text Extraction
	// =========================================================================

	extractTextLayer(pageNumber: number): TextLayer {
		// Check cache first
		const cached = this.#textLayerCache.get(pageNumber)
		if (cached) {
			return cached
		}

		const page = this.#document.loadPage(pageNumber - 1)
		const bounds = page.getBounds()
		const width = bounds[2] - bounds[0]
		const height = bounds[3] - bounds[1]

		const stext = page.toStructuredText()
		const blocks: TextBlock[] = []

		let currentBlock: {
			id: string
			lines: TextLine[]
			bounds: Rectangle
		} | null = null

		let currentLine: {
			id: string
			chars: TextCharacter[]
			bounds: Rectangle
			baseline: number
			direction: Point
			wmode: number
		} | null = null

		stext.walk({
			beginTextBlock: (bbox: mupdf.Rect) => {
				currentBlock = {
					id: generateAnnotationId(),
					lines: [],
					bounds: mupdfRectToRectangle(bbox),
				}
			},

			beginLine: (bbox: mupdf.Rect, wmode: number, direction: mupdf.Point) => {
				currentLine = {
					id: generateAnnotationId(),
					chars: [],
					bounds: mupdfRectToRectangle(bbox),
					baseline: bbox[3],
					direction: { x: direction[0], y: direction[1] },
					wmode,
				}
			},

			onChar: (c: string, origin: mupdf.Point, font: mupdf.Font, size: number, quad: mupdf.Quad, color: mupdf.Color) => {
				if (!currentLine) return

				const charBounds: Rectangle = {
					x: Math.min(quad[0], quad[2], quad[4], quad[6]),
					y: Math.min(quad[1], quad[3], quad[5], quad[7]),
					width: Math.max(quad[0], quad[2], quad[4], quad[6]) - Math.min(quad[0], quad[2], quad[4], quad[6]),
					height: Math.max(quad[1], quad[3], quad[5], quad[7]) - Math.min(quad[1], quad[3], quad[5], quad[7]),
				}

				const charColor: AnnotationColor = color.length >= 3
					? { r: color[0] ?? 0, g: color[1] ?? 0, b: color[2] ?? 0 }
					: { r: 0, g: 0, b: 0 }

				const textChar: TextCharacter = {
					char: c,
					x: charBounds.x,
					y: charBounds.y,
					width: charBounds.width,
					height: charBounds.height,
					fontSize: size,
					fontName: font.getName(),
					color: charColor,
					quad: quad as readonly [number, number, number, number, number, number, number, number],
				}

				currentLine.chars.push(textChar)
			},

			endLine: () => {
				if (currentLine && currentBlock && currentLine.chars.length > 0) {
					currentBlock.lines.push(currentLine as TextLine)
				}
				currentLine = null
			},

			endTextBlock: () => {
				if (currentBlock && currentBlock.lines.length > 0) {
					blocks.push(currentBlock as TextBlock)
				}
				currentBlock = null
			},
		})

		const textLayer: TextLayer = {
			pageNumber,
			blocks,
			width,
			height,
		}

		// Cache the result
		this.#textLayerCache.set(pageNumber, textLayer)

		page.destroy()
		stext.destroy()

		return textLayer
	}

	getPageText(pageNumber: number): string {
		const page = this.#document.loadPage(pageNumber - 1)
		const stext = page.toStructuredText()
		const text = stext.asText()

		page.destroy()
		stext.destroy()

		return text
	}

	searchText(pageNumber: number, query: string): readonly Rectangle[] {
		const page = this.#document.loadPage(pageNumber - 1)
		const stext = page.toStructuredText()
		const quads = stext.search(query)

		const results: Rectangle[] = []
		for (const quadGroup of quads) {
			for (const quad of quadGroup) {
				results.push({
					x: Math.min(quad[0], quad[2], quad[4], quad[6]),
					y: Math.min(quad[1], quad[3], quad[5], quad[7]),
					width: Math.max(quad[0], quad[2], quad[4], quad[6]) - Math.min(quad[0], quad[2], quad[4], quad[6]),
					height: Math.max(quad[1], quad[3], quad[5], quad[7]) - Math.min(quad[1], quad[3], quad[5], quad[7]),
				})
			}
		}

		page.destroy()
		stext.destroy()

		return results
	}

	// =========================================================================
	// Text Selection
	// =========================================================================

	startSelection(pageNumber: number, point: Point): void {
		if (this.#editMode !== 'select') return

		this.#selectionStart = { pageNumber, point }
		this.#isSelecting = true
		this.#selection = null
		this.#renderSelectionHighlight()
	}

	extendSelection(point: Point): void {
		if (!this.#isSelecting || !this.#selectionStart) return

		const textLayer = this.extractTextLayer(this.#selectionStart.pageNumber)
		const selection = this.#computeSelection(
			textLayer,
			this.#selectionStart.point,
			point,
		)

		if (selection) {
			this.#selection = selection
			this.#emitTextSelect(selection)
			this.#renderSelectionHighlight()
		}
	}

	endSelection(): void {
		this.#isSelecting = false
		this.#selectionStart = null
	}

	clearSelection(): void {
		this.#selection = null
		this.#isSelecting = false
		this.#selectionStart = null
		this.#emitTextSelect(null)
		this.#renderSelectionHighlight()
	}

	async copySelection(): Promise<void> {
		if (!this.#selection) return

		try {
			await navigator.clipboard.writeText(this.#selection.selectedText)
		} catch {
			// Fallback for browsers that don't support clipboard API
			const textarea = document.createElement('textarea')
			textarea.value = this.#selection.selectedText
			textarea.style.position = 'fixed'
			textarea.style.opacity = '0'
			document.body.appendChild(textarea)
			textarea.select()
			document.execCommand('copy')
			document.body.removeChild(textarea)
		}
	}

	// =========================================================================
	// Inline Editing
	// =========================================================================

	startEditing(pageNumber: number, point: Point): void {
		if (this.#editMode !== 'edit') return

		const textLayer = this.extractTextLayer(pageNumber)
		const charInfo = this.#findCharacterAtPoint(textLayer, point)

		if (!charInfo) return

		const { line, charIndex } = charInfo

		// Find the word or text span around the clicked character
		const span = this.#findTextSpan(line, charIndex)

		this.#currentEdit = {
			pageNumber,
			bounds: span.bounds,
			originalText: span.text,
			fontSize: span.fontSize,
			fontName: span.fontName,
			color: span.color,
		}

		this.#showEditInput()
	}

	applyEdit(): void {
		if (!this.#currentEdit || !this.#editInputElement) return

		const newText = this.#editInputElement.value
		if (newText === this.#currentEdit.originalText) {
			this.cancelEdit()
			return
		}

		const edit: TextEdit = {
			id: generateAnnotationId(),
			pageNumber: this.#currentEdit.pageNumber,
			originalText: this.#currentEdit.originalText,
			newText,
			bounds: this.#currentEdit.bounds,
			fontSize: this.#currentEdit.fontSize,
			fontName: this.#currentEdit.fontName,
			color: this.#currentEdit.color,
			timestamp: new Date(),
		}

		// Add to edits
		const pageEdits = this.#edits.get(edit.pageNumber) ?? []
		pageEdits.push(edit)
		this.#edits.set(edit.pageNumber, pageEdits)

		// Add to history
		this.#editHistory.push(edit)
		this.#redoStack = []

		// Apply the edit to the PDF (add FreeText annotation with redaction)
		this.#applyEditToPdf(edit)

		// Invalidate cache
		this.#textLayerCache.delete(edit.pageNumber)

		this.#emitTextEdit(edit)
		this.#hideEditInput()
		this.#currentEdit = null

		// Re-render the overlay
		if (this.#container) {
			this.render(this.#currentPageNumber, this.#container, this.#currentScale)
		}
	}

	cancelEdit(): void {
		this.#hideEditInput()
		this.#currentEdit = null
	}

	undoEdit(): void {
		const lastEdit = this.#editHistory.pop()
		if (!lastEdit) return

		// Remove from page edits
		const pageEdits = this.#edits.get(lastEdit.pageNumber)
		if (pageEdits) {
			const index = pageEdits.findIndex(e => e.id === lastEdit.id)
			if (index !== -1) {
				pageEdits.splice(index, 1)
			}
		}

		// Add to redo stack
		this.#redoStack.push(lastEdit)

		// Note: Full undo would require re-rendering the PDF
		// For now, we track the edit history
		this.#textLayerCache.delete(lastEdit.pageNumber)
	}

	redoEdit(): void {
		const edit = this.#redoStack.pop()
		if (!edit) return

		const pageEdits = this.#edits.get(edit.pageNumber) ?? []
		pageEdits.push(edit)
		this.#edits.set(edit.pageNumber, pageEdits)

		this.#editHistory.push(edit)
		this.#applyEditToPdf(edit)
		this.#textLayerCache.delete(edit.pageNumber)
	}

	// =========================================================================
	// Rendering
	// =========================================================================

	render(pageNumber: number, container: HTMLElement, scale: number): void {
		this.#container = container
		this.#currentScale = scale
		this.#currentPageNumber = pageNumber

		// Create or update the overlay element
		if (!this.#overlayElement) {
			this.#overlayElement = this.#createOverlayElement()
			container.appendChild(this.#overlayElement)
		}

		// Position the overlay
		const textLayer = this.extractTextLayer(pageNumber)
		this.#overlayElement.style.width = `${textLayer.width * scale}px`
		this.#overlayElement.style.height = `${textLayer.height * scale}px`
		this.#overlayElement.style.display = this.#isVisible ? 'block' : 'none'

		// Render text spans for selection/editing
		this.#renderTextSpans(textLayer, scale)

		// Render any pending edits
		this.#renderEdits(pageNumber, scale)

		// Update selection highlight if any
		this.#renderSelectionHighlight()
	}

	update(scale: number): void {
		this.#currentScale = scale
		if (this.#container && this.#currentPageNumber > 0) {
			this.render(this.#currentPageNumber, this.#container, scale)
		}
	}

	// =========================================================================
	// Event Subscriptions
	// =========================================================================

	onTextSelect(callback: TextSelectionCallback): Unsubscribe {
		this.#textSelectListeners.add(callback)
		return () => this.#textSelectListeners.delete(callback)
	}

	onTextEdit(callback: TextEditCallback): Unsubscribe {
		this.#textEditListeners.add(callback)
		return () => this.#textEditListeners.delete(callback)
	}

	// =========================================================================
	// Lifecycle
	// =========================================================================

	destroy(): void {
		if (this.#overlayElement && this.#overlayElement.parentNode) {
			this.#overlayElement.parentNode.removeChild(this.#overlayElement)
		}
		if (this.#editInputElement && this.#editInputElement.parentNode) {
			this.#editInputElement.parentNode.removeChild(this.#editInputElement)
		}

		this.#overlayElement = null
		this.#editInputElement = null
		this.#container = null
		this.#selection = null
		this.#currentEdit = null
		this.#textLayerCache.clear()
		this.#edits.clear()
		this.#editHistory = []
		this.#redoStack = []
		this.#textSelectListeners.clear()
		this.#textEditListeners.clear()
	}

	// =========================================================================
	// Private Methods
	// =========================================================================

	#createOverlayElement(): HTMLDivElement {
		const overlay = document.createElement('div')
		overlay.className = 'documenta-text-layer'
		overlay.style.cssText = `
			position: absolute;
			top: 0;
			left: 0;
			pointer-events: auto;
			user-select: none;
			z-index: 10;
			touch-action: none;
		`

		// Use unified pointer events for mobile/desktop compatibility
		overlay.addEventListener('pointerdown', this.#handlePointerDown.bind(this))
		overlay.addEventListener('pointermove', this.#handlePointerMove.bind(this))
		overlay.addEventListener('pointerup', this.#handlePointerUp.bind(this))
		overlay.addEventListener('pointercancel', this.#handlePointerUp.bind(this))

		// Double-tap/click for editing
		let lastTapTime = 0
		overlay.addEventListener('pointerup', (e: PointerEvent) => {
			if (!e.isPrimary) return
			const now = Date.now()
			if (now - lastTapTime < 300) {
				// Double-tap detected
				this.#handleDoubleTap(e)
			}
			lastTapTime = now
		})

		return overlay
	}

	#updateOverlayCursor(): void {
		if (!this.#overlayElement) return

		switch (this.#editMode) {
			case 'select':
				this.#overlayElement.style.cursor = 'text'
				break
			case 'edit':
				this.#overlayElement.style.cursor = 'pointer'
				break
			default:
				this.#overlayElement.style.cursor = 'default'
		}
	}

	#renderTextSpans(textLayer: TextLayer, scale: number): void {
		if (!this.#overlayElement) return

		// Clear existing spans (except selection highlight and edit patches)
		const existingSpans = this.#overlayElement.querySelectorAll('.text-span')
		existingSpans.forEach(span => span.remove())

		// Create invisible spans for each character to enable selection
		for (const block of textLayer.blocks) {
			for (const line of block.lines) {
				for (const char of line.chars) {
					const span = document.createElement('span')
					span.className = 'text-span'
					span.dataset.char = char.char
					span.style.cssText = `
						position: absolute;
						left: ${char.x * scale}px;
						top: ${char.y * scale}px;
						width: ${char.width * scale}px;
						height: ${char.height * scale}px;
						font-size: ${char.fontSize * scale}px;
						line-height: ${char.height * scale}px;
						color: transparent;
						pointer-events: none;
					`
					this.#overlayElement.appendChild(span)
				}
			}
		}
	}

	#renderSelectionHighlight(): void {
		if (!this.#overlayElement) return

		// Remove existing highlight
		const existingHighlight = this.#overlayElement.querySelector('.selection-highlight')
		if (existingHighlight) {
			existingHighlight.remove()
		}

		if (!this.#selection || this.#selection.bounds.length === 0) return

		const highlightContainer = document.createElement('div')
		highlightContainer.className = 'selection-highlight'
		highlightContainer.style.cssText = `
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			pointer-events: none;
		`

		for (const rect of this.#selection.bounds) {
			const highlight = document.createElement('div')
			highlight.style.cssText = `
				position: absolute;
				left: ${rect.x * this.#currentScale}px;
				top: ${rect.y * this.#currentScale}px;
				width: ${rect.width * this.#currentScale}px;
				height: ${rect.height * this.#currentScale}px;
				background-color: rgba(${this.#selectionColor.r * 255}, ${this.#selectionColor.g * 255}, ${this.#selectionColor.b * 255}, 0.3);
				mix-blend-mode: multiply;
			`
			highlightContainer.appendChild(highlight)
		}

		this.#overlayElement.appendChild(highlightContainer)
	}

	#renderEdits(pageNumber: number, scale: number): void {
		if (!this.#overlayElement) return

		// Remove existing edit patches
		const existingPatches = this.#overlayElement.querySelectorAll('.edit-patch')
		existingPatches.forEach(patch => patch.remove())

		const edits = this.#edits.get(pageNumber) ?? []

		for (const edit of edits) {
			const patch = document.createElement('div')
			patch.className = 'edit-patch'
			patch.style.cssText = `
				position: absolute;
				left: ${edit.bounds.x * scale}px;
				top: ${edit.bounds.y * scale}px;
				min-width: ${edit.bounds.width * scale}px;
				height: ${edit.bounds.height * scale}px;
				background-color: white;
				color: rgb(${edit.color.r * 255}, ${edit.color.g * 255}, ${edit.color.b * 255});
				font-size: ${edit.fontSize * scale}px;
				font-family: ${edit.fontName}, sans-serif;
				line-height: ${edit.bounds.height * scale}px;
				white-space: nowrap;
				overflow: visible;
				pointer-events: none;
			`
			patch.textContent = edit.newText
			this.#overlayElement.appendChild(patch)
		}
	}

	#showEditInput(): void {
		if (!this.#currentEdit || !this.#overlayElement) return

		if (!this.#editInputElement) {
			this.#editInputElement = document.createElement('textarea')
			this.#editInputElement.className = 'edit-input'
			this.#editInputElement.style.cssText = `
				position: absolute;
				border: 2px solid #2563eb;
				border-radius: 2px;
				padding: 2px;
				outline: none;
				resize: none;
				overflow: hidden;
				z-index: 100;
			`

			this.#editInputElement.addEventListener('keydown', (e) => {
				if (e.key === 'Enter' && !e.shiftKey) {
					e.preventDefault()
					this.applyEdit()
				} else if (e.key === 'Escape') {
					this.cancelEdit()
				}
			})

			this.#editInputElement.addEventListener('blur', () => {
				// Small delay to allow button clicks
				setTimeout(() => {
					if (this.#currentEdit) {
						this.applyEdit()
					}
				}, 100)
			})
		}

		const { bounds, fontSize, fontName, color, originalText } = this.#currentEdit
		const scale = this.#currentScale

		this.#editInputElement.style.left = `${bounds.x * scale}px`
		this.#editInputElement.style.top = `${bounds.y * scale}px`
		this.#editInputElement.style.width = `${Math.max(bounds.width * scale, 100)}px`
		this.#editInputElement.style.height = `${bounds.height * scale}px`
		this.#editInputElement.style.fontSize = `${fontSize * scale}px`
		this.#editInputElement.style.fontFamily = `${fontName}, sans-serif`
		this.#editInputElement.style.color = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`
		this.#editInputElement.style.backgroundColor = 'white'
		this.#editInputElement.value = originalText

		this.#overlayElement.appendChild(this.#editInputElement)
		this.#editInputElement.focus()
		this.#editInputElement.select()
	}

	#hideEditInput(): void {
		if (this.#editInputElement && this.#editInputElement.parentNode) {
			this.#editInputElement.parentNode.removeChild(this.#editInputElement)
		}
	}

	#handlePointerDown(e: PointerEvent): void {
		if (!e.isPrimary) return
		if (this.#editMode !== 'select') return

		e.preventDefault()

		// Capture pointer for reliable tracking
		if (this.#overlayElement) {
			this.#overlayElement.setPointerCapture(e.pointerId)
		}

		const point = this.#getPointFromPointer(e)
		this.startSelection(this.#currentPageNumber, point)
	}

	#handlePointerMove(e: PointerEvent): void {
		if (!e.isPrimary) return
		if (!this.#isSelecting) return

		const point = this.#getPointFromPointer(e)
		this.extendSelection(point)
	}

	#handlePointerUp(e: PointerEvent): void {
		if (!e.isPrimary) return

		// Release pointer capture
		if (this.#overlayElement && e.pointerId !== undefined) {
			try {
				this.#overlayElement.releasePointerCapture(e.pointerId)
			} catch {
				// Ignore if pointer is not captured
			}
		}

		if (this.#isSelecting) {
			this.endSelection()
		}
	}

	#handleDoubleTap(e: PointerEvent): void {
		if (this.#editMode === 'edit') {
			const point = this.#getPointFromPointer(e)
			this.startEditing(this.#currentPageNumber, point)
		} else if (this.#editMode === 'select') {
			// Double-tap to select word
			const point = this.#getPointFromPointer(e)
			this.#selectWordAtPoint(point)
		}
	}

	#getPointFromPointer(e: PointerEvent): Point {
		const rect = this.#overlayElement?.getBoundingClientRect()
		if (!rect) return { x: 0, y: 0 }

		return {
			x: (e.clientX - rect.left) / this.#currentScale,
			y: (e.clientY - rect.top) / this.#currentScale,
		}
	}

	// Legacy method kept for compatibility
	#getPointFromEvent(e: MouseEvent): Point {
		const rect = this.#overlayElement?.getBoundingClientRect()
		if (!rect) return { x: 0, y: 0 }

		return {
			x: (e.clientX - rect.left) / this.#currentScale,
			y: (e.clientY - rect.top) / this.#currentScale,
		}
	}

	#findCharacterAtPoint(textLayer: TextLayer, point: Point): { block: TextBlock; line: TextLine; charIndex: number } | null {
		for (const block of textLayer.blocks) {
			if (!this.#isPointInRect(point, block.bounds)) continue

			for (const line of block.lines) {
				if (!this.#isPointInRect(point, line.bounds)) continue

				for (let i = 0; i < line.chars.length; i++) {
					const char = line.chars[i]
					if (!char) continue
					if (this.#isPointInRect(point, { x: char.x, y: char.y, width: char.width, height: char.height })) {
						return { block, line, charIndex: i }
					}
				}
			}
		}
		return null
	}

	#findTextSpan(line: TextLine, _charIndex: number): {
		text: string
		bounds: Rectangle
		fontSize: number
		fontName: string
		color: AnnotationColor
	} {
		const chars = line.chars

		// Return the entire line for editing (not just the clicked word)
		if (chars.length === 0) {
			return {
				text: '',
				bounds: line.bounds,
				fontSize: 12,
				fontName: 'Helvetica',
				color: { r: 0, g: 0, b: 0 },
			}
		}

		const firstChar = chars[0]
		const lastChar = chars[chars.length - 1]
		const text = chars.map(c => c.char).join('')

		if (!firstChar || !lastChar) {
			return {
				text: '',
				bounds: line.bounds,
				fontSize: 12,
				fontName: 'Helvetica',
				color: { r: 0, g: 0, b: 0 },
			}
		}

		const bounds: Rectangle = {
			x: firstChar.x,
			y: Math.min(...chars.map(c => c.y)),
			width: (lastChar.x + lastChar.width) - firstChar.x,
			height: Math.max(...chars.map(c => c.height)),
		}

		return {
			text,
			bounds,
			fontSize: firstChar.fontSize,
			fontName: firstChar.fontName,
			color: firstChar.color,
		}
	}

	#selectWordAtPoint(point: Point): void {
		const textLayer = this.extractTextLayer(this.#currentPageNumber)
		const charInfo = this.#findCharacterAtPoint(textLayer, point)

		if (!charInfo) return

		const { block, line, charIndex } = charInfo
		const span = this.#findTextSpan(line, charIndex)

		this.#selection = {
			startBlockId: block.id,
			startLineId: line.id,
			startCharIndex: charIndex,
			endBlockId: block.id,
			endLineId: line.id,
			endCharIndex: charIndex,
			selectedText: span.text,
			bounds: [span.bounds],
		}

		this.#emitTextSelect(this.#selection)
		this.#renderSelectionHighlight()
	}

	#computeSelection(textLayer: TextLayer, start: Point, end: Point): TextSelection | null {
		const startInfo = this.#findCharacterAtPoint(textLayer, start)
		const endInfo = this.#findCharacterAtPoint(textLayer, end)

		if (!startInfo || !endInfo) return null

		// Collect all characters between start and end
		const selectedChars: TextCharacter[] = []
		let inSelection = false
		let startBlockId = ''
		let startLineId = ''
		let startCharIndex = 0
		let endBlockId = ''
		let endLineId = ''
		let endCharIndex = 0

		for (const block of textLayer.blocks) {
			for (const line of block.lines) {
				for (let i = 0; i < line.chars.length; i++) {
					const isStart = block.id === startInfo.block.id &&
						line.id === startInfo.line.id &&
						i === startInfo.charIndex
					const isEnd = block.id === endInfo.block.id &&
						line.id === endInfo.line.id &&
						i === endInfo.charIndex

					if (isStart) {
						inSelection = true
						startBlockId = block.id
						startLineId = line.id
						startCharIndex = i
					}

					const char = line.chars[i]
					if (inSelection && char) {
						selectedChars.push(char)
					}

					if (isEnd) {
						inSelection = false
						endBlockId = block.id
						endLineId = line.id
						endCharIndex = i
					}
				}
			}
		}

		if (selectedChars.length === 0) return null

		// Compute bounds for each line segment
		const bounds: Rectangle[] = []
		if (selectedChars.length > 0) {
			let currentBounds: Rectangle | null = null

			for (const char of selectedChars) {
				if (!currentBounds) {
					currentBounds = { x: char.x, y: char.y, width: char.width, height: char.height }
				} else if (Math.abs(char.y - currentBounds.y) < 5) {
					// Same line, extend bounds
					currentBounds = {
						x: currentBounds.x,
						y: currentBounds.y,
						width: (char.x + char.width) - currentBounds.x,
						height: Math.max(currentBounds.height, char.height),
					}
				} else {
					// New line
					bounds.push(currentBounds)
					currentBounds = { x: char.x, y: char.y, width: char.width, height: char.height }
				}
			}

			if (currentBounds) {
				bounds.push(currentBounds)
			}
		}

		return {
			startBlockId,
			startLineId,
			startCharIndex,
			endBlockId,
			endLineId,
			endCharIndex,
			selectedText: selectedChars.map(c => c.char).join(''),
			bounds,
		}
	}

	#isPointInRect(point: Point, rect: Rectangle): boolean {
		return (
			point.x >= rect.x &&
			point.x <= rect.x + rect.width &&
			point.y >= rect.y &&
			point.y <= rect.y + rect.height
		)
	}

	#applyEditToPdf(edit: TextEdit): void {
		// Add a FreeText annotation to overlay the edited text
		// First, we redact the original area and then add the new text

		const page = this.#document.loadPage(edit.pageNumber - 1)

		// Create a FreeText annotation for the new text
		const annot = page.createAnnotation('FreeText')
		const rect: [number, number, number, number] = [
			edit.bounds.x,
			edit.bounds.y,
			edit.bounds.x + Math.max(edit.bounds.width, edit.newText.length * edit.fontSize * 0.6),
			edit.bounds.y + edit.bounds.height,
		]
		annot.setRect(rect)
		annot.setContents(edit.newText)
		annot.setDefaultAppearance(
			'Helv',
			edit.fontSize,
			[edit.color.r, edit.color.g, edit.color.b],
		)

		// Set background color to white to cover original text
		annot.setColor([1, 1, 1])
		annot.update()

		page.destroy()
	}

	// =========================================================================
	// Event Emitters
	// =========================================================================

	#emitTextSelect(selection: TextSelection | null): void {
		for (const callback of this.#textSelectListeners) {
			callback(selection)
		}
	}

	#emitTextEdit(edit: TextEdit): void {
		for (const callback of this.#textEditListeners) {
			callback(edit)
		}
	}
}
