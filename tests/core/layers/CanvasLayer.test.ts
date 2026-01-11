/**
 * Tests for CanvasLayer
 * @module tests/core/layers/CanvasLayer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CanvasLayer } from '~/src/core/layers/CanvasLayer.js'
import type { PdfDocumentInterface, PdfPageInterface } from '~/src/types.js'
import { createMockElement } from '../../setup.js'

// Mock PdfPage
class MockPdfPage implements PdfPageInterface {
	readonly pageNumber: number
	readonly width: number
	readonly height: number
	readonly rotation = 0 as const

	renderCalls: Array<{ scale: number }> = []

	constructor(pageNumber: number, width = 612, height = 792) {
		this.pageNumber = pageNumber
		this.width = width
		this.height = height
	}

	render(ctx: CanvasRenderingContext2D, scale: number): void {
		this.renderCalls.push({ scale })
		// Draw something to verify render was called
		ctx.fillStyle = 'white'
		ctx.fillRect(0, 0, this.width * scale, this.height * scale)
	}

	getText(): string {
		return 'Mock page text'
	}

	getTextBlocks(): readonly [] {
		return []
	}

	destroy(): void {}
}

// Mock PdfDocument
class MockPdfDocument implements PdfDocumentInterface {
	#loaded = false
	#pages: MockPdfPage[] = []
	#fileName: string | undefined

	isLoaded(): boolean {
		return this.#loaded
	}

	getPageCount(): number {
		return this.#pages.length
	}

	getFileName(): string | undefined {
		return this.#fileName
	}

	async loadFromBuffer(_buffer: ArrayBuffer, fileName?: string): Promise<void> {
		this.#loaded = true
		this.#fileName = fileName
		this.#pages = [
			new MockPdfPage(1),
			new MockPdfPage(2),
			new MockPdfPage(3),
		]
	}

	getPage(pageNumber: number): PdfPageInterface {
		const page = this.#pages[pageNumber - 1]
		if (!page) {
			throw new Error(`Invalid page number: ${pageNumber}`)
		}
		return page
	}

	getPageDimensions(pageNumber: number): { width: number; height: number } {
		const page = this.getPage(pageNumber)
		return { width: page.width, height: page.height }
	}

	getPageRotation(_pageNumber: number): 0 | 90 | 180 | 270 {
		return 0
	}

	toArrayBuffer(): ArrayBuffer {
		return new ArrayBuffer(0)
	}

	destroy(): void {
		this.#loaded = false
	}
}

describe('CanvasLayer', () => {
	let container: HTMLElement
	let canvasLayer: CanvasLayer
	let mockDocument: MockPdfDocument

	beforeEach(async() => {
		container = createMockElement()
		container.style.width = '800px'
		container.style.height = '600px'
		document.body.appendChild(container)

		canvasLayer = new CanvasLayer(container)
		mockDocument = new MockPdfDocument()
		await mockDocument.loadFromBuffer(new ArrayBuffer(0), 'test.pdf')
	})

	afterEach(() => {
		canvasLayer.destroy()
		container.remove()
	})

	describe('constructor', () => {
		it('creates canvas element', () => {
			const canvas = canvasLayer.getCanvas()
			expect(canvas).toBeInstanceOf(HTMLCanvasElement)
		})

		it('appends canvas to container', () => {
			const canvas = canvasLayer.getCanvas()
			expect(container.contains(canvas)).toBe(true)
		})

		it('sets correct z-index', () => {
			const canvas = canvasLayer.getCanvas()
			expect(canvas.style.zIndex).toBe(String(canvasLayer.zIndex))
		})

		it('positions canvas absolutely', () => {
			const canvas = canvasLayer.getCanvas()
			expect(canvas.style.position).toBe('absolute')
		})

		it('disables pointer events', () => {
			const canvas = canvasLayer.getCanvas()
			expect(canvas.style.pointerEvents).toBe('none')
		})
	})

	describe('getCanvas', () => {
		it('returns canvas element', () => {
			const canvas = canvasLayer.getCanvas()
			expect(canvas.tagName.toLowerCase()).toBe('canvas')
		})
	})

	describe('setDocument', () => {
		it('sets document reference', () => {
			canvasLayer.setDocument(mockDocument)
			// Verify by attempting to render
			canvasLayer.render(1, 1)
			// Should not throw
		})

		it('allows rendering after setting document', () => {
			canvasLayer.setDocument(mockDocument)
			expect(() => canvasLayer.render(1, 1)).not.toThrow()
		})
	})

	describe('isActive', () => {
		it('returns false by default', () => {
			expect(canvasLayer.isActive()).toBe(false)
		})

		it('returns true after activate', () => {
			canvasLayer.activate()
			expect(canvasLayer.isActive()).toBe(true)
		})

		it('returns false after deactivate', () => {
			canvasLayer.activate()
			canvasLayer.deactivate()
			expect(canvasLayer.isActive()).toBe(false)
		})
	})

	describe('activate', () => {
		it('sets active state to true', () => {
			canvasLayer.activate()
			expect(canvasLayer.isActive()).toBe(true)
		})
	})

	describe('deactivate', () => {
		it('sets active state to false', () => {
			canvasLayer.activate()
			canvasLayer.deactivate()
			expect(canvasLayer.isActive()).toBe(false)
		})
	})

	describe('render', () => {
		beforeEach(() => {
			canvasLayer.setDocument(mockDocument)
		})

		it('renders page at specified scale', () => {
			canvasLayer.render(1, 1)
			// Verify canvas has content
			const canvas = canvasLayer.getCanvas()
			expect(canvas.width).toBeGreaterThan(0)
			expect(canvas.height).toBeGreaterThan(0)
		})

		it('updates canvas dimensions based on page and scale', () => {
			canvasLayer.render(1, 2)
			const canvas = canvasLayer.getCanvas()
			// Canvas should be scaled
			expect(canvas.style.width).toBeDefined()
		})

		it('does nothing when document not loaded', () => {
			const emptyDoc = new MockPdfDocument()
			canvasLayer.setDocument(emptyDoc)

			expect(() => canvasLayer.render(1, 1)).not.toThrow()
		})

		it('handles invalid page number (too low)', () => {
			expect(() => canvasLayer.render(0, 1)).not.toThrow()
		})

		it('handles invalid page number (too high)', () => {
			expect(() => canvasLayer.render(100, 1)).not.toThrow()
		})

		it('handles various scale values', () => {
			expect(() => canvasLayer.render(1, 0.5)).not.toThrow()
			expect(() => canvasLayer.render(1, 1.5)).not.toThrow()
			expect(() => canvasLayer.render(1, 3)).not.toThrow()
		})
	})

	describe('resize', () => {
		beforeEach(() => {
			canvasLayer.setDocument(mockDocument)
			canvasLayer.render(1, 1)
		})

		it('re-renders at current page and scale', () => {
			const renderSpy = vi.spyOn(canvasLayer, 'render')
			canvasLayer.resize(1000, 800)

			expect(renderSpy).toHaveBeenCalled()
		})

		it('does nothing when no current page', () => {
			const newLayer = new CanvasLayer(container)
			newLayer.setDocument(mockDocument)

			expect(() => newLayer.resize(1000, 800)).not.toThrow()

			newLayer.destroy()
		})
	})

	describe('destroy', () => {
		it('removes canvas from DOM', () => {
			const canvas = canvasLayer.getCanvas()
			canvasLayer.destroy()

			expect(container.contains(canvas)).toBe(false)
		})

		it('clears document reference', () => {
			canvasLayer.setDocument(mockDocument)
			canvasLayer.destroy()

			// Should not crash on subsequent operations
			expect(() => canvasLayer.render(1, 1)).not.toThrow()
		})

		it('handles multiple destroy calls', () => {
			expect(() => {
				canvasLayer.destroy()
				canvasLayer.destroy()
			}).not.toThrow()
		})
	})

	describe('zIndex property', () => {
		it('has defined z-index', () => {
			expect(typeof canvasLayer.zIndex).toBe('number')
		})

		it('z-index is non-negative (canvas is base layer)', () => {
			expect(canvasLayer.zIndex).toBeGreaterThanOrEqual(0)
		})
	})

	describe('edge cases', () => {
		it('handles very large scale', () => {
			canvasLayer.setDocument(mockDocument)
			// Should clamp or handle gracefully
			expect(() => canvasLayer.render(1, 10)).not.toThrow()
		})

		it('handles very small scale', () => {
			canvasLayer.setDocument(mockDocument)
			expect(() => canvasLayer.render(1, 0.1)).not.toThrow()
		})

		it('handles rapid render calls', () => {
			canvasLayer.setDocument(mockDocument)

			for (let i = 0; i < 100; i++) {
				canvasLayer.render((i % 3) + 1, 1 + (i % 10) / 10)
			}

			// Should not crash
			expect(canvasLayer.getCanvas()).toBeInstanceOf(HTMLCanvasElement)
		})
	})
})
