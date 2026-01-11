# Phase 5: Drawing Layer

> **Status:** ⏳ Pending
> **Started:** —
> **Target:** —
> **Depends on:** Phase 3 (Layer System) ⏳ Pending

## Objective

Implement freehand drawing with pen, highlighter, and eraser tools. By end of phase, users can draw on PDFs with touch and mouse, undo/redo strokes, and drawings persist as ink annotations.

## Deliverables

| # | Deliverable | Status | Assignee |
|---|-------------|--------|----------|
| 5.1 | Drawing canvas overlay | ⏳ Pending | — |
| 5.2 | Stroke rendering | ⏳ Pending | — |
| 5.3 | Tool implementation | ⏳ Pending | — |
| 5.4 | Touch drawing support | ⏳ Pending | — |
| 5.5 | Ink annotation persistence | ⏳ Pending | — |
| 5.6 | Unit tests | ⏳ Pending | — |

**Status Legend:**
- ✅ Done
- 🔄 Active
- ⏳ Pending

## Current Focus: 5.1 Drawing Canvas Overlay

### Requirements

1. Separate transparent canvas for drawing (not PDF canvas)
2. Proper devicePixelRatio handling
3. Independent from PDF rendering
4. Positioned over PDF canvas

### Why Separate Canvas?

Drawing directly on the PDF canvas causes issues: 
- PDF re-render clears drawings
- Coordinate systems conflict at different zoom levels
- devicePixelRatio handling differs

Solution: Overlay canvas that matches PDF canvas size exactly.

### Interface Contract

```typescript
export interface DrawingLayerInterface extends Layer {
	// Tool control
	setTool(tool:  DrawingTool): void
	getTool(): DrawingTool
	setColor(color: Color): void
	getColor(): Color
	setWidth(width: number): void
	getWidth(): number
	setOpacity(opacity: number): void
	getOpacity(): number

	// Stroke management
	getStrokes(pageNumber: number): readonly DrawingStroke[]
	clearPage(pageNumber: number): void
	undo(): void
	redo(): void

	// Events
	onStrokeComplete(callback: StrokeCompleteCallback): Unsubscribe
	onStrokeErase(callback: StrokeEraseCallback): Unsubscribe
}

export type DrawingTool = 'pen' | 'highlighter' | 'eraser'

export interface DrawingStroke {
	readonly id: string
	readonly pageNumber: number
	readonly tool: DrawingTool
	readonly points: readonly Point[]
	readonly color: Color
	readonly width: number
	readonly opacity: number
	readonly timestamp: Date
}
```

### Implementation Checklist

- [ ] Create `src/core/drawing/DrawingLayer.ts`
- [ ] Extend BaseLayer
- [ ] Create overlay canvas matching PDF canvas size
- [ ] Handle devicePixelRatio for crisp lines
- [ ] Position overlay exactly over PDF canvas
- [ ] Set z-index above TextLayer

---

## Deliverable 5.2: Stroke Rendering

### Requirements

1. Smooth curve rendering (not just line segments)
2. Variable width support
3. Opacity support for highlighter
4. Efficient redraw

### Implementation Checklist

- [ ] Create `src/core/drawing/StrokeRenderer.ts`
- [ ] Implement quadratic curve smoothing
- [ ] Implement stroke width scaling with zoom
- [ ] Implement opacity blending
- [ ] Optimize redraw (only affected areas)

### Stroke Smoothing Algorithm

```typescript
// Convert raw points to smooth quadratic curves
function smoothPath(points: readonly Point[]): Path2D {
	const path = new Path2D()
	if (points.length < 2) return path

	path.moveTo(points[0].x, points[0].y)

	for (let i = 1; i < points.length - 1; i++) {
		const prev = points[i]
		const next = points[i + 1]
		const midX = (prev. x + next.x) / 2
		const midY = (prev.y + next.y) / 2
		path.quadraticCurveTo(prev.x, prev. y, midX, midY)
	}

	const last = points[points. length - 1]
	path.lineTo(last.x, last.y)

	return path
}
```

---

## Deliverable 5.3: Tool Implementation

### Requirements

1. **Pen**:  Solid strokes with configurable color/width
2. **Highlighter**: Semi-transparent, thicker strokes
3. **Eraser**: Remove strokes that intersect eraser path

