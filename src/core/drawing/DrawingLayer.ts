/**
 * Documenta - Drawing Layer Implementation
 * @module core/drawing/DrawingLayer
 *
 * Provides freehand drawing capabilities with pen, highlighter, and eraser tools.
 * Uses a separate transparent overlay canvas to avoid coordinate issues with PDF rendering.
 */

import * as mupdf from 'mupdf'
import type {
	AnnotationColor,
	DrawingLayerInterface,
	DrawingLayerOptions,
	DrawingState,
	DrawingStroke,
	DrawingStrokeCallback,
	DrawingTool,
	Point,
	Unsubscribe,
} from '../../types.js'
import { generateAnnotationId, colorToMupdfArray, distanceSquared } from '../../helpers.js'
import {
	COLOR_BLACK,
	COLOR_YELLOW,
	DEFAULT_PEN_WIDTH,
	DEFAULT_HIGHLIGHTER_WIDTH,
	DEFAULT_HIGHLIGHTER_OPACITY,
} from '../../constants.js'

type ListenerMap<T> = Set<T>

/**
 * Drawing Layer implementation for freehand annotations
 * Uses a separate overlay canvas for drawing to prevent coordinate issues
 */
export class DrawingLayerImpl implements DrawingLayerInterface {
	#document: mupdf.PDFDocument
	#isActive = false
	#currentTool: DrawingTool = 'pen'
	#strokeColor: AnnotationColor = COLOR_BLACK
	#strokeWidth: number = DEFAULT_PEN_WIDTH
	#opacity = 1.0

	// Current stroke being drawn
	#currentStroke: Point[] = []
	#isDrawing = false

	// Stored strokes by page
	#strokes: Map<number, DrawingStroke[]> = new Map()
	#undoStack: DrawingStroke[] = []
	#redoStack: DrawingStroke[] = []

	// Overlay canvas for drawing (separate from PDF canvas)
	#overlayCanvas: HTMLCanvasElement | null = null
	#ctx: CanvasRenderingContext2D | null = null
	#container: HTMLElement | null = null
	#pdfCanvas: HTMLCanvasElement | null = null
	#currentScale = 1
	#currentPageNumber = 0

	// Event listeners
	#strokeCompleteListeners: ListenerMap<DrawingStrokeCallback> = new Set()
	#strokeEraseListeners: ListenerMap<(strokeId: string) => void> = new Set()

	// Bound event handlers for cleanup (unified pointer events for mobile/desktop)
	#boundPointerDown: (e: PointerEvent) => void
	#boundPointerMove: (e: PointerEvent) => void
	#boundPointerUp: (e: PointerEvent) => void
	#boundPointerCancel: (e: PointerEvent) => void

	constructor(document: mupdf.PDFDocument, options: DrawingLayerOptions = {}) {
		this.#document = document

		if (options.defaultTool) {
			this.#currentTool = options.defaultTool
		}
		if (options.defaultColor) {
			this.#strokeColor = options.defaultColor
		}
		if (options.defaultWidth) {
			this.#strokeWidth = options.defaultWidth
		}
		if (options.defaultOpacity !== undefined) {
			this.#opacity = options.defaultOpacity
		}

		if (options.onStrokeComplete) {
			this.#strokeCompleteListeners.add(options.onStrokeComplete)
		}
		if (options.onStrokeErase) {
			this.#strokeEraseListeners.add(options.onStrokeErase)
		}

		// Bind unified pointer event handlers (works for both mouse and touch)
		this.#boundPointerDown = this.#handlePointerDown.bind(this)
		this.#boundPointerMove = this.#handlePointerMove.bind(this)
		this.#boundPointerUp = this.#handlePointerUp.bind(this)
		this.#boundPointerCancel = this.#handlePointerUp.bind(this)
	}

	// =========================================================================
	// Property Accessors
	// =========================================================================

