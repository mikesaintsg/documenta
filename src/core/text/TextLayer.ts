/**
 * TextLayer - Text selection and extraction layer
 * @module core/text/TextLayer
 *
 * Provides text selection overlay using invisible text spans.
 */

import type {
	TextLayerInterface,
	TextBlock,
	TextSelection,
	TextSelectionCallback,
	TextEditCallback,
	SearchMatch,
	Point,
	PdfDocumentInterface,
	Unsubscribe,
	CoordinateTransformInterface,
} from '../../types.js'
import { BaseLayer } from '../layers/BaseLayer.js'
import {
	Z_INDEX_TEXT,
	CSS_CLASSES,
	TEXT_SELECTION_OPACITY,
	TEXT_SELECTION_COLOR,
} from '../../constants.js'
import { colorToCss } from '../../helpers.js'

/**
 * TextLayer - Text selection and extraction
 *
 * @remarks
 * Uses invisible text spans positioned over the canvas to enable
 * native browser text selection.
 */
export class TextLayer extends BaseLayer implements TextLayerInterface {
	#document: PdfDocumentInterface | undefined
	#transform: CoordinateTransformInterface | undefined
	#currentPage = 0
	#currentScale = 1

	#selectionListeners = new Set<TextSelectionCallback>()
	#textSpans = new Map<string, HTMLSpanElement>()

	constructor(parent: HTMLElement) {
		super(parent, Z_INDEX_TEXT, CSS_CLASSES.TEXT_LAYER)

		// Setup overlay styles
		const container = this.getContainer()
		container.style.overflow = 'hidden'
		container.style.userSelect = 'text'
		container.style.cursor = 'text'

		// Selection highlight color via CSS variable
		const selectionColor = colorToCss(TEXT_SELECTION_COLOR, TEXT_SELECTION_OPACITY)
		container.style.setProperty('--selection-color', selectionColor)

		// Add selection change listener
		document.addEventListener('selectionchange', this.#handleSelectionChange)
	}

	setDocument(doc: PdfDocumentInterface): void {
		this.#document = doc
	}

	setTransform(transform: CoordinateTransformInterface): void {
		this.#transform = transform
	}

	getPlainText(pageNumber: number): string {
		if (!this.#document || !this.#document.isLoaded()) {
			return ''
		}
		const page = this.#document.getPage(pageNumber)
		return page.getText()
	}

	getTextBlocks(pageNumber: number): readonly TextBlock[] {
		if (!this.#document || !this.#document.isLoaded()) {
			return []
		}
		const page = this.#document.getPage(pageNumber)
		return page.getTextBlocks()
	}

	getSelection(): TextSelection | null {
		const selection = document.getSelection()
		if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
			return null
		}

		const container = this.getContainer()
		const range = selection.getRangeAt(0)

		// Check if selection is within our container
		if (!container.contains(range.commonAncestorContainer)) {
			return null
		}

		const text = selection.toString()
		if (!text) {
			return null
		}

		// Get selection bounds
		const rects = range.getClientRects()
		const bounds = Array.from(rects).map(rect => ({
			x: rect.left,
			y: rect.top,
			width: rect.width,
			height: rect.height,
		}))

		return {
			pageNumber: this.#currentPage,
			startIndex: 0, // TODO: Calculate actual index
			endIndex: text.length,
			text,
			bounds,
		}
	}

	clearSelection(): void {
		const selection = document.getSelection()
		if (selection) {
			selection.removeAllRanges()
		}
	}

	async copySelection(): Promise<void> {
		const selection = this.getSelection()
		if (selection && selection.text) {
			await navigator.clipboard.writeText(selection.text)
		}
	}

	onSelectionChange(callback: TextSelectionCallback): Unsubscribe {
		this.#selectionListeners.add(callback)
		return () => this.#selectionListeners.delete(callback)
	}

