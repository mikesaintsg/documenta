# Phase 3: Layer System

> **Status:** ⏳ Pending
> **Started:** —
> **Target:** —
> **Depends on:** Phase 2 (Core Document) ⏳ Pending

## Objective

Implement the LayerStack coordinator and establish the foundation for all interactive layers. By end of phase, the layer system correctly manages z-index, pointer events, and mode switching.

## Deliverables

| # | Deliverable | Status | Assignee |
|---|-------------|--------|----------|
| 3.1 | LayerStack coordinator | ⏳ Pending | — |
| 3.2 | Touch gesture recognizer | ⏳ Pending | — |
| 3.3 | Layer base class | ⏳ Pending | — |
| 3.4 | Coordinate transforms | ⏳ Pending | — |
| 3.5 | Unit tests | ⏳ Pending | — |

**Status Legend:**
- ✅ Done
- 🔄 Active
- ⏳ Pending

## Current Focus: 3.1 LayerStack Coordinator

### Requirements

1. Manage layer registration and ordering
2. Route pointer events based on mode
3. Switch active layer when mode changes
4. Coordinate render calls across layers

### Interface Contract

```typescript
export interface LayerStackInterface {
	// Registration
	registerLayer(name: string, layer:  Layer): void
	unregisterLayer(name: string): void
	getLayer<T extends Layer>(name: string): T | undefined

	// Mode management
	setMode(mode: EditorMode): void
	getMode(): EditorMode
	onModeChange(callback: ModeChangeCallback): Unsubscribe

	// Rendering
	render(pageNumber: number, scale: number): void
	resize(width: number, height: number): void

	// Lifecycle
	destroy(): void
}
```

### Implementation Checklist

- [ ] Create `src/core/layers/LayerStack.ts`
- [ ] Implement layer registration with z-index ordering
- [ ] Implement mode switching logic
- [ ] Set `pointer-events` CSS based on mode
- [ ] Implement coordinated rendering
- [ ] Emit mode change events

### Layer Activation Matrix

| Mode       | Canvas | Text | Drawing | Form | Annot |
|------------|--------|------|---------|------|-------|
| `pan`      | —      | —    | —       | —    | —     |
| `text`     | —      | ✓    | —       | —    | —     |
| `draw`     | —      | —    | ✓       | —    | —     |
| `form`     | —      | —    | —       | ✓    | —     |
| `annotate` | —      | —    | —       | —    | ✓     |

(✓ = pointer-events: auto, — = pointer-events: none)

---

## Deliverable 3.2: Touch Gesture Recognizer

### Requirements

1. Distinguish between tap, double-tap, long-press
2. Detect pinch-to-zoom (always available)
3. Detect two-finger pan (always available)
4. Single-finger behavior depends on mode

### Interface Contract

```typescript
export type GestureType =
	| 'tap'
	| 'doubletap'
	| 'longpress'
	| 'pan'
	| 'pinch'
	| 'twofingerpan'

export interface GestureEvent {
	readonly type: GestureType
	readonly center: Point
	readonly scale?:  number  // For pinch
	readonly deltaX?: number // For pan
	readonly deltaY?: number
	readonly pointerCount: number
}

export type GestureCallback = (event: GestureEvent) => void

export interface GestureRecognizerInterface {
	attach(element: HTMLElement): void
	detach(): void
	onGesture(callback:  GestureCallback): Unsubscribe
	destroy(): void
}
```

### Implementation Checklist

- [ ] Create `src/core/input/GestureRecognizer.ts`
- [ ] Implement pointer event tracking
- [ ] Implement tap detection (with timing threshold)
- [ ] Implement double-tap detection
- [ ] Implement long-press detection
- [ ] Implement pinch-to-zoom (always enabled)
- [ ] Implement two-finger pan
- [ ] Implement single-finger pan

### Mobile Touch Constants

```typescript
// Gesture timing thresholds
export const TAP_MAX_DURATION = 200       // ms
export const DOUBLETAP_MAX_GAP = 300      // ms
export const LONGPRESS_DURATION = 500     // ms

// Distance thresholds
export const TAP_MAX_DISTANCE = 10        // px
export const PAN_MIN_DISTANCE = 5         // px

// Touch target sizes
export const MIN_TOUCH_TARGET = 44        // px (iOS/Android guidelines)
```

---

## Deliverable 3.3: Layer Base Class

### Requirements

1. Abstract base class for all layers
2. Common z-index management
3. Common pointer-events management
4. Container element creation

### Interface Contract

```typescript
export abstract class BaseLayer implements Layer {
	readonly #container: HTMLElement
	readonly #zIndex: number
	#isActive = false

	constructor(parent: HTMLElement, zIndex: number)

	get zIndex(): number
	isActive(): boolean
	activate(): void
	deactivate(): void

	protected abstract onRender(pageNumber:  number, scale: number): void
	protected abstract onResize(width: number, height: number): void
	protected abstract onActivate(): void
	protected abstract onDeactivate(): void
	protected abstract onDestroy(): void

	render(pageNumber: number, scale:  number): void
	resize(width: number, height: number): void
	destroy(): void

	protected getContainer(): HTMLElement
}
```

### Implementation Checklist

- [ ] Create `src/core/layers/BaseLayer.ts`
- [ ] Implement container div creation
- [ ] Implement z-index management
- [ ] Implement pointer-events toggling
- [ ] Implement activation/deactivation hooks
- [ ] Implement destroy cleanup

---

## Deliverable 3.4: Coordinate Transforms

### Requirements

1. Convert client coordinates to page coordinates
2. Handle zoom and devicePixelRatio
3. Handle page rotation

### Interface Contract

```typescript
export interface CoordinateTransform {
	clientToPage(clientX: number, clientY: number): Point
	pageToClient(pageX: number, pageY: number): Point
	setScale(scale: number): void
	setRotation(rotation: PageRotation): void
	setOffset(offsetX: number, offsetY: number): void
}
```

### Implementation Checklist

- [ ] Create `src/core/geometry/CoordinateTransform. ts`
- [ ] Implement client-to-page transform
- [ ] Implement page-to-client transform
- [ ] Handle zoom scaling
- [ ] Handle devicePixelRatio
- [ ] Handle rotation (0, 90, 180, 270)

---

## Deliverable 3.5: Unit Tests

### Implementation Checklist

- [ ] Create `tests/core/layers/LayerStack. test.ts`
- [ ] Create `tests/core/input/GestureRecognizer.test. ts`
- [ ] Create `tests/core/layers/BaseLayer.test.ts`
- [ ] Create `tests/core/geometry/CoordinateTransform.test.ts`
- [ ] Test mode switching activates correct layer
- [ ] Test gesture recognition thresholds
- [ ] Test coordinate transforms at various zoom levels

## Phase Completion Criteria

All of the following must be true:

- [ ] All deliverables marked ✅ Done
- [ ] Mode switching correctly activates/deactivates layers
- [ ] Pinch-to-zoom works regardless of mode
- [ ] Gesture recognition works on touch devices
- [ ] `npm run check` passes
- [ ] `npm run test` passes
- [ ] PLAN.md updated to show Phase 3 complete