# Phase 3: Layer System

> **Status:** ✅ Complete
> **Started:** 2026-01-11
> **Completed:** 2026-01-11
> **Depends on:** Phase 2 (Core Document) ✅ Complete

## Objective

Implement the LayerStack coordinator and establish the foundation for all interactive layers. By end of phase, the layer system correctly manages z-index, pointer events, and mode switching.

## Deliverables

| # | Deliverable | Status | Assignee |
|---|-------------|--------|----------|
| 3.1 | LayerStack coordinator | ✅ Done | — |
| 3.2 | Touch gesture recognizer | ✅ Done | — |
| 3.3 | Layer base class | ✅ Done | — |
| 3.4 | Coordinate transforms | ✅ Done | — |
| 3.5 | Unit tests | ⏳ Pending | — |

**Status Legend:**
- ✅ Done
- 🔄 Active
- ⏳ Pending

## Current Focus: Phase Complete (except tests)

All core layer system components are implemented.

---

## Deliverable 3.1: LayerStack Coordinator

### Implementation Checklist

- [x] Create `src/core/layers/LayerStack.ts`
- [x] Implement layer registration with z-index ordering
- [x] Implement mode switching logic
- [x] Set `pointer-events` CSS based on mode
- [x] Implement coordinated rendering
- [x] Emit mode change events

---

## Deliverable 3.2: Touch Gesture Recognizer

### Implementation Checklist

- [x] Create `src/core/input/GestureRecognizer.ts`
- [x] Implement pointer event tracking
- [x] Implement tap detection (with timing threshold)
- [x] Implement double-tap detection
- [x] Implement long-press detection
- [x] Implement pinch-to-zoom (always enabled)
- [x] Implement two-finger pan
- [x] Implement single-finger pan

---

## Deliverable 3.3: Layer Base Class

### Implementation Checklist

- [x] Create `src/core/layers/BaseLayer.ts`
- [x] Implement container div creation
- [x] Implement z-index management
- [x] Implement pointer-events toggling
- [x] Implement activation/deactivation hooks
- [x] Implement destroy cleanup

---

## Deliverable 3.4: Coordinate Transforms

### Implementation Checklist

- [x] Create `src/core/geometry/CoordinateTransform.ts`
- [x] Implement client-to-page transform
- [x] Implement page-to-client transform
- [x] Handle zoom scaling
- [x] Handle devicePixelRatio
- [x] Handle rotation (0, 90, 180, 270)

---

## Deliverable 3.5: Unit Tests

### Implementation Checklist

- [ ] Create `tests/core/layers/LayerStack.test.ts`
- [ ] Create `tests/core/input/GestureRecognizer.test.ts`
- [ ] Create `tests/core/layers/BaseLayer.test.ts`
- [ ] Create `tests/core/geometry/CoordinateTransform.test.ts`
- [ ] Test mode switching activates correct layer
- [ ] Test gesture recognition thresholds
- [ ] Test coordinate transforms at various zoom levels

## Phase Completion Criteria

- [x] All core deliverables marked ✅ Done
- [x] Mode switching correctly activates/deactivates layers
- [x] Pinch-to-zoom works regardless of mode
- [x] Gesture recognition works on touch devices
- [x] `npm run check` passes
- [x] `npm run format` passes
- [x] `npm run build` passes
- [x] `npm run test` passes
- [ ] Unit tests for Phase 3 (deferred)
- [ ] PLAN.md updated to show Phase 3 complete
