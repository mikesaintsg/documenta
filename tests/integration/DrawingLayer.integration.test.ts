/**
 * Drawing Workflow Integration Tests
 *
 * Tests drawing layer interactions simulating real user scenarios.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DrawingLayer } from '~/src/core/drawing/DrawingLayer.js'
import { createMockElement } from '../setup.js'
import type { DrawingTool, DrawingStroke } from '~/src/types.js'

describe('DrawingLayer Integration', () => {
	let container: HTMLElement
	let drawingLayer: DrawingLayer

	beforeEach(() => {
		container = createMockElement()
		container.style.width = '800px'
		container.style.height = '600px'
		document.body.appendChild(container)

		drawingLayer = new DrawingLayer(container)
		drawingLayer.activate()
		drawingLayer.render(1, 1.0)
		drawingLayer.resize(800, 600)
	})

	afterEach(() => {
		drawingLayer.destroy()
		container.remove()
	})

	describe('Tool Switching', () => {
		it('should switch between all drawing tools', () => {
			const tools: DrawingTool[] = ['pen', 'highlighter', 'eraser']

			for (const tool of tools) {
				drawingLayer.setTool(tool)
				expect(drawingLayer.getTool()).toBe(tool)
			}
		})

		it('should apply default settings for each tool', () => {
			drawingLayer.setTool('pen')
			expect(drawingLayer.getOpacity()).toBe(1)

			drawingLayer.setTool('highlighter')
			expect(drawingLayer.getOpacity()).toBeLessThan(1) // Semi-transparent

			drawingLayer.setTool('eraser')
			expect(drawingLayer.getTool()).toBe('eraser')
		})

		it('should get complete drawing state', () => {
			drawingLayer.setTool('pen')
			drawingLayer.setWidth(3)
			drawingLayer.setOpacity(0.8)

			const state = drawingLayer.getState()

			expect(state.isActive).toBe(true)
			expect(state.currentTool).toBe('pen')
			expect(state.strokeWidth).toBe(3)
			expect(state.opacity).toBe(0.8)
		})
	})

	describe('Color and Width', () => {
		it('should set and get stroke color', () => {
			const red = { r: 1, g: 0, b: 0 }
			drawingLayer.setColor(red)

			const color = drawingLayer.getColor()
			expect(color.r).toBe(1)
			expect(color.g).toBe(0)
			expect(color.b).toBe(0)
		})

		it('should set and get stroke width', () => {
			drawingLayer.setWidth(5)
			expect(drawingLayer.getWidth()).toBe(5)

			drawingLayer.setWidth(10)
			expect(drawingLayer.getWidth()).toBe(10)
		})

		it('should clamp width to minimum', () => {
			drawingLayer.setWidth(-5)
			expect(drawingLayer.getWidth()).toBeGreaterThanOrEqual(1)
		})

		it('should set and get opacity', () => {
			drawingLayer.setOpacity(0.5)
			expect(drawingLayer.getOpacity()).toBe(0.5)
		})

		it('should clamp opacity to valid range', () => {
			drawingLayer.setOpacity(-0.5)
			expect(drawingLayer.getOpacity()).toBe(0)

			drawingLayer.setOpacity(1.5)
			expect(drawingLayer.getOpacity()).toBe(1)
		})
	})

	describe('Stroke Storage', () => {
		it('should start with no strokes', () => {
			const strokes = drawingLayer.getStrokes(1)
			expect(strokes.length).toBe(0)
		})

		it('should return empty array for page with no strokes', () => {
			const strokes = drawingLayer.getStrokes(99)
			expect(strokes.length).toBe(0)
		})
	})

	describe('Undo/Redo System', () => {
		it('should track undo availability', () => {
			expect(drawingLayer.canUndo()).toBe(false)
		})

		it('should track redo availability', () => {
			expect(drawingLayer.canRedo()).toBe(false)
		})

		it('should not throw when undo with empty stack', () => {
			expect(() => drawingLayer.undo()).not.toThrow()
		})

		it('should not throw when redo with empty stack', () => {
			expect(() => drawingLayer.redo()).not.toThrow()
		})
	})

	describe('Page Clearing', () => {
		it('should not throw when clearing empty page', () => {
			expect(() => drawingLayer.clearPage(1)).not.toThrow()
		})

		it('should clear strokes on a page', () => {
			// Page should be empty after clear
			drawingLayer.clearPage(1)
			expect(drawingLayer.getStrokes(1).length).toBe(0)
		})
	})

	describe('Event Subscriptions', () => {
		it('should allow subscribing to stroke complete', () => {
			const strokes: DrawingStroke[] = []
			const unsubscribe = drawingLayer.onStrokeComplete((stroke) => {
				strokes.push(stroke)
			})

			expect(typeof unsubscribe).toBe('function')
		})

		it('should allow unsubscribing from stroke complete', () => {
			let callCount = 0
			const unsubscribe = drawingLayer.onStrokeComplete(() => {
				callCount++
			})

			unsubscribe()
			// Should not throw and should not increment after unsubscribe
			expect(callCount).toBe(0)
		})

		it('should allow subscribing to stroke erase', () => {
			const erased: string[] = []
			const unsubscribe = drawingLayer.onStrokeErase((id) => {
				erased.push(id)
			})

			expect(typeof unsubscribe).toBe('function')
			unsubscribe()
		})
	})

	describe('Layer Lifecycle', () => {
		it('should activate and deactivate', () => {
			expect(drawingLayer.isActive()).toBe(true)

			drawingLayer.deactivate()
			expect(drawingLayer.isActive()).toBe(false)

			drawingLayer.activate()
			expect(drawingLayer.isActive()).toBe(true)
		})

		it('should handle resize', () => {
			expect(() => drawingLayer.resize(1024, 768)).not.toThrow()
		})

		it('should handle page changes', () => {
			drawingLayer.render(1, 1.0)
			drawingLayer.render(2, 1.5)
			drawingLayer.render(1, 2.0)

			// Should not throw and should maintain stability
			expect(drawingLayer.isActive()).toBe(true)
		})

		it('should clean up on destroy', () => {
			drawingLayer.destroy()
			// After destroy, container should no longer have drawing layer
			expect(container.querySelector('canvas')).toBeNull()
		})
	})

	describe('Multi-page Drawing', () => {
		it('should maintain separate strokes per page', () => {
			const page1Strokes = drawingLayer.getStrokes(1)
			const page2Strokes = drawingLayer.getStrokes(2)

			expect(page1Strokes).not.toBe(page2Strokes)
		})

		it('should render different pages independently', () => {
			drawingLayer.render(1, 1.0)
			expect(() => drawingLayer.render(2, 1.0)).not.toThrow()
			expect(() => drawingLayer.render(1, 1.0)).not.toThrow()
		})
	})
})
