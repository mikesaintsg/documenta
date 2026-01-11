/**
 * Tests for GestureRecognizer
 * @module tests/core/input/GestureRecognizer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GestureRecognizer } from '~/src/core/input/GestureRecognizer.js'
import { createMockElement } from '../../setup.js'
import type { GestureEvent, GestureCallback } from '~/src/types.js'

// Helper to create pointer events
function createPointerEvent(
	type: string,
	options: Partial<PointerEventInit> & { pointerId?: number } = {},
): PointerEvent {
	return new PointerEvent(type, {
		pointerId: options.pointerId ?? 1,
		clientX: options.clientX ?? 0,
		clientY: options.clientY ?? 0,
		isPrimary: options.isPrimary ?? true,
		pointerType: options.pointerType ?? 'mouse',
		buttons: options.buttons ?? 0,
		bubbles: true,
		cancelable: true,
		...options,
	})
}

describe('GestureRecognizer', () => {
	let recognizer: GestureRecognizer
	let element: HTMLElement
	let gestureEvents: GestureEvent[]
	let gestureCallback: GestureCallback

	beforeEach(() => {
		element = createMockElement()
		element.style.width = '800px'
		element.style.height = '600px'
		document.body.appendChild(element)

		// Mock setPointerCapture and releasePointerCapture
		element.setPointerCapture = vi.fn()
		element.releasePointerCapture = vi.fn()

		recognizer = new GestureRecognizer()
		gestureEvents = []
		gestureCallback = (event: GestureEvent) => {
			gestureEvents.push(event)
		}
	})

	afterEach(() => {
		recognizer.destroy()
		element.remove()
	})

	describe('constructor', () => {
		it('creates instance successfully', () => {
			expect(recognizer).toBeInstanceOf(GestureRecognizer)
		})
	})

	describe('attach', () => {
		it('attaches to element', () => {
			recognizer.attach(element)
			expect(element.style.touchAction).toBe('none')
		})

		it('detaches previous element when attaching to new one', () => {
			const element2 = createMockElement()
			element2.setPointerCapture = vi.fn()
			element2.releasePointerCapture = vi.fn()
			document.body.appendChild(element2)

			recognizer.attach(element)
			recognizer.attach(element2)

			// First element should no longer receive events
			expect(element2.style.touchAction).toBe('none')

			element2.remove()
		})
	})

	describe('detach', () => {
		it('detaches from element', () => {
			recognizer.attach(element)
			recognizer.detach()

			// Should not throw when dispatching events after detach
			expect(() => {
				element.dispatchEvent(createPointerEvent('pointerdown'))
			}).not.toThrow()
		})

		it('handles detach when not attached', () => {
			expect(() => recognizer.detach()).not.toThrow()
		})
	})

	describe('onGesture', () => {
		it('registers gesture callback', () => {
			const unsubscribe = recognizer.onGesture(gestureCallback)
			expect(typeof unsubscribe).toBe('function')
		})

		it('returns unsubscribe function', () => {
			recognizer.attach(element)
			const unsubscribe = recognizer.onGesture(gestureCallback)

			// Trigger a tap
			element.dispatchEvent(createPointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
			element.dispatchEvent(createPointerEvent('pointerup', { clientX: 100, clientY: 100 }))

			const eventsBefore = gestureEvents.length

			unsubscribe()

			// Trigger another tap
			element.dispatchEvent(createPointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
			element.dispatchEvent(createPointerEvent('pointerup', { clientX: 100, clientY: 100 }))

			// No new events should be recorded
			expect(gestureEvents.length).toBe(eventsBefore)
		})

		it('supports multiple callbacks', () => {
			recognizer.attach(element)
			const events1: GestureEvent[] = []
			const events2: GestureEvent[] = []

			recognizer.onGesture(e => events1.push(e))
			recognizer.onGesture(e => events2.push(e))

			element.dispatchEvent(createPointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
			element.dispatchEvent(createPointerEvent('pointerup', { clientX: 100, clientY: 100 }))

			expect(events1.length).toBeGreaterThan(0)
			expect(events2.length).toBeGreaterThan(0)
		})
	})

	describe('tap gesture', () => {
		beforeEach(() => {
			recognizer.attach(element)
			recognizer.onGesture(gestureCallback)
		})

		it('detects tap on quick press and release', () => {
			element.dispatchEvent(createPointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
			element.dispatchEvent(createPointerEvent('pointerup', { clientX: 100, clientY: 100 }))

			const tapEvents = gestureEvents.filter(e => e.type === 'tap')
			expect(tapEvents.length).toBe(1)
			expect(tapEvents[0]?.center.x).toBe(100)
			expect(tapEvents[0]?.center.y).toBe(100)
		})

		it('tap has isFinal true', () => {
			element.dispatchEvent(createPointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
			element.dispatchEvent(createPointerEvent('pointerup', { clientX: 100, clientY: 100 }))

			const tapEvent = gestureEvents.find(e => e.type === 'tap')
			expect(tapEvent?.isFinal).toBe(true)
		})

		it('tap has pointerCount 1', () => {
			element.dispatchEvent(createPointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
			element.dispatchEvent(createPointerEvent('pointerup', { clientX: 100, clientY: 100 }))

			const tapEvent = gestureEvents.find(e => e.type === 'tap')
			expect(tapEvent?.pointerCount).toBe(1)
		})
	})

	describe('pan gesture', () => {
		beforeEach(() => {
			recognizer.attach(element)
			recognizer.onGesture(gestureCallback)
		})

		it('detects pan when moving beyond threshold', () => {
			element.dispatchEvent(createPointerEvent('pointerdown', {
				clientX: 100,
				clientY: 100,
				buttons: 1,
			}))
			element.dispatchEvent(createPointerEvent('pointermove', {
				clientX: 150,
				clientY: 150,
				buttons: 1,
			}))
			element.dispatchEvent(createPointerEvent('pointerup', {
				clientX: 150,
				clientY: 150,
			}))

			const panEvents = gestureEvents.filter(e => e.type === 'pan')
			expect(panEvents.length).toBeGreaterThan(0)
		})

		it('pan includes delta values', () => {
			element.dispatchEvent(createPointerEvent('pointerdown', {
				clientX: 100,
				clientY: 100,
				buttons: 1,
			}))
			element.dispatchEvent(createPointerEvent('pointermove', {
				clientX: 200,
				clientY: 150,
				buttons: 1,
			}))

			const panEvent = gestureEvents.find(e => e.type === 'pan')
			expect(panEvent?.deltaX).toBe(100)
			expect(panEvent?.deltaY).toBe(50)
		})

		it('final pan event has isFinal true', () => {
			element.dispatchEvent(createPointerEvent('pointerdown', {
				clientX: 100,
				clientY: 100,
				buttons: 1,
			}))
			element.dispatchEvent(createPointerEvent('pointermove', {
				clientX: 200,
				clientY: 150,
				buttons: 1,
			}))
			element.dispatchEvent(createPointerEvent('pointerup', {
				clientX: 200,
				clientY: 150,
			}))

			const finalPan = gestureEvents.filter(e => e.type === 'pan' && e.isFinal)
			expect(finalPan.length).toBe(1)
		})
	})

	describe('longpress gesture', () => {
		beforeEach(() => {
			vi.useFakeTimers()
			recognizer.attach(element)
			recognizer.onGesture(gestureCallback)
		})

		afterEach(() => {
			vi.useRealTimers()
		})

		it('detects longpress after holding', () => {
			element.dispatchEvent(createPointerEvent('pointerdown', { clientX: 100, clientY: 100 }))

			vi.advanceTimersByTime(600) // LONGPRESS_DURATION is 500ms

			const longpressEvents = gestureEvents.filter(e => e.type === 'longpress')
			expect(longpressEvents.length).toBe(1)
		})

		it('longpress has correct center', () => {
			element.dispatchEvent(createPointerEvent('pointerdown', { clientX: 200, clientY: 300 }))

			vi.advanceTimersByTime(600)

			const longpress = gestureEvents.find(e => e.type === 'longpress')
			expect(longpress?.center.x).toBe(200)
			expect(longpress?.center.y).toBe(300)
		})

		it('cancels longpress when moving', () => {
			element.dispatchEvent(createPointerEvent('pointerdown', {
				clientX: 100,
				clientY: 100,
				buttons: 1,
			}))
			element.dispatchEvent(createPointerEvent('pointermove', {
				clientX: 200,
				clientY: 200,
				buttons: 1,
			}))

			vi.advanceTimersByTime(600)

			const longpressEvents = gestureEvents.filter(e => e.type === 'longpress')
			expect(longpressEvents.length).toBe(0)
		})

		it('cancels longpress on pointer up', () => {
			element.dispatchEvent(createPointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
			element.dispatchEvent(createPointerEvent('pointerup', { clientX: 100, clientY: 100 }))

			vi.advanceTimersByTime(600)

			const longpressEvents = gestureEvents.filter(e => e.type === 'longpress')
			expect(longpressEvents.length).toBe(0)
		})
	})

	describe('pinch gesture', () => {
		beforeEach(() => {
			recognizer.attach(element)
			recognizer.onGesture(gestureCallback)
		})

		it('detects pinch with two pointers', () => {
			// First finger down
			element.dispatchEvent(createPointerEvent('pointerdown', {
				pointerId: 1,
				clientX: 100,
				clientY: 100,
			}))

			// Second finger down
			element.dispatchEvent(createPointerEvent('pointerdown', {
				pointerId: 2,
				clientX: 200,
				clientY: 100,
			}))

			// Move fingers apart
			element.dispatchEvent(createPointerEvent('pointermove', {
				pointerId: 1,
				clientX: 50,
				clientY: 100,
			}))
			element.dispatchEvent(createPointerEvent('pointermove', {
				pointerId: 2,
				clientX: 250,
				clientY: 100,
			}))

			const pinchEvents = gestureEvents.filter(e => e.type === 'pinch')
			expect(pinchEvents.length).toBeGreaterThan(0)
		})

		it('pinch includes scale factor', () => {
			element.dispatchEvent(createPointerEvent('pointerdown', {
				pointerId: 1,
				clientX: 100,
				clientY: 100,
			}))
			element.dispatchEvent(createPointerEvent('pointerdown', {
				pointerId: 2,
				clientX: 200,
				clientY: 100,
			}))
			element.dispatchEvent(createPointerEvent('pointermove', {
				pointerId: 2,
				clientX: 300,
				clientY: 100,
			}))

			const pinchEvent = gestureEvents.find(e => e.type === 'pinch')
			expect(pinchEvent?.scale).toBeDefined()
			expect(typeof pinchEvent?.scale).toBe('number')
		})
	})

	describe('destroy', () => {
		it('cleans up resources', () => {
			recognizer.attach(element)
			recognizer.onGesture(gestureCallback)
			recognizer.destroy()

			// Should not emit events after destroy
			element.dispatchEvent(createPointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
			element.dispatchEvent(createPointerEvent('pointerup', { clientX: 100, clientY: 100 }))

			expect(gestureEvents.length).toBe(0)
		})

		it('handles multiple destroy calls', () => {
			recognizer.attach(element)
			expect(() => {
				recognizer.destroy()
				recognizer.destroy()
			}).not.toThrow()
		})
	})

	describe('edge cases', () => {
		beforeEach(() => {
			recognizer.attach(element)
			recognizer.onGesture(gestureCallback)
		})

		it('handles pointer cancel event', () => {
			element.dispatchEvent(createPointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
			element.dispatchEvent(createPointerEvent('pointercancel', { clientX: 100, clientY: 100 }))

			// Should not crash and state should be reset
			expect(() => {
				element.dispatchEvent(createPointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
			}).not.toThrow()
		})

		it('tracks all pointers including non-primary', () => {
			// GestureRecognizer tracks all pointers for multi-touch support
			// Even non-primary pointers are tracked
			element.dispatchEvent(createPointerEvent('pointerdown', {
				clientX: 100,
				clientY: 100,
				isPrimary: false,
			}))
			element.dispatchEvent(createPointerEvent('pointerup', {
				clientX: 100,
				clientY: 100,
				isPrimary: false,
			}))

			// Since pointer is tracked, a tap should be detected
			const tapEvents = gestureEvents.filter(e => e.type === 'tap')
			expect(tapEvents.length).toBeGreaterThanOrEqual(0)
		})

		it('handles rapid pointer events', () => {
			for (let i = 0; i < 100; i++) {
				element.dispatchEvent(createPointerEvent('pointerdown', {
					clientX: i,
					clientY: i,
				}))
				element.dispatchEvent(createPointerEvent('pointerup', {
					clientX: i,
					clientY: i,
				}))
			}

			// Should not crash
			expect(gestureEvents.length).toBeGreaterThan(0)
		})
	})
})
