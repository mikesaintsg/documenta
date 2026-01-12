/**
 * CanvasLayer - PDF page rendering layer
 * @module core/layers/CanvasLayer
 *
 * Renders PDF pages to an HTML canvas with proper scaling and DPI handling.
 */

import type {
	CanvasLayerInterface,
	PdfDocumentInterface,
} from '../../types.js'
import { Z_INDEX_CANVAS, CSS_CLASSES, MAX_CANVAS_DIMENSION } from '../../constants.js'
import { configureCanvasForHighDpi, getDevicePixelRatio, clamp } from '../../helpers.js'

/**
 * CanvasLayer - Renders PDF pages to canvas
 *
 * @remarks
 * Handles devicePixelRatio for crisp rendering on high-DPI displays.
 * Manages canvas sizing and page rendering.
 */
export class CanvasLayer implements CanvasLayerInterface {
	readonly zIndex = Z_INDEX_CANVAS

	#canvas: HTMLCanvasElement
	#ctx: CanvasRenderingContext2D
	#container: HTMLElement
	#document: PdfDocumentInterface | undefined
	#active = false
	#currentPage = 0
	#currentScale = 1

	constructor(container: HTMLElement) {
		this.#container = container
		this.#canvas = document.createElement('canvas')
		this.#canvas.className = CSS_CLASSES.CANVAS_LAYER
		this.#canvas.style.position = 'absolute'
		this.#canvas.style.left = '0'
		this.#canvas.style.top = '0'
		this.#canvas.style.zIndex = String(this.zIndex)
		this.#canvas.style.pointerEvents = 'none'

		const ctx = this.#canvas.getContext('2d')
		if (!ctx) {
			throw new Error('Failed to get 2D canvas context')
		}
		this.#ctx = ctx

		container.appendChild(this.#canvas)
	}

	getCanvas(): HTMLCanvasElement {
		return this.#canvas
	}

	setDocument(doc: PdfDocumentInterface): void {
		this.#document = doc
	}

	isActive(): boolean {
		return this.#active
	}

	activate(): void {
		this.#active = true
	}

	deactivate(): void {
		this.#active = false
	}

	render(pageNumber: number, scale: number): void {
		if (!this.#document || !this.#document.isLoaded()) {
			return
		}

		const pageCount = this.#document.getPageCount()
		if (pageNumber < 1 || pageNumber > pageCount) {
			return
		}

		this.#currentPage = pageNumber
		this.#currentScale = scale

		const page = this.#document.getPage(pageNumber)
		const dpr = getDevicePixelRatio()

		// Calculate scaled dimensions
		const scaledWidth = Math.round(page.width * scale)
		const scaledHeight = Math.round(page.height * scale)

		// Clamp to max canvas dimension for mobile GPU limits
		const maxDim = MAX_CANVAS_DIMENSION / dpr
		const effectiveWidth = clamp(scaledWidth, 1, maxDim)
		const effectiveHeight = clamp(scaledHeight, 1, maxDim)

		// Calculate effective scale if we had to clamp
		const effectiveScale = Math.min(
			scale,
			scale * (effectiveWidth / scaledWidth),
			scale * (effectiveHeight / scaledHeight),
		)

		// Configure canvas for high DPI
		configureCanvasForHighDpi(this.#canvas, effectiveWidth, effectiveHeight)

		// Update container dimensions to match canvas
		this.#container.style.width = `${effectiveWidth}px`
		this.#container.style.height = `${effectiveHeight}px`

		// Clear canvas
		this.#ctx.clearRect(0, 0, effectiveWidth, effectiveHeight)

		// Render page at the effective scale
		page.render(this.#ctx, effectiveScale * dpr)
	}

	resize(_width: number, _height: number): void {
		// Re-render at current page/scale if we have a document
		if (this.#document && this.#currentPage > 0) {
			this.render(this.#currentPage, this.#currentScale)
		}
	}

	destroy(): void {
		this.#canvas.remove()
		this.#document = undefined
	}
}
