/**
 * GestureRecognizer - Touch and mouse gesture detection
 * @module core/input/GestureRecognizer
 *
 * Detects taps, double-taps, long-press, pan, and pinch gestures.
 */

import type {
	GestureRecognizerInterface,
	GestureEvent,
	GestureCallback,
	Point,
	Unsubscribe,
} from '../../types.js'
import {
	TAP_MAX_DURATION,
	DOUBLETAP_MAX_GAP,
	LONGPRESS_DURATION,
	TAP_MAX_DISTANCE,
	PAN_MIN_DISTANCE,
	PINCH_THRESHOLD,
} from '../../constants.js'
import { getCenterPoint, getPinchDistance, distanceSquared } from '../../helpers.js'

/**
 * Tracked pointer data
 */
interface PointerData {
	id: number
	startX: number
	startY: number
	currentX: number
	currentY: number
	startTime: number
}

/**
 * GestureRecognizer - Detects touch and mouse gestures
 *
 * @remarks
 * - Pinch-to-zoom is always enabled regardless of mode
 * - Two-finger pan is always enabled
 * - Single-finger behavior depends on mode (handled by layers)
 */
export class GestureRecognizer implements GestureRecognizerInterface {
	#element: HTMLElement | undefined
	#pointers = new Map<number, PointerData>()
	#gestureListeners = new Set<GestureCallback>()

	// Gesture state
	#lastTapTime = 0
	#lastTapPoint: Point | undefined
	#longPressTimer: ReturnType<typeof setTimeout> | undefined
	#isPanning = false
	#isPinching = false
	#initialPinchDistance = 0

	// Bound event handlers
	#onPointerDown: (e: PointerEvent) => void
	#onPointerMove: (e: PointerEvent) => void
	#onPointerUp: (e: PointerEvent) => void
	#onPointerCancel: (e: PointerEvent) => void

	constructor() {
		this.#onPointerDown = this.#handlePointerDown.bind(this)
		this.#onPointerMove = this.#handlePointerMove.bind(this)
		this.#onPointerUp = this.#handlePointerUp.bind(this)
		this.#onPointerCancel = this.#handlePointerCancel.bind(this)
	}

	attach(element: HTMLElement): void {
		this.detach()
		this.#element = element

		element.addEventListener('pointerdown', this.#onPointerDown)
		element.addEventListener('pointermove', this.#onPointerMove)
		element.addEventListener('pointerup', this.#onPointerUp)
		element.addEventListener('pointercancel', this.#onPointerCancel)

		// Prevent default touch behavior
		element.style.touchAction = 'none'
	}

	detach(): void {
		if (this.#element) {
			this.#element.removeEventListener('pointerdown', this.#onPointerDown)
			this.#element.removeEventListener('pointermove', this.#onPointerMove)
			this.#element.removeEventListener('pointerup', this.#onPointerUp)
			this.#element.removeEventListener('pointercancel', this.#onPointerCancel)
			this.#element = undefined
		}
		this.#clearState()
	}

	onGesture(callback: GestureCallback): Unsubscribe {
		this.#gestureListeners.add(callback)
		return () => this.#gestureListeners.delete(callback)
	}

	destroy(): void {
		this.detach()
		this.#gestureListeners.clear()
	}

	#handlePointerDown(e: PointerEvent): void {
		// Only handle touch events - let mouse events pass through for native scrolling
		if (e.pointerType === 'mouse') return

		// Track pointer
		const data: PointerData = {
			id: e.pointerId,
			startX: e.clientX,
			startY: e.clientY,
			currentX: e.clientX,
			currentY: e.clientY,
			startTime: Date.now(),
		}
		this.#pointers.set(e.pointerId, data)

		// Capture pointer
		if (this.#element) {
			this.#element.setPointerCapture(e.pointerId)
		}

		// Handle multi-touch
		if (this.#pointers.size === 2) {
			// Start pinch
			this.#cancelLongPress()
			this.#isPinching = true
			this.#isPanning = false
			this.#initialPinchDistance = this.#getCurrentPinchDistance()
		} else if (this.#pointers.size === 1) {
			// Start long-press timer
			this.#startLongPressTimer(data)
		}
	}

	#handlePointerMove(e: PointerEvent): void {
		// Only handle touch events - let mouse events pass through
		if (e.pointerType === 'mouse') return

		const data = this.#pointers.get(e.pointerId)
		if (!data) return

		data.currentX = e.clientX
		data.currentY = e.clientY

		const distSq = distanceSquared(data.startX, data.startY, data.currentX, data.currentY)

		if (this.#pointers.size >= 2) {
			// Two-finger gesture
			if (this.#isPinching) {
				this.#handlePinch()
			} else {
				this.#handleTwoFingerPan()
			}
		} else if (this.#pointers.size === 1) {
			// Single-finger gesture
			if (distSq > TAP_MAX_DISTANCE * TAP_MAX_DISTANCE) {
				this.#cancelLongPress()

				if (!this.#isPanning && distSq > PAN_MIN_DISTANCE * PAN_MIN_DISTANCE) {
					this.#isPanning = true
				}

				if (this.#isPanning) {
					this.#emitGesture({
						type: 'pan',
						center: { x: data.currentX, y: data.currentY },
						deltaX: data.currentX - data.startX,
						deltaY: data.currentY - data.startY,
						pointerCount: 1,
						isFinal: false,
					})
				}
			}
		}
	}

	#handlePointerUp(e: PointerEvent): void {
		// Only handle touch events - let mouse events pass through
		if (e.pointerType === 'mouse') return

		const data = this.#pointers.get(e.pointerId)
		if (!data) return

		this.#cancelLongPress()
		this.#pointers.delete(e.pointerId)

		// Release pointer capture
		if (this.#element) {
			try {
				this.#element.releasePointerCapture(e.pointerId)
			} catch {
				// Ignore if already released
			}
		}

		const now = Date.now()
		const duration = now - data.startTime
		const distSq = distanceSquared(data.startX, data.startY, data.currentX, data.currentY)

		// Handle tap
		if (
			duration < TAP_MAX_DURATION &&
			distSq < TAP_MAX_DISTANCE * TAP_MAX_DISTANCE &&
			!this.#isPanning &&
			!this.#isPinching
		) {
			const tapPoint = { x: data.currentX, y: data.currentY }

			// Check for double-tap
			if (
				this.#lastTapPoint &&
				now - this.#lastTapTime < DOUBLETAP_MAX_GAP
			) {
				const tapDistSq = distanceSquared(
					tapPoint.x, tapPoint.y,
					this.#lastTapPoint.x, this.#lastTapPoint.y,
				)
				if (tapDistSq < TAP_MAX_DISTANCE * TAP_MAX_DISTANCE) {
					this.#emitGesture({
						type: 'doubletap',
						center: tapPoint,
						pointerCount: 1,
						isFinal: true,
					})
					this.#lastTapTime = 0
					this.#lastTapPoint = undefined
					return
				}
			}

			// Single tap
			this.#emitGesture({
				type: 'tap',
				center: tapPoint,
				pointerCount: 1,
				isFinal: true,
			})
			this.#lastTapTime = now
			this.#lastTapPoint = tapPoint
		}

		// Final pan event
		if (this.#isPanning && this.#pointers.size === 0) {
			this.#emitGesture({
				type: 'pan',
				center: { x: data.currentX, y: data.currentY },
				deltaX: data.currentX - data.startX,
				deltaY: data.currentY - data.startY,
				pointerCount: 0,
				isFinal: true,
			})
		}

		// Final pinch event
		if (this.#isPinching && this.#pointers.size < 2) {
			const scale = this.#getCurrentPinchDistance() / this.#initialPinchDistance
			this.#emitGesture({
				type: 'pinch',
				center: { x: data.currentX, y: data.currentY },
				scale,
				pointerCount: this.#pointers.size,
				isFinal: true,
			})
		}

		// Reset state if no pointers
		if (this.#pointers.size === 0) {
			this.#isPanning = false
			this.#isPinching = false
		}
	}

	#handlePointerCancel(e: PointerEvent): void {
		// Only handle touch events - let mouse events pass through
		if (e.pointerType === 'mouse') return

		this.#pointers.delete(e.pointerId)
		this.#cancelLongPress()

		if (this.#pointers.size === 0) {
			this.#isPanning = false
			this.#isPinching = false
		}
	}

	#handlePinch(): void {
		if (this.#initialPinchDistance === 0) return

		const currentDistance = this.#getCurrentPinchDistance()
		const scale = currentDistance / this.#initialPinchDistance

		// Only emit if scale changed significantly
		if (Math.abs(scale - 1) > PINCH_THRESHOLD) {
			this.#emitGesture({
				type: 'pinch',
				center: this.#getPointerCenter(),
				scale,
				pointerCount: this.#pointers.size,
				isFinal: false,
			})
		}
	}

	#handleTwoFingerPan(): void {
		const pointers = Array.from(this.#pointers.values())
		if (pointers.length < 2) return

		const first = pointers[0]
		const second = pointers[1]
		if (!first || !second) return

		const deltaX = ((first.currentX - first.startX) + (second.currentX - second.startX)) / 2
		const deltaY = ((first.currentY - first.startY) + (second.currentY - second.startY)) / 2

		this.#emitGesture({
			type: 'twofingerpan',
			center: this.#getPointerCenter(),
			deltaX,
			deltaY,
			pointerCount: 2,
			isFinal: false,
		})
	}

	#startLongPressTimer(data: PointerData): void {
		this.#cancelLongPress()
		this.#longPressTimer = setTimeout(() => {
			const distSq = distanceSquared(data.startX, data.startY, data.currentX, data.currentY)
			if (distSq < TAP_MAX_DISTANCE * TAP_MAX_DISTANCE) {
				this.#emitGesture({
					type: 'longpress',
					center: { x: data.currentX, y: data.currentY },
					pointerCount: 1,
					isFinal: true,
				})
			}
		}, LONGPRESS_DURATION)
	}

	#cancelLongPress(): void {
		if (this.#longPressTimer) {
			clearTimeout(this.#longPressTimer)
			this.#longPressTimer = undefined
		}
	}

	#getCurrentPinchDistance(): number {
		const pointers = Array.from(this.#pointers.values())
		if (pointers.length < 2) return 0

		const first = pointers[0]
		const second = pointers[1]
		if (!first || !second) return 0

		return getPinchDistance(
			{ x: first.currentX, y: first.currentY },
			{ x: second.currentX, y: second.currentY },
		)
	}

	#getPointerCenter(): Point {
		const points: Point[] = Array.from(this.#pointers.values()).map(p => ({
			x: p.currentX,
			y: p.currentY,
		}))
		return getCenterPoint(points)
	}

	#emitGesture(event: GestureEvent): void {
		for (const listener of this.#gestureListeners) {
			listener(event)
		}
	}

	#clearState(): void {
		this.#cancelLongPress()
		this.#pointers.clear()
		this.#isPanning = false
		this.#isPinching = false
		this.#initialPinchDistance = 0
	}
}