	getState(): DrawingState {
		return {
			isActive: this.#isActive,
			currentTool: this.#currentTool,
			strokeColor: this.#strokeColor,
			strokeWidth: this.#strokeWidth,
			opacity: this.#opacity,
		}
	}

	isActive(): boolean {
		return this.#isActive
	}

	// =========================================================================
	// Property Mutators
	// =========================================================================

	setTool(tool: DrawingTool): void {
		this.#currentTool = tool

		// Update defaults based on tool
		switch (tool) {
			case 'pen':
				this.#strokeWidth = DEFAULT_PEN_WIDTH
				this.#strokeColor = COLOR_BLACK
				this.#opacity = 1.0
				break
			case 'highlighter':
				this.#strokeWidth = DEFAULT_HIGHLIGHTER_WIDTH
				this.#strokeColor = COLOR_YELLOW
				this.#opacity = DEFAULT_HIGHLIGHTER_OPACITY
				break
			case 'eraser':
				// Eraser doesn't need color/opacity
				break
		}

		this.#updateCursor()
	}

	setColor(color: AnnotationColor): void {
		this.#strokeColor = color
	}

	setWidth(width: number): void {
		this.#strokeWidth = Math.max(1, Math.min(50, width))
	}

	setOpacity(opacity: number): void {
		this.#opacity = Math.max(0, Math.min(1, opacity))
	}

	// =========================================================================
	// Activation
	// =========================================================================

	activate(): void {
		this.#isActive = true
		this.#updateCursor()
		this.#attachEventListeners()
	}

	deactivate(): void {
		this.#isActive = false
		this.#isDrawing = false
		this.#currentStroke = []
		this.#detachEventListeners()
		if (this.#overlayCanvas) {
			this.#overlayCanvas.style.cursor = 'default'
			this.#overlayCanvas.style.pointerEvents = 'none'
		}
	}

	// =========================================================================
	// Stroke Management
	// =========================================================================

	clearPage(pageNumber: number): void {
		this.#strokes.delete(pageNumber)
		this.#redraw()
	}

	getStrokes(pageNumber: number): readonly DrawingStroke[] {
		return this.#strokes.get(pageNumber) ?? []
	}

	undo(): void {
		const lastStroke = this.#undoStack.pop()
		if (!lastStroke) return

		const pageStrokes = this.#strokes.get(lastStroke.pageNumber)
		if (pageStrokes) {
			const index = pageStrokes.findIndex(s => s.id === lastStroke.id)
			if (index !== -1) {
				pageStrokes.splice(index, 1)
			}
		}

		this.#redoStack.push(lastStroke)
		this.#redraw()
	}

	redo(): void {
		const stroke = this.#redoStack.pop()
		if (!stroke) return

		let pageStrokes = this.#strokes.get(stroke.pageNumber)
		if (!pageStrokes) {
			pageStrokes = []
			this.#strokes.set(stroke.pageNumber, pageStrokes)
		}
		pageStrokes.push(stroke)

		this.#undoStack.push(stroke)
		this.#redraw()
	}

	// =========================================================================
	// Rendering
	// =========================================================================

