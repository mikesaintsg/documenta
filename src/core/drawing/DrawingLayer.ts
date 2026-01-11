/**
 * DrawingLayer - Freehand drawing layer
 * @module core/drawing/DrawingLayer
 *
 * Provides pen, highlighter, and eraser tools for drawing on PDFs.
 */

import type {
	DrawingLayerInterface,
	DrawingTool,
	DrawingStroke,
	DrawingState,
	Color,
	Point,
	StrokeCompleteCallback,
	StrokeEraseCallback,
	PdfDocumentInterface,
	Unsubscribe,
} from '../../types.js'
import { BaseLayer } from '../layers/BaseLayer.js'
import {
	Z_INDEX_DRAWING,
	CSS_CLASSES,
	DEFAULT_PEN_COLOR,
	DEFAULT_PEN_WIDTH,
	DEFAULT_HIGHLIGHTER_COLOR,
	DEFAULT_HIGHLIGHTER_WIDTH,
	DEFAULT_HIGHLIGHTER_OPACITY,
	DEFAULT_ERASER_WIDTH,
} from '../../constants.js'
import {
	generateStrokeId,
	colorToCss,
	getDevicePixelRatio,
	distanceSquared,
	isPrimaryPointer,
	getPointFromPointerEvent,
} from '../../helpers.js'

/**
 * DrawingLayer - Freehand drawing overlay
 *
 * @remarks
 * Uses a separate canvas overlay for drawing to avoid conflicts
 * with PDF rendering.
 */
export class DrawingLayer extends BaseLayer implements DrawingLayerInterface {
	#canvas: HTMLCanvasElement
	#ctx: CanvasRenderingContext2D

	#currentPage = 0
	#currentScale = 1

	// Tool state
	#tool: DrawingTool = 'pen'
	#color: Color = DEFAULT_PEN_COLOR
	#width: number = DEFAULT_PEN_WIDTH
	#opacity = 1

	// Stroke storage (per page)
	#strokes = new Map<number, DrawingStroke[]>()
	#undoStack = new Map<number, DrawingStroke[][]>()
	#redoStack = new Map<number, DrawingStroke[][]>()

	// Current drawing state
	#isDrawing = false
	#currentPoints: Point[] = []
	#currentStrokeId = ''

	// Event listeners
	#strokeCompleteListeners = new Set<StrokeCompleteCallback>()
	#strokeEraseListeners = new Set<StrokeEraseCallback>()

	// Bound event handlers
	#onPointerDown: (e: PointerEvent) => void
	#onPointerMove: (e: PointerEvent) => void
	#onPointerUp: (e: PointerEvent) => void
	#onPointerCancel: (e: PointerEvent) => void

