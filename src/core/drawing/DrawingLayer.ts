/**
 * Documenta - Drawing Layer Implementation
 * @module core/drawing/DrawingLayer
 *
 * Provides freehand drawing capabilities with pen, highlighter, and eraser tools.
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
import { generateAnnotationId, colorToMupdfArray } from '../../helpers.js'
import { distanceSquared } from 'tactica'
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

	// Canvas references
	#canvas: HTMLCanvasElement | null = null
	#ctx: CanvasRenderingContext2D | null = null
	#currentScale = 1
	#currentPageNumber = 0

	// Event listeners
	#strokeCompleteListeners: ListenerMap<DrawingStrokeCallback> = new Set()
	#strokeEraseListeners: ListenerMap<(strokeId: string) => void> = new Set()

	// Bound event handlers for cleanup
	#boundMouseDown: (e: MouseEvent) => void
	#boundMouseMove: (e: MouseEvent) => void
	#boundMouseUp: () => void
	#boundTouchStart: (e: TouchEvent) => void
	#boundTouchMove: (e: TouchEvent) => void
	#boundTouchEnd: () => void

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

		// Bind event handlers
		this.#boundMouseDown = this.#handleMouseDown.bind(this)
		this.#boundMouseMove = this.#handleMouseMove.bind(this)
		this.#boundMouseUp = this.#handleMouseUp.bind(this)
		this.#boundTouchStart = this.#handleTouchStart.bind(this)
		this.#boundTouchMove = this.#handleTouchMove.bind(this)
		this.#boundTouchEnd = this.#handleTouchEnd.bind(this)
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
		if (this.#canvas) {
			this.#canvas.style.cursor = 'default'
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
		this.#canvas = canvas
		this.#ctx = canvas.getContext('2d')
		this.#currentScale = scale
		this.#currentPageNumber = pageNumber

		if (this.#isActive) {
			this.#updateCursor()
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
		this.#strokes.clear()
		this.#undoStack = []
		this.#redoStack = []
		this.#strokeCompleteListeners.clear()
		this.#strokeEraseListeners.clear()
		this.#canvas = null
		this.#ctx = null
	}

	// =========================================================================
	// Private Methods
	// =========================================================================

	#attachEventListeners(): void {
		if (!this.#canvas) return

		this.#canvas.addEventListener('mousedown', this.#boundMouseDown)
		this.#canvas.addEventListener('mousemove', this.#boundMouseMove)
		this.#canvas.addEventListener('mouseup', this.#boundMouseUp)
		this.#canvas.addEventListener('mouseleave', this.#boundMouseUp)
		this.#canvas.addEventListener('touchstart', this.#boundTouchStart, { passive: false })
		this.#canvas.addEventListener('touchmove', this.#boundTouchMove, { passive: false })
		this.#canvas.addEventListener('touchend', this.#boundTouchEnd)
	}

	#detachEventListeners(): void {
		if (!this.#canvas) return

		this.#canvas.removeEventListener('mousedown', this.#boundMouseDown)
		this.#canvas.removeEventListener('mousemove', this.#boundMouseMove)
		this.#canvas.removeEventListener('mouseup', this.#boundMouseUp)
		this.#canvas.removeEventListener('mouseleave', this.#boundMouseUp)
		this.#canvas.removeEventListener('touchstart', this.#boundTouchStart)
		this.#canvas.removeEventListener('touchmove', this.#boundTouchMove)
		this.#canvas.removeEventListener('touchend', this.#boundTouchEnd)
	}

	#updateCursor(): void {
		if (!this.#canvas || !this.#isActive) return

		switch (this.#currentTool) {
			case 'pen':
				this.#canvas.style.cursor = 'crosshair'
				break
			case 'highlighter':
				this.#canvas.style.cursor = 'crosshair'
				break
			case 'eraser':
				this.#canvas.style.cursor = 'cell'
				break
		}
	}

	#handleMouseDown(e: MouseEvent): void {
		if (!this.#isActive) return
		e.preventDefault()

		const point = this.#getPointFromEvent(e)
		this.#startStroke(point)
	}

	#handleMouseMove(e: MouseEvent): void {
		if (!this.#isDrawing) return
		e.preventDefault()

		const point = this.#getPointFromEvent(e)
		this.#continueStroke(point)
	}

	#handleMouseUp(): void {
		if (!this.#isDrawing) return
		this.#endStroke()
	}

	#handleTouchStart(e: TouchEvent): void {
		if (!this.#isActive || e.touches.length !== 1) return
		e.preventDefault()

		const touch = e.touches[0]
		if (touch) {
			const point = this.#getPointFromTouch(touch)
			this.#startStroke(point)
		}
	}

	#handleTouchMove(e: TouchEvent): void {
		if (!this.#isDrawing || e.touches.length !== 1) return
		e.preventDefault()

		const touch = e.touches[0]
		if (touch) {
			const point = this.#getPointFromTouch(touch)
			this.#continueStroke(point)
		}
	}

	#handleTouchEnd(): void {
		if (!this.#isDrawing) return
		this.#endStroke()
	}

	#getPointFromEvent(e: MouseEvent): Point {
		const rect = this.#canvas?.getBoundingClientRect()
		if (!rect) return { x: 0, y: 0 }

		return {
			x: (e.clientX - rect.left) / this.#currentScale,
			y: (e.clientY - rect.top) / this.#currentScale,
		}
	}

	#getPointFromTouch(touch: Touch): Point {
		const rect = this.#canvas?.getBoundingClientRect()
		if (!rect) return { x: 0, y: 0 }

		return {
			x: (touch.clientX - rect.left) / this.#currentScale,
			y: (touch.clientY - rect.top) / this.#currentScale,
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

	#drawCurrentStroke(): void {
		if (!this.#ctx || this.#currentStroke.length < 2) return

		// Redraw everything to show current stroke
		this.#redraw()

		// Draw current stroke
		this.#ctx.save()
		this.#ctx.scale(this.#currentScale, this.#currentScale)
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
		if (!this.#ctx || !this.#canvas) return

		// Note: We don't clear the canvas since the PDF is rendered there
		// We only draw over it. The strokes are applied permanently as annotations.

		const pageStrokes = this.#strokes.get(this.#currentPageNumber)
		if (!pageStrokes) return

		this.#ctx.save()
		this.#ctx.scale(this.#currentScale, this.#currentScale)

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