### Implementation Checklist

- [ ] Create `src/core/drawing/tools/PenTool.ts`
- [ ] Create `src/core/drawing/tools/HighlighterTool.ts`
- [ ] Create `src/core/drawing/tools/EraserTool.ts`
- [ ] Implement tool switching
- [ ] Implement eraser hit testing

### Eraser Hit Testing

```typescript
// Check if eraser path intersects any stroke
function checkEraserIntersection(
	eraserPoint: Point,
	eraserRadius: number,
	strokes: readonly DrawingStroke[]
): string[] {
	const erased:  string[] = []

	for (const stroke of strokes) {
		for (const point of stroke.points) {
			const dx = eraserPoint.x - point.x
			const dy = eraserPoint.y - point.y
			if (dx * dx + dy * dy < eraserRadius * eraserRadius) {
				erased.push(stroke.id)
				break
			}
		}
	}

	return erased
}
```

---

## Deliverable 5.4: Touch Drawing Support

### Requirements

1. Use Pointer Events for unified mouse/touch handling
2. Support pressure sensitivity (where available)
3. Prevent scroll while drawing
4. Handle palm rejection

### Implementation Checklist

- [ ] Use pointerdown/pointermove/pointerup events
- [ ] Set `touch-action: none` when drawing active
- [ ] Capture pointer for reliable tracking
- [ ] Read pressure from PointerEvent
- [ ] Filter primary pointer only (ignore palm touches)

### Pointer Event Handling

```typescript
#handlePointerDown(e: PointerEvent): void {
	if (! e.isPrimary) return  // Ignore multi-touch
	e.preventDefault()

	this.#canvas.setPointerCapture(e.pointerId)
	this.#startStroke(this.#getPoint(e))
}

#handlePointerMove(e: PointerEvent): void {
	if (! e.isPrimary || !this.#isDrawing) return
	e.preventDefault()

	const point = this. #getPoint(e)
	this.#continueStroke(point)
}

#handlePointerUp(e: PointerEvent): void {
	if (!e. isPrimary) return

	this.#canvas.releasePointerCapture(e. pointerId)
	this.#endStroke()
}
```

---

## Deliverable 5.5: Ink Annotation Persistence

### Requirements

1. Convert completed strokes to mupdf Ink annotations
2. Store in PDF document
3. Load existing ink annotations

### Implementation Checklist

- [ ] Create `src/core/drawing/InkAnnotation.ts`
- [ ] Convert DrawingStroke to mupdf Ink annotation
- [ ] Calculate bounding rect from points
- [ ] Set color, opacity, stroke width
- [ ] Load existing ink annotations on page render

### Mupdf Ink Annotation Creation

```typescript
function createInkAnnotation(
	page: mupdf.PDFPage,
	stroke: DrawingStroke
): void {
	const annot = page.createAnnotation('Ink')

	annot.setColor([stroke.color.r, stroke.color.g, stroke.color. b])
	annot.setOpacity(stroke.opacity)
	annot. setBorderWidth(stroke. width)

	// Convert points to mupdf format
	const inkList:  mupdf.Point[][] = [
		stroke.points.map(p => [p.x, p.y] as mupdf. Point)
	]
	annot.setInkList(inkList)

	// Calculate bounds
	const bounds = calculateBounds(stroke.points, stroke.width)
	annot.setRect(bounds)

	annot.update()
}
```

---

## Deliverable 5.6: Unit Tests

### Implementation Checklist

- [ ] Create `tests/core/drawing/DrawingLayer.test.ts`
- [ ] Create `tests/core/drawing/StrokeRenderer.test.ts`
- [ ] Create `tests/core/drawing/tools/*. test.ts`
- [ ] Test stroke creation and storage
- [ ] Test eraser hit detection
- [ ] Test undo/redo stack
- [ ] Test coordinate scaling at different zoom levels

## Phase Completion Criteria

All of the following must be true: 

- [ ] All deliverables marked ✅ Done
- [ ] Drawing works with mouse and touch
- [ ] Pen, highlighter, eraser all functional
- [ ] Undo/redo works correctly
- [ ] Strokes persist after save
- [ ] Drawing coordinates correct at all zoom levels
- [ ] `npm run check` passes
- [ ] `npm run test` passes
- [ ] PLAN.md updated to show Phase 5 complete