/**
 * Tests for LayerStack
 * @module tests/core/layers/LayerStack
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LayerStack } from '~/src/core/layers/LayerStack.js'
import type { LayerInterface, EditorMode } from '~/src/types.js'

// Mock layer implementation for testing
class MockLayer implements LayerInterface {
	readonly zIndex: number
	#active = false
	renderCalls: Array<{ pageNumber: number; scale: number }> = []
	resizeCalls: Array<{ width: number; height: number }> = []

	constructor(zIndex: number) {
		this.zIndex = zIndex
	}

	isActive(): boolean {
		return this.#active
	}

	activate(): void {
		this.#active = true
	}

	deactivate(): void {
		this.#active = false
	}

	render(pageNumber: number, scale: number): void {
		this.renderCalls.push({ pageNumber, scale })
	}

	resize(width: number, height: number): void {
		this.resizeCalls.push({ width, height })
	}

	destroy(): void {
		this.#active = false
	}
}

describe('LayerStack', () => {
	let layerStack: LayerStack
	let textLayer: MockLayer
	let drawingLayer: MockLayer
	let formLayer: MockLayer
	let annotationLayer: MockLayer

	beforeEach(() => {
		layerStack = new LayerStack()
		textLayer = new MockLayer(10)
		drawingLayer = new MockLayer(20)
		formLayer = new MockLayer(30)
		annotationLayer = new MockLayer(40)
	})

	describe('registerLayer', () => {
		it('registers a layer successfully', () => {
			layerStack.registerLayer('text', textLayer)
			const retrieved = layerStack.getLayer<MockLayer>('text')
			expect(retrieved).toBe(textLayer)
		})

		it('deactivates layer on registration', () => {
			textLayer.activate()
			expect(textLayer.isActive()).toBe(true)

			layerStack.registerLayer('text', textLayer)
			expect(textLayer.isActive()).toBe(false)
		})

		it('replaces existing layer with same name', () => {
			const oldLayer = new MockLayer(5)
			layerStack.registerLayer('text', oldLayer)

			layerStack.registerLayer('text', textLayer)

			const retrieved = layerStack.getLayer<MockLayer>('text')
			expect(retrieved).toBe(textLayer)
			expect(oldLayer.isActive()).toBe(false)
		})

		it('registers multiple layers', () => {
			layerStack.registerLayer('text', textLayer)
			layerStack.registerLayer('drawing', drawingLayer)
			layerStack.registerLayer('form', formLayer)

			expect(layerStack.getLayer('text')).toBe(textLayer)
			expect(layerStack.getLayer('drawing')).toBe(drawingLayer)
			expect(layerStack.getLayer('form')).toBe(formLayer)
		})

		it('activates layer if mode matches', () => {
			layerStack.setMode('text')
			layerStack.registerLayer('text', textLayer)

			expect(textLayer.isActive()).toBe(true)
		})

		it('does not activate layer if mode does not match', () => {
			layerStack.setMode('draw')
			layerStack.registerLayer('text', textLayer)

			expect(textLayer.isActive()).toBe(false)
		})
	})

	describe('unregisterLayer', () => {
		it('removes registered layer', () => {
			layerStack.registerLayer('text', textLayer)
			layerStack.unregisterLayer('text')

			expect(layerStack.getLayer('text')).toBeUndefined()
		})

		it('deactivates layer on unregister', () => {
			layerStack.setMode('text')
			layerStack.registerLayer('text', textLayer)
			expect(textLayer.isActive()).toBe(true)

			layerStack.unregisterLayer('text')
			expect(textLayer.isActive()).toBe(false)
		})

		it('handles unregistering non-existent layer', () => {
			expect(() => layerStack.unregisterLayer('text')).not.toThrow()
		})
	})

	describe('getLayer', () => {
		it('returns undefined for unregistered layer', () => {
			expect(layerStack.getLayer('text')).toBeUndefined()
		})

		it('returns registered layer', () => {
			layerStack.registerLayer('text', textLayer)
			expect(layerStack.getLayer('text')).toBe(textLayer)
		})

		it('returns typed layer', () => {
			layerStack.registerLayer('text', textLayer)
			const layer = layerStack.getLayer<MockLayer>('text')
			expect(layer?.zIndex).toBe(10)
		})
	})

	describe('setMode', () => {
		beforeEach(() => {
			layerStack.registerLayer('text', textLayer)
			layerStack.registerLayer('drawing', drawingLayer)
			layerStack.registerLayer('form', formLayer)
			layerStack.registerLayer('annotation', annotationLayer)
		})

		it('sets mode to pan (no active layer)', () => {
			layerStack.setMode('pan')
			expect(layerStack.getMode()).toBe('pan')
			expect(textLayer.isActive()).toBe(false)
			expect(drawingLayer.isActive()).toBe(false)
		})

		it('sets mode to text and activates text layer', () => {
			layerStack.setMode('text')
			expect(layerStack.getMode()).toBe('text')
			expect(textLayer.isActive()).toBe(true)
			expect(drawingLayer.isActive()).toBe(false)
		})

		it('sets mode to draw and activates drawing layer', () => {
			layerStack.setMode('draw')
			expect(layerStack.getMode()).toBe('draw')
			expect(drawingLayer.isActive()).toBe(true)
			expect(textLayer.isActive()).toBe(false)
		})

		it('sets mode to form and activates form layer', () => {
			layerStack.setMode('form')
			expect(layerStack.getMode()).toBe('form')
			expect(formLayer.isActive()).toBe(true)
		})

		it('sets mode to annotate and activates annotation layer', () => {
			layerStack.setMode('annotate')
			expect(layerStack.getMode()).toBe('annotate')
			expect(annotationLayer.isActive()).toBe(true)
		})

		it('deactivates previous layer when changing mode', () => {
			layerStack.setMode('text')
			expect(textLayer.isActive()).toBe(true)

			layerStack.setMode('draw')
			expect(textLayer.isActive()).toBe(false)
			expect(drawingLayer.isActive()).toBe(true)
		})

		it('does nothing when setting same mode', () => {
			layerStack.setMode('text')
			const callback = vi.fn()
			layerStack.onModeChange(callback)

			layerStack.setMode('text')
			expect(callback).not.toHaveBeenCalled()
		})
	})

	describe('getMode', () => {
		it('returns default mode of pan', () => {
			expect(layerStack.getMode()).toBe('pan')
		})

		it('returns current mode after change', () => {
			layerStack.setMode('text')
			expect(layerStack.getMode()).toBe('text')

			layerStack.setMode('draw')
			expect(layerStack.getMode()).toBe('draw')
		})
	})

	describe('onModeChange', () => {
		it('calls callback when mode changes', () => {
			const callback = vi.fn()
			layerStack.onModeChange(callback)

			layerStack.setMode('text')

			expect(callback).toHaveBeenCalledWith('text')
		})

		it('supports multiple listeners', () => {
			const callback1 = vi.fn()
			const callback2 = vi.fn()

			layerStack.onModeChange(callback1)
			layerStack.onModeChange(callback2)

			layerStack.setMode('draw')

			expect(callback1).toHaveBeenCalledWith('draw')
			expect(callback2).toHaveBeenCalledWith('draw')
		})

		it('returns unsubscribe function', () => {
			const callback = vi.fn()
			const unsubscribe = layerStack.onModeChange(callback)

			layerStack.setMode('text')
			expect(callback).toHaveBeenCalledTimes(1)

			unsubscribe()

			layerStack.setMode('draw')
			expect(callback).toHaveBeenCalledTimes(1)
		})
	})

	describe('render', () => {
		beforeEach(() => {
			layerStack.registerLayer('text', textLayer)
			layerStack.registerLayer('drawing', drawingLayer)
		})

		it('calls render on all layers', () => {
			layerStack.render(1, 1.5)

			expect(textLayer.renderCalls).toHaveLength(1)
			expect(textLayer.renderCalls[0]).toEqual({ pageNumber: 1, scale: 1.5 })

			expect(drawingLayer.renderCalls).toHaveLength(1)
			expect(drawingLayer.renderCalls[0]).toEqual({ pageNumber: 1, scale: 1.5 })
		})

		it('renders layers in z-index order', () => {
			const renderOrder: number[] = []

			const layer1 = new MockLayer(30)
			layer1.render = vi.fn(() => renderOrder.push(30))

			const layer2 = new MockLayer(10)
			layer2.render = vi.fn(() => renderOrder.push(10))

			const layer3 = new MockLayer(20)
			layer3.render = vi.fn(() => renderOrder.push(20))

			layerStack.registerLayer('text', layer2)
			layerStack.registerLayer('drawing', layer3)
			layerStack.registerLayer('form', layer1)

			layerStack.render(1, 1)

			expect(renderOrder).toEqual([10, 20, 30])
		})
	})

	describe('resize', () => {
		beforeEach(() => {
			layerStack.registerLayer('text', textLayer)
			layerStack.registerLayer('drawing', drawingLayer)
		})

		it('calls resize on all layers', () => {
			layerStack.resize(800, 600)

			expect(textLayer.resizeCalls).toHaveLength(1)
			expect(textLayer.resizeCalls[0]).toEqual({ width: 800, height: 600 })

			expect(drawingLayer.resizeCalls).toHaveLength(1)
			expect(drawingLayer.resizeCalls[0]).toEqual({ width: 800, height: 600 })
		})
	})

	describe('destroy', () => {
		beforeEach(() => {
			layerStack.registerLayer('text', textLayer)
			layerStack.registerLayer('drawing', drawingLayer)
		})

		it('destroys all layers', () => {
			const destroySpy1 = vi.spyOn(textLayer, 'destroy')
			const destroySpy2 = vi.spyOn(drawingLayer, 'destroy')

			layerStack.destroy()

			expect(destroySpy1).toHaveBeenCalled()
			expect(destroySpy2).toHaveBeenCalled()
		})

		it('clears all layers after destroy', () => {
			layerStack.destroy()

			expect(layerStack.getLayer('text')).toBeUndefined()
			expect(layerStack.getLayer('drawing')).toBeUndefined()
		})

		it('clears mode change listeners', () => {
			const callback = vi.fn()
			layerStack.onModeChange(callback)

			layerStack.destroy()
			layerStack.setMode('text')

			expect(callback).not.toHaveBeenCalled()
		})
	})

	describe('edge cases', () => {
		it('handles setting mode when layer is not registered', () => {
			layerStack.setMode('text')
			expect(layerStack.getMode()).toBe('text')
		})

		it('handles multiple mode changes rapidly', () => {
			layerStack.registerLayer('text', textLayer)
			layerStack.registerLayer('drawing', drawingLayer)

			const modes: EditorMode[] = ['pan', 'text', 'draw', 'text', 'pan']
			for (const mode of modes) {
				layerStack.setMode(mode)
			}

			expect(layerStack.getMode()).toBe('pan')
			expect(textLayer.isActive()).toBe(false)
			expect(drawingLayer.isActive()).toBe(false)
		})

		it('handles render with no layers', () => {
			expect(() => layerStack.render(1, 1)).not.toThrow()
		})

		it('handles resize with no layers', () => {
			expect(() => layerStack.resize(800, 600)).not.toThrow()
		})

		it('handles destroy with no layers', () => {
			expect(() => layerStack.destroy()).not.toThrow()
		})
	})
})