	render(pageNumber: number, canvas: HTMLCanvasElement, scale: number): void {
		this.#pdfCanvas = canvas
		this.#currentScale = scale
		this.#currentPageNumber = pageNumber

		// Get or create the overlay canvas
		const parent = canvas.parentElement
		if (!parent) return
		this.#container = parent

		// Create overlay canvas if it doesn't exist
		if (!this.#overlayCanvas) {
			this.#overlayCanvas = document.createElement('canvas')
			this.#overlayCanvas.className = 'documenta-drawing-layer'
			this.#overlayCanvas.style.cssText = `
				position: absolute;
				top: 0;
				left: 0;
				pointer-events: none;
				z-index: 15;
				touch-action: none;
			`
			parent.appendChild(this.#overlayCanvas)
		}

		// Match the overlay canvas size to the PDF canvas
		this.#overlayCanvas.width = canvas.width
		this.#overlayCanvas.height = canvas.height
		this.#overlayCanvas.style.width = canvas.style.width
		this.#overlayCanvas.style.height = canvas.style.height

		this.#ctx = this.#overlayCanvas.getContext('2d')

		// Enable or disable pointer events based on activation state
		if (this.#isActive) {
			this.#overlayCanvas.style.pointerEvents = 'auto'
			this.#updateCursor()
		} else {
			this.#overlayCanvas.style.pointerEvents = 'none'
		}

		this.#redraw()
	}

	// =========================================================================
	// Event Subscriptions
	// =========================================================================

	onStrokeComplete(callback: DrawingStrokeCallback): Unsubscribe {
		this.#strokeCompleteListeners.add(callback)
		return () => this.#strokeCompleteListeners.delete(callback)
	}

	onStrokeErase(callback: (strokeId: string) => void): Unsubscribe {
		this.#strokeEraseListeners.add(callback)
		return () => this.#strokeEraseListeners.delete(callback)
	}

	// =========================================================================
	// Lifecycle
	// =========================================================================

	destroy(): void {
		this.deactivate()
		if (this.#overlayCanvas && this.#overlayCanvas.parentNode) {
			this.#overlayCanvas.parentNode.removeChild(this.#overlayCanvas)
		}
		this.#strokes.clear()
		this.#undoStack = []
		this.#redoStack = []
		this.#strokeCompleteListeners.clear()
		this.#strokeEraseListeners.clear()
		this.#overlayCanvas = null
		this.#pdfCanvas = null
		this.#ctx = null
	}

	// =========================================================================
	// Private Methods
	// =========================================================================

	#attachEventListeners(): void {
		if (!this.#overlayCanvas) return

		// Use unified pointer events for mobile/desktop compatibility
		this.#overlayCanvas.addEventListener('pointerdown', this.#boundPointerDown)
		this.#overlayCanvas.addEventListener('pointermove', this.#boundPointerMove)
		this.#overlayCanvas.addEventListener('pointerup', this.#boundPointerUp)
		this.#overlayCanvas.addEventListener('pointercancel', this.#boundPointerCancel)
		this.#overlayCanvas.addEventListener('pointerleave', this.#boundPointerUp)

		// Prevent default touch actions to avoid scrolling while drawing
		this.#overlayCanvas.style.touchAction = 'none'
	}

	#detachEventListeners(): void {
		if (!this.#overlayCanvas) return

		this.#overlayCanvas.removeEventListener('pointerdown', this.#boundPointerDown)
		this.#overlayCanvas.removeEventListener('pointermove', this.#boundPointerMove)
		this.#overlayCanvas.removeEventListener('pointerup', this.#boundPointerUp)
		this.#overlayCanvas.removeEventListener('pointercancel', this.#boundPointerCancel)
		this.#overlayCanvas.removeEventListener('pointerleave', this.#boundPointerUp)

		// Restore default touch action
		this.#overlayCanvas.style.touchAction = ''
	}

	#updateCursor(): void {
		if (!this.#overlayCanvas || !this.#isActive) return

		switch (this.#currentTool) {
			case 'pen':
				this.#overlayCanvas.style.cursor = 'crosshair'
				break
			case 'highlighter':
				this.#overlayCanvas.style.cursor = 'crosshair'
				break
			case 'eraser':
				this.#overlayCanvas.style.cursor = 'cell'
				break
		}
	}

	#handlePointerDown(e: PointerEvent): void {
		if (!this.#isActive) return
		// Only handle primary pointer (ignore multi-touch for now)
		if (!e.isPrimary) return
		e.preventDefault()

		// Capture pointer for reliable tracking
		if (this.#overlayCanvas) {
			this.#overlayCanvas.setPointerCapture(e.pointerId)
		}

		const point = this.#getPointFromPointer(e)
		this.#startStroke(point)
	}

	#handlePointerMove(e: PointerEvent): void {
		if (!this.#isDrawing || !e.isPrimary) return
		e.preventDefault()

		const point = this.#getPointFromPointer(e)
		this.#continueStroke(point)
	}

	#handlePointerUp(e: PointerEvent): void {
		if (!this.#isDrawing) return
		if (!e.isPrimary) return

		// Release pointer capture
		if (this.#overlayCanvas && e.pointerId !== undefined) {
			try {
				this.#overlayCanvas.releasePointerCapture(e.pointerId)
			} catch {
				// Ignore if pointer is not captured
			}
		}

		this.#endStroke()
	}

	#getPointFromPointer(e: PointerEvent): Point {
		const rect = this.#overlayCanvas?.getBoundingClientRect()
		if (!rect) return { x: 0, y: 0 }

		return {
			x: (e.clientX - rect.left) / this.#currentScale,
			y: (e.clientY - rect.top) / this.#currentScale,
		}
	}

	#startStroke(point: Point): void {
		if (this.#currentTool === 'eraser') {
			this.#eraseAtPoint(point)
			return
		}

		this.#isDrawing = true
		this.#currentStroke = [point]
	}

	#continueStroke(point: Point): void {
		if (this.#currentTool === 'eraser') {
			this.#eraseAtPoint(point)
			return
		}

		// Only add point if it's far enough from the last point
		const lastPoint = this.#currentStroke[this.#currentStroke.length - 1]
		if (lastPoint) {
			const minDistance = 4 // Minimum distance between points
			if (distanceSquared(point.x, point.y, lastPoint.x, lastPoint.y) < minDistance * minDistance) {
				return
			}
		}

		this.#currentStroke.push(point)
		this.#drawCurrentStroke()
	}

	#endStroke(): void {
		this.#isDrawing = false

		if (this.#currentStroke.length >= 2) {
			const stroke: DrawingStroke = {
				id: generateAnnotationId(),
				pageNumber: this.#currentPageNumber,
				tool: this.#currentTool,
				points: [...this.#currentStroke],
				color: this.#strokeColor,
				width: this.#strokeWidth,
				opacity: this.#opacity,
				timestamp: new Date(),
			}

			// Add to strokes
			let pageStrokes = this.#strokes.get(this.#currentPageNumber)
			if (!pageStrokes) {
				pageStrokes = []
				this.#strokes.set(this.#currentPageNumber, pageStrokes)
			}
			pageStrokes.push(stroke)

			// Add to undo stack
			this.#undoStack.push(stroke)
			this.#redoStack = []

			// Apply to PDF as ink annotation
			this.#applyStrokeToPdf(stroke)

			// Emit event
			this.#emitStrokeComplete(stroke)
		}

		this.#currentStroke = []
	}

	/** Get the effective scale factor for drawing (zoom * devicePixelRatio) */
	#getEffectiveScale(): number {
		return this.#currentScale * window.devicePixelRatio
	}

	#drawCurrentStroke(): void {
		if (!this.#ctx || this.#currentStroke.length < 2) return

		// Redraw everything to show current stroke
		this.#redraw()

		// Draw current stroke with devicePixelRatio scaling
		const effectiveScale = this.#getEffectiveScale()

		this.#ctx.save()
		this.#ctx.scale(effectiveScale, effectiveScale)
		this.#ctx.globalAlpha = this.#opacity
		this.#ctx.strokeStyle = this.#colorToCss(this.#strokeColor)
		this.#ctx.lineWidth = this.#strokeWidth
		this.#ctx.lineCap = 'round'
		this.#ctx.lineJoin = 'round'

		this.#ctx.beginPath()
		const firstPoint = this.#currentStroke[0]
		if (firstPoint) {
			this.#ctx.moveTo(firstPoint.x, firstPoint.y)
			for (let i = 1; i < this.#currentStroke.length; i++) {
				const point = this.#currentStroke[i]
				if (point) {
					this.#ctx.lineTo(point.x, point.y)
				}
			}
			this.#ctx.stroke()
		}
		this.#ctx.restore()
	}

	#redraw(): void {
		if (!this.#ctx || !this.#overlayCanvas) return

		// Clear the overlay canvas first (it's a separate transparent layer)
		this.#ctx.clearRect(0, 0, this.#overlayCanvas.width, this.#overlayCanvas.height)

		const pageStrokes = this.#strokes.get(this.#currentPageNumber)
		if (!pageStrokes || pageStrokes.length === 0) return

		// Apply devicePixelRatio scaling for high-DPI displays
		const effectiveScale = this.#getEffectiveScale()

		this.#ctx.save()
		this.#ctx.scale(effectiveScale, effectiveScale)

		for (const stroke of pageStrokes) {
			if (stroke.points.length < 2) continue

			this.#ctx.globalAlpha = stroke.opacity
			this.#ctx.strokeStyle = this.#colorToCss(stroke.color)
			this.#ctx.lineWidth = stroke.width
			this.#ctx.lineCap = 'round'
			this.#ctx.lineJoin = 'round'

			this.#ctx.beginPath()
			const firstPoint = stroke.points[0]
			if (firstPoint) {
				this.#ctx.moveTo(firstPoint.x, firstPoint.y)
				for (let i = 1; i < stroke.points.length; i++) {
					const point = stroke.points[i]
					if (point) {
						this.#ctx.lineTo(point.x, point.y)
					}
				}
				this.#ctx.stroke()
			}
		}

		this.#ctx.restore()
	}

	#eraseAtPoint(point: Point): void {
		const pageStrokes = this.#strokes.get(this.#currentPageNumber)
		if (!pageStrokes) return

		const eraserRadius = this.#strokeWidth / 2
		const eraserRadiusSq = eraserRadius * eraserRadius

		// Find strokes that intersect with eraser
		const toRemove: string[] = []
		for (const stroke of pageStrokes) {
			for (const strokePoint of stroke.points) {
				if (distanceSquared(point.x, point.y, strokePoint.x, strokePoint.y) < eraserRadiusSq) {
					toRemove.push(stroke.id)
					break
				}
			}
		}

		// Remove strokes
		for (const id of toRemove) {
			const index = pageStrokes.findIndex(s => s.id === id)
			if (index !== -1) {
				pageStrokes.splice(index, 1)
				this.#emitStrokeErase(id)
			}
		}

		if (toRemove.length > 0) {
			this.#redraw()
		}
	}

	#applyStrokeToPdf(stroke: DrawingStroke): void {
		const page = this.#document.loadPage(stroke.pageNumber - 1)

		const annot = page.createAnnotation('Ink')
		annot.setColor(colorToMupdfArray(stroke.color))
		annot.setOpacity(stroke.opacity)
		annot.setBorderWidth(stroke.width)

		// Convert points to mupdf format
		const inkList: mupdf.Point[][] = [stroke.points.map(p => [p.x, p.y] as mupdf.Point)]
		annot.setInkList(inkList)

		// Calculate bounding rect
		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
		for (const p of stroke.points) {
			minX = Math.min(minX, p.x)
			minY = Math.min(minY, p.y)
			maxX = Math.max(maxX, p.x)
			maxY = Math.max(maxY, p.y)
		}
		const padding = stroke.width / 2
		annot.setRect([minX - padding, minY - padding, maxX + padding, maxY + padding])

		annot.update()
		page.destroy()
	}

	#colorToCss(color: AnnotationColor): string {
		const r = Math.round(color.r * 255)
		const g = Math.round(color.g * 255)
		const b = Math.round(color.b * 255)
		return `rgb(${r}, ${g}, ${b})`
	}

	// =========================================================================
	// Event Emitters
	// =========================================================================

	#emitStrokeComplete(stroke: DrawingStroke): void {
		for (const callback of this.#strokeCompleteListeners) {
			callback(stroke)
		}
	}

	#emitStrokeErase(strokeId: string): void {
		for (const callback of this.#strokeEraseListeners) {
			callback(strokeId)
		}
	}
}