	search(query: string): readonly SearchMatch[] {
		if (!this.#document || !this.#document.isLoaded() || !query) {
			return []
		}

		const matches: SearchMatch[] = []
		const pageCount = this.#document.getPageCount()

		for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
			const pageMatches = this.searchPage(pageNum, query)
			matches.push(...pageMatches)
		}

		return matches
	}

	searchPage(pageNumber: number, query: string): readonly SearchMatch[] {
		if (!this.#document || !this.#document.isLoaded() || !query) {
			return []
		}

		const text = this.getPlainText(pageNumber).toLowerCase()
		const lowerQuery = query.toLowerCase()
		const matches: SearchMatch[] = []

		let index = 0
		while ((index = text.indexOf(lowerQuery, index)) !== -1) {
			// TODO: Calculate precise bounds using text blocks
			matches.push({
				pageNumber,
				text: query,
				bounds: { x: 0, y: 0, width: 0, height: 0 }, // Placeholder
			})
			index += query.length
		}

		return matches
	}

	// =========================================================================
	// Text Editing (deferred to Phase 6 - creates FreeText annotations)
	// =========================================================================

	startEditing(_pageNumber: number, _point: Point): void {
		// TODO: Implement in Phase 6
	}

	applyEdit(): void {
		// TODO: Implement in Phase 6
	}

	cancelEdit(): void {
		// TODO: Implement in Phase 6
	}

	undoEdit(): void {
		// TODO: Implement in Phase 6
	}

	redoEdit(): void {
		// TODO: Implement in Phase 6
	}

	onEdit(_callback: TextEditCallback): Unsubscribe {
		// TODO: Implement in Phase 6
		return () => {}
	}

	protected onRender(pageNumber: number, scale: number): void {
		this.#currentPage = pageNumber
		this.#currentScale = scale
		this.#renderTextOverlay()
	}

	protected onResize(_width: number, _height: number): void {
		// Re-render text overlay on resize
		if (this.#currentPage > 0) {
			this.#renderTextOverlay()
		}
	}

	protected onActivate(): void {
		const container = this.getContainer()
		container.style.cursor = 'text'
	}

	protected onDeactivate(): void {
		this.clearSelection()
		const container = this.getContainer()
		container.style.cursor = 'default'
	}

	protected onDestroy(): void {
		document.removeEventListener('selectionchange', this.#handleSelectionChange)
		this.#selectionListeners.clear()
		this.#textSpans.clear()
	}

	#renderTextOverlay(): void {
		const container = this.getContainer()

		// Clear existing text spans
		container.innerHTML = ''
		this.#textSpans.clear()

		if (!this.#document || !this.#document.isLoaded()) {
			return
		}

		const blocks = this.getTextBlocks(this.#currentPage)

		// Create text spans for each character
		for (const block of blocks) {
			for (const line of block.lines) {
				const lineDiv = document.createElement('div')
				lineDiv.className = CSS_CLASSES.TEXT_LINE
				lineDiv.style.position = 'absolute'
				lineDiv.style.whiteSpace = 'pre'
				lineDiv.style.color = 'transparent'
				lineDiv.style.fontSize = '0'

				for (const char of line.characters) {
					const span = document.createElement('span')
					span.className = CSS_CLASSES.TEXT_SPAN
					span.textContent = char.char
					span.style.position = 'absolute'
					span.style.left = `${char.bounds.x * this.#currentScale}px`
					span.style.top = `${char.bounds.y * this.#currentScale}px`
					span.style.width = `${char.bounds.width * this.#currentScale}px`
					span.style.height = `${char.bounds.height * this.#currentScale}px`
					span.style.fontSize = `${char.fontSize * this.#currentScale}px`
					span.style.lineHeight = `${char.bounds.height * this.#currentScale}px`
					span.style.fontFamily = char.fontName || 'sans-serif'
					span.style.color = 'transparent'
					span.style.overflow = 'hidden'

					container.appendChild(span)
				}
			}
		}
	}

	#handleSelectionChange = (): void => {
		const selection = this.getSelection()
		for (const listener of this.#selectionListeners) {
			listener(selection)
		}
	}
}
