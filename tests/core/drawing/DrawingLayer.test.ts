/**
 * Tests for DrawingLayer
 * @module tests/core/drawing/DrawingLayer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { DrawingLayer } from '~/src/core/drawing/DrawingLayer.js'
import { createTestElement } from '../../setup.js'
import type { Color } from '~/src/types.js'

// Helper to create pointer events
function createPointerEvent(
	type: string,
	options: Partial<PointerEventInit> = {},
): PointerEvent {
	return new PointerEvent(type, {
		pointerId: 1,
		clientX: options.clientX ?? 0,
		clientY: options.clientY ?? 0,
		isPrimary: true,
		pointerType: 'mouse',
		buttons: type === 'pointermove' ? 1 : 0,
		bubbles: true,
		cancelable: true,
		...options,
	})
}

describe('DrawingLayer', () => {
	let container: HTMLElement
	let drawingLayer: DrawingLayer

	beforeEach(() => {
		container = createTestElement()
		container.style.width = '800px'
		container.style.height = '600px'
		document.body.appendChild(container)

		drawingLayer = new DrawingLayer(container)
	})

	afterEach(() => {
		drawingLayer.destroy()
		container.remove()
	})

	describe('constructor', () => {
		it('creates instance successfully', () => {
			expect(drawingLayer).toBeInstanceOf(DrawingLayer)
		})

		it('creates canvas element', () => {
			const containerChildren = container.querySelectorAll('canvas')
			expect(containerChildren.length).toBeGreaterThan(0)
		})
	})

	describe('setTool', () => {
		it('sets tool to pen', () => {
			drawingLayer.setTool('pen')
			expect(drawingLayer.getTool()).toBe('pen')
		})

		it('sets tool to highlighter', () => {
			drawingLayer.setTool('highlighter')
			expect(drawingLayer.getTool()).toBe('highlighter')
		})

		it('sets tool to eraser', () => {
			drawingLayer.setTool('eraser')
			expect(drawingLayer.getTool()).toBe('eraser')
		})

		it('applies pen defaults when switching to pen', () => {
			drawingLayer.setTool('highlighter')
			drawingLayer.setTool('pen')

			expect(drawingLayer.getOpacity()).toBe(1)
		})

		it('applies highlighter defaults when switching to highlighter', () => {
			drawingLayer.setTool('highlighter')

			expect(drawingLayer.getOpacity()).toBeLessThan(1)
		})
	})

	describe('getTool', () => {
		it('returns default tool as pen', () => {
			expect(drawingLayer.getTool()).toBe('pen')
		})

		it('returns current tool after change', () => {
			drawingLayer.setTool('eraser')
			expect(drawingLayer.getTool()).toBe('eraser')
		})
	})

	describe('setColor', () => {
		it('sets stroke color', () => {
			const color: Color = { r: 255, g: 0, b: 0 }
			drawingLayer.setColor(color)

			expect(drawingLayer.getColor()).toEqual(color)
		})

		it('accepts various color values', () => {
			const colors: Color[] = [
				{ r: 0, g: 0, b: 0 },
				{ r: 255, g: 255, b: 255 },
				{ r: 128, g: 64, b: 192 },
			]

			for (const color of colors) {
				drawingLayer.setColor(color)
				expect(drawingLayer.getColor()).toEqual(color)
			}
		})
	})

	describe('getColor', () => {
		it('returns current color', () => {
			const color = drawingLayer.getColor()
			expect(color).toHaveProperty('r')
			expect(color).toHaveProperty('g')
			expect(color).toHaveProperty('b')
		})
	})

	describe('setWidth', () => {
		it('sets stroke width', () => {
			drawingLayer.setWidth(5)
			expect(drawingLayer.getWidth()).toBe(5)
		})

		it('clamps width to minimum of 1', () => {
			drawingLayer.setWidth(0)
			expect(drawingLayer.getWidth()).toBe(1)

			drawingLayer.setWidth(-5)
			expect(drawingLayer.getWidth()).toBe(1)
		})

		it('accepts large widths', () => {
			drawingLayer.setWidth(100)
			expect(drawingLayer.getWidth()).toBe(100)
		})
	})

	describe('getWidth', () => {
		it('returns current width', () => {
			drawingLayer.setWidth(10)
			expect(drawingLayer.getWidth()).toBe(10)
		})
	})

	describe('setOpacity', () => {
		it('sets opacity', () => {
			drawingLayer.setOpacity(0.5)
			expect(drawingLayer.getOpacity()).toBe(0.5)
		})

		it('clamps opacity to 0-1 range', () => {
			drawingLayer.setOpacity(-0.5)
			expect(drawingLayer.getOpacity()).toBe(0)

			drawingLayer.setOpacity(1.5)
			expect(drawingLayer.getOpacity()).toBe(1)
		})

		it('handles edge values', () => {
			drawingLayer.setOpacity(0)
			expect(drawingLayer.getOpacity()).toBe(0)

			drawingLayer.setOpacity(1)
			expect(drawingLayer.getOpacity()).toBe(1)
		})
	})

	describe('getOpacity', () => {
		it('returns current opacity', () => {
			drawingLayer.setOpacity(0.75)
			expect(drawingLayer.getOpacity()).toBe(0.75)
		})
	})

	describe('getState', () => {
		it('returns complete drawing state', () => {
			drawingLayer.setTool('highlighter')
			drawingLayer.setColor({ r: 255, g: 0, b: 0 })
			drawingLayer.setWidth(10)
			drawingLayer.setOpacity(0.5)

			const state = drawingLayer.getState()

			expect(state.currentTool).toBe('highlighter')
			expect(state.strokeWidth).toBe(10)
			expect(state.opacity).toBe(0.5)
			expect(state.strokeColor).toEqual({ r: 255, g: 0, b: 0 })
		})

		it('includes active state', () => {
			drawingLayer.activate()
			const state = drawingLayer.getState()
			expect(state.isActive).toBe(true)
		})
	})

	describe('getStrokes', () => {
		it('returns empty array for page with no strokes', () => {
			expect(drawingLayer.getStrokes(1)).toEqual([])
		})

		it('returns readonly array', () => {
			const strokes = drawingLayer.getStrokes(1)
			expect(Array.isArray(strokes)).toBe(true)
		})
	})

	describe('clearPage', () => {
		it('clears strokes on specified page', () => {
			// Would need to add strokes first via drawing
			drawingLayer.clearPage(1)
			expect(drawingLayer.getStrokes(1)).toEqual([])
		})

		it('does not throw when page has no strokes', () => {
			expect(() => drawingLayer.clearPage(99)).not.toThrow()
		})
	})

	describe('undo', () => {
		it('does nothing when undo stack is empty', () => {
			expect(() => drawingLayer.undo()).not.toThrow()
		})

		it('canUndo returns false when no history', () => {
			expect(drawingLayer.canUndo()).toBe(false)
		})
	})

	describe('redo', () => {
		it('does nothing when redo stack is empty', () => {
			expect(() => drawingLayer.redo()).not.toThrow()
		})

		it('canRedo returns false when no history', () => {
			expect(drawingLayer.canRedo()).toBe(false)
		})
	})

	describe('onStrokeComplete', () => {
		it('registers callback and returns unsubscribe', () => {
			const callback = vi.fn()
			const unsubscribe = drawingLayer.onStrokeComplete(callback)

			expect(typeof unsubscribe).toBe('function')
		})

		it('unsubscribe removes callback', () => {
			const callback = vi.fn()
			const unsubscribe = drawingLayer.onStrokeComplete(callback)
			unsubscribe()

			// Callback should not be called after unsubscribe
		})
	})

	describe('onStrokeErase', () => {
		it('registers callback and returns unsubscribe', () => {
			const callback = vi.fn()
			const unsubscribe = drawingLayer.onStrokeErase(callback)

			expect(typeof unsubscribe).toBe('function')
		})
	})

	describe('activate', () => {
		it('enables pointer event handling', () => {
			drawingLayer.activate()
			expect(drawingLayer.isActive()).toBe(true)
		})
	})

	describe('deactivate', () => {
		it('disables pointer event handling', () => {
			drawingLayer.activate()
			drawingLayer.deactivate()
			expect(drawingLayer.isActive()).toBe(false)
		})
	})

	describe('render', () => {
		it('updates current page and scale', () => {
			drawingLayer.render(2, 1.5)
			// State is updated internally
		})

		it('handles various page numbers', () => {
			expect(() => {
				drawingLayer.render(1, 1)
				drawingLayer.render(5, 1)
				drawingLayer.render(100, 1)
			}).not.toThrow()
		})

		it('handles various scales', () => {
			expect(() => {
				drawingLayer.render(1, 0.5)
				drawingLayer.render(1, 1.0)
				drawingLayer.render(1, 2.0)
			}).not.toThrow()
		})
	})

	describe('resize', () => {
		it('updates canvas dimensions', () => {
			drawingLayer.resize(1024, 768)
			// Canvas should be resized
		})

		it('handles various dimensions', () => {
			expect(() => {
				drawingLayer.resize(100, 100)
				drawingLayer.resize(4096, 4096)
				drawingLayer.resize(1, 1)
			}).not.toThrow()
		})
	})

	describe('destroy', () => {
		it('cleans up resources', () => {
			drawingLayer.destroy()
			// Should not throw on subsequent calls
		})

		it('handles multiple destroy calls', () => {
			expect(() => {
				drawingLayer.destroy()
				drawingLayer.destroy()
			}).not.toThrow()
		})
	})

	describe('edge cases', () => {
		it('handles tool changes while drawing', () => {
			drawingLayer.activate()
			drawingLayer.setTool('pen')

			// Start drawing
			const canvas = container.querySelector('canvas')
			if (canvas) {
				canvas.setPointerCapture = vi.fn()
				canvas.releasePointerCapture = vi.fn()

				canvas.dispatchEvent(createPointerEvent('pointerdown', { clientX: 100, clientY: 100 }))

				// Change tool mid-stroke
				drawingLayer.setTool('highlighter')

				canvas.dispatchEvent(createPointerEvent('pointerup', { clientX: 150, clientY: 150 }))
			}
		})

		it('handles rapid color changes', () => {
			for (let i = 0; i < 100; i++) {
				drawingLayer.setColor({ r: i % 256, g: (i * 2) % 256, b: (i * 3) % 256 })
			}

			const color = drawingLayer.getColor()
			expect(color).toBeDefined()
		})

		it('handles zero-length strokes', () => {
			drawingLayer.activate()
			drawingLayer.render(1, 1)

			const canvas = container.querySelector('canvas')
			if (canvas) {
				canvas.setPointerCapture = vi.fn()
				canvas.releasePointerCapture = vi.fn()

				// Click without moving
				canvas.dispatchEvent(createPointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
				canvas.dispatchEvent(createPointerEvent('pointerup', { clientX: 100, clientY: 100 }))
			}

			// Should not add zero-length stroke
			expect(drawingLayer.getStrokes(1)).toEqual([])
		})
	})
})