	constructor(parent: HTMLElement) {
		super(parent, Z_INDEX_DRAWING, CSS_CLASSES.DRAWING_LAYER)

		// Create drawing canvas
		this.#canvas = document.createElement('canvas')
		this.#canvas.className = `${CSS_CLASSES.DRAWING_LAYER}-canvas`
		this.#canvas.style.position = 'absolute'
		this.#canvas.style.left = '0'
		this.#canvas.style.top = '0'
		this.#canvas.style.touchAction = 'none'

		const ctx = this.#canvas.getContext('2d')
		if (!ctx) {
			throw new Error('Failed to get 2D canvas context')
		}
		this.#ctx = ctx

		this.getContainer().appendChild(this.#canvas)

		// Bind event handlers
		this.#onPointerDown = this.#handlePointerDown.bind(this)
		this.#onPointerMove = this.#handlePointerMove.bind(this)
		this.#onPointerUp = this.#handlePointerUp.bind(this)
		this.#onPointerCancel = this.#handlePointerCancel.bind(this)
	}

	// =========================================================================
	// Tool Control
	// =========================================================================

	setTool(tool: DrawingTool): void {
		this.#tool = tool

		// Apply tool-specific defaults
		switch (tool) {
			case 'pen':
				this.#color = DEFAULT_PEN_COLOR
				this.#width = DEFAULT_PEN_WIDTH
				this.#opacity = 1
				break
			case 'highlighter':
				this.#color = DEFAULT_HIGHLIGHTER_COLOR
				this.#width = DEFAULT_HIGHLIGHTER_WIDTH
				this.#opacity = DEFAULT_HIGHLIGHTER_OPACITY
				break
			case 'eraser':
				this.#width = DEFAULT_ERASER_WIDTH
				break
		}
	}

	getTool(): DrawingTool {
		return this.#tool
	}

	setColor(color: Color): void {
		this.#color = color
	}

	getColor(): Color {
		return this.#color
	}

	setWidth(width: number): void {
		this.#width = Math.max(1, width)
	}

	getWidth(): number {
		return this.#width
	}

	setOpacity(opacity: number): void {
		this.#opacity = Math.max(0, Math.min(1, opacity))
	}

	getOpacity(): number {
		return this.#opacity
	}

	getState(): DrawingState {
		return {
			isActive: this.isActive(),
			currentTool: this.#tool,
			strokeColor: { ...this.#color },
			strokeWidth: this.#width,
			opacity: this.#opacity,
		}
	}

	setDocument(_doc: PdfDocumentInterface): void {
		// TODO: Implement annotation persistence in Phase 6
	}

	// =========================================================================
	// Stroke Management
	// =========================================================================

	getStrokes(pageNumber: number): readonly DrawingStroke[] {
		return this.#strokes.get(pageNumber) ?? []
	}

	clearPage(pageNumber: number): void {
		const strokes = this.#strokes.get(pageNumber)
		if (strokes && strokes.length > 0) {
			// Save for undo
			this.#pushUndo(pageNumber, [...strokes])
			this.#strokes.set(pageNumber, [])
			this.#redraw()
		}
	}

	undo(): void {
		const undoStack = this.#undoStack.get(this.#currentPage)
		if (!undoStack || undoStack.length === 0) return

		const previousState = undoStack.pop()
		if (!previousState) return

		// Save current state to redo
		const currentStrokes = this.#strokes.get(this.#currentPage) ?? []
		const redoStack = this.#redoStack.get(this.#currentPage) ?? []
		redoStack.push([...currentStrokes])
		this.#redoStack.set(this.#currentPage, redoStack)

		// Restore previous state
		this.#strokes.set(this.#currentPage, previousState)
		this.#redraw()
	}

	redo(): void {
		const redoStack = this.#redoStack.get(this.#currentPage)
		if (!redoStack || redoStack.length === 0) return

		const nextState = redoStack.pop()
		if (!nextState) return

		// Save current state to undo
		const currentStrokes = this.#strokes.get(this.#currentPage) ?? []
		const undoStack = this.#undoStack.get(this.#currentPage) ?? []
		undoStack.push([...currentStrokes])
		this.#undoStack.set(this.#currentPage, undoStack)

		// Apply redo state
		this.#strokes.set(this.#currentPage, nextState)
		this.#redraw()
	}

	canUndo(): boolean {
		const undoStack = this.#undoStack.get(this.#currentPage)
		return !!undoStack && undoStack.length > 0
	}

	canRedo(): boolean {
		const redoStack = this.#redoStack.get(this.#currentPage)
		return !!redoStack && redoStack.length > 0
	}

	// =========================================================================
	// Events
	// =========================================================================

	onStrokeComplete(callback: StrokeCompleteCallback): Unsubscribe {
		this.#strokeCompleteListeners.add(callback)
		return () => this.#strokeCompleteListeners.delete(callback)
	}

	onStrokeErase(callback: StrokeEraseCallback): Unsubscribe {
		this.#strokeEraseListeners.add(callback)
		return () => this.#strokeEraseListeners.delete(callback)
	}

	// =========================================================================
	// Layer Lifecycle
	// =========================================================================

	protected onRender(pageNumber: number, scale: number): void {
		this.#currentPage = pageNumber
		this.#currentScale = scale
		this.#redraw()
	}

	protected onResize(width: number, height: number): void {
		const dpr = getDevicePixelRatio()

		this.#canvas.width = width * dpr
		this.#canvas.height = height * dpr
		this.#canvas.style.width = `${width}px`
		this.#canvas.style.height = `${height}px`

		this.#ctx.scale(dpr, dpr)
		this.#redraw()
	}

	protected onActivate(): void {
		this.#canvas.addEventListener('pointerdown', this.#onPointerDown)
		this.#canvas.addEventListener('pointermove', this.#onPointerMove)
		this.#canvas.addEventListener('pointerup', this.#onPointerUp)
		this.#canvas.addEventListener('pointercancel', this.#onPointerCancel)
	}

	protected onDeactivate(): void {
		this.#canvas.removeEventListener('pointerdown', this.#onPointerDown)
		this.#canvas.removeEventListener('pointermove', this.#onPointerMove)
		this.#canvas.removeEventListener('pointerup', this.#onPointerUp)
		this.#canvas.removeEventListener('pointercancel', this.#onPointerCancel)

		if (this.#isDrawing) {
			this.#endStroke()
		}
	}

	protected onDestroy(): void {
		this.#strokes.clear()
		this.#undoStack.clear()
		this.#redoStack.clear()
		this.#strokeCompleteListeners.clear()
		this.#strokeEraseListeners.clear()
	}

	// =========================================================================
	// Pointer Event Handlers
	// =========================================================================

	#handlePointerDown(e: PointerEvent): void {
		if (!isPrimaryPointer(e)) return
		e.preventDefault()

		this.#canvas.setPointerCapture(e.pointerId)

		const point = getPointFromPointerEvent(e, this.#canvas)
		const pagePoint = this.#clientToPage(point)

		if (this.#tool === 'eraser') {
			this.#handleErase(pagePoint)
		} else {
			this.#startStroke(pagePoint)
		}
	}

	#handlePointerMove(e: PointerEvent): void {
		if (!isPrimaryPointer(e)) return
		e.preventDefault()

		const point = getPointFromPointerEvent(e, this.#canvas)
		const pagePoint = this.#clientToPage(point)

		if (this.#tool === 'eraser') {
			if (e.buttons > 0) {
				this.#handleErase(pagePoint)
			}
		} else if (this.#isDrawing) {
			this.#continueStroke(pagePoint)
		}
	}

	#handlePointerUp(e: PointerEvent): void {
		if (!isPrimaryPointer(e)) return

		try {
			this.#canvas.releasePointerCapture(e.pointerId)
		} catch {
			// Ignore if already released
		}

		if (this.#isDrawing) {
			this.#endStroke()
		}
	}

	#handlePointerCancel(e: PointerEvent): void {
		this.#handlePointerUp(e)
	}

	// =========================================================================
	// Stroke Management
	// =========================================================================

	#startStroke(point: Point): void {
		this.#isDrawing = true
		this.#currentPoints = [point]
		this.#currentStrokeId = generateStrokeId()
	}

	#continueStroke(point: Point): void {
		if (!this.#isDrawing) return

		this.#currentPoints.push(point)

		// Draw incrementally for responsiveness
		this.#drawIncrementalStroke()
	}

	#endStroke(): void {
		if (!this.#isDrawing || this.#currentPoints.length < 2) {
			this.#isDrawing = false
			this.#currentPoints = []
			return
		}

		// Create stroke object
		const stroke: DrawingStroke = {
			id: this.#currentStrokeId,
			pageNumber: this.#currentPage,
			tool: this.#tool,
			points: [...this.#currentPoints],
			color: { ...this.#color },
			width: this.#width,
			opacity: this.#opacity,
			timestamp: new Date(),
		}

		// Save current state for undo
		const currentStrokes = this.#strokes.get(this.#currentPage) ?? []
		this.#pushUndo(this.#currentPage, [...currentStrokes])

		// Add stroke
		currentStrokes.push(stroke)
		this.#strokes.set(this.#currentPage, currentStrokes)

		// Clear redo stack
		this.#redoStack.set(this.#currentPage, [])

		// Notify listeners
		for (const listener of this.#strokeCompleteListeners) {
			listener(stroke)
		}

		// Reset state
		this.#isDrawing = false
		this.#currentPoints = []

		// Full redraw for clean rendering
		this.#redraw()
	}

	#handleErase(point: Point): void {
		const eraserRadius = this.#width / 2 / this.#currentScale
		const strokes = this.#strokes.get(this.#currentPage)
		if (!strokes || strokes.length === 0) return

		const erased: string[] = []

		// Find strokes to erase
		for (const stroke of strokes) {
			for (const strokePoint of stroke.points) {
				const distSq = distanceSquared(point.x, point.y, strokePoint.x, strokePoint.y)
				if (distSq < eraserRadius * eraserRadius) {
					erased.push(stroke.id)
					break
				}
			}
		}

		if (erased.length > 0) {
			// Save for undo
			this.#pushUndo(this.#currentPage, [...strokes])

			// Remove erased strokes
			const remaining = strokes.filter(s => !erased.includes(s.id))
			this.#strokes.set(this.#currentPage, remaining)

			// Clear redo stack
			this.#redoStack.set(this.#currentPage, [])

			// Notify listeners
			for (const strokeId of erased) {
				for (const listener of this.#strokeEraseListeners) {
					listener(strokeId)
				}
			}

			this.#redraw()
		}
	}

	#pushUndo(pageNumber: number, strokes: DrawingStroke[]): void {
		const undoStack = this.#undoStack.get(pageNumber) ?? []
		undoStack.push(strokes)
		// Limit undo stack size
		if (undoStack.length > 50) {
			undoStack.shift()
		}
		this.#undoStack.set(pageNumber, undoStack)
	}

	// =========================================================================
	// Rendering
	// =========================================================================

	#redraw(): void {
		const dpr = getDevicePixelRatio()
		this.#ctx.clearRect(0, 0, this.#canvas.width / dpr, this.#canvas.height / dpr)

		const strokes = this.#strokes.get(this.#currentPage) ?? []

		for (const stroke of strokes) {
			this.#drawStroke(stroke)
		}

		// Draw current stroke in progress
		if (this.#isDrawing && this.#currentPoints.length > 1) {
			this.#drawStroke({
				id: this.#currentStrokeId,
				pageNumber: this.#currentPage,
				tool: this.#tool,
				points: this.#currentPoints,
				color: this.#color,
				width: this.#width,
				opacity: this.#opacity,
				timestamp: new Date(),
			})
		}
	}

	#drawIncrementalStroke(): void {
		if (this.#currentPoints.length < 2) return

		// Draw just the last segment for responsiveness
		const len = this.#currentPoints.length
		const secondLast = this.#currentPoints[len - 2]
		const last = this.#currentPoints[len - 1]
		if (!secondLast || !last) return

		this.#ctx.save()

		this.#ctx.strokeStyle = colorToCss(this.#color, this.#opacity)
		this.#ctx.lineWidth = this.#width * this.#currentScale
		this.#ctx.lineCap = 'round'
		this.#ctx.lineJoin = 'round'

		if (this.#tool === 'highlighter') {
			this.#ctx.globalCompositeOperation = 'multiply'
		}

		this.#ctx.beginPath()
		this.#ctx.moveTo(
			secondLast.x * this.#currentScale,
			secondLast.y * this.#currentScale,
		)
		this.#ctx.lineTo(
			last.x * this.#currentScale,
			last.y * this.#currentScale,
		)
		this.#ctx.stroke()

		this.#ctx.restore()
	}

	#drawStroke(stroke: DrawingStroke): void {
		if (stroke.points.length < 2) return

		this.#ctx.save()

		this.#ctx.strokeStyle = colorToCss(stroke.color, stroke.opacity)
		this.#ctx.lineWidth = stroke.width * this.#currentScale
		this.#ctx.lineCap = 'round'
		this.#ctx.lineJoin = 'round'

		if (stroke.tool === 'highlighter') {
			this.#ctx.globalCompositeOperation = 'multiply'
		}

		// Draw smooth curve through points
		const path = this.#smoothPath(stroke.points)
		this.#ctx.stroke(path)

		this.#ctx.restore()
	}

	#smoothPath(points: readonly Point[]): Path2D {
		const path = new Path2D()
		if (points.length < 2) return path

		const first = points[0]
		if (!first) return path

		path.moveTo(first.x * this.#currentScale, first.y * this.#currentScale)

		for (let i = 1; i < points.length - 1; i++) {
			const prev = points[i]
			const next = points[i + 1]
			if (!prev || !next) continue

			const midX = ((prev.x + next.x) / 2) * this.#currentScale
			const midY = ((prev.y + next.y) / 2) * this.#currentScale
			path.quadraticCurveTo(
				prev.x * this.#currentScale,
				prev.y * this.#currentScale,
				midX,
				midY,
			)
		}

		const last = points[points.length - 1]
		if (last) {
			path.lineTo(last.x * this.#currentScale, last.y * this.#currentScale)
		}

		return path
	}

	// =========================================================================
	// Coordinate Transforms
	// =========================================================================

	#clientToPage(point: Point): Point {
		return {
			x: point.x / this.#currentScale,
			y: point.y / this.#currentScale,
		}
	}
}
