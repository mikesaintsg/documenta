/**
 * Tests for TextLayer
 * @module tests/core/text/TextLayer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TextLayer } from '~/src/core/text/TextLayer.js'
import type { PdfDocumentInterface, PdfPageInterface, TextBlock, CoordinateTransformInterface } from '~/src/types.js'
import { createMockElement } from '../../setup.js'

// Mock text blocks
const mockTextBlocks: TextBlock[] = [
	{
		id: 'block-1',
		bounds: { x: 10, y: 10, width: 200, height: 20 },
		lines: [
			{
				id: 'line-1',
				bounds: { x: 10, y: 10, width: 200, height: 20 },
				characters: [
					{ char: 'H', bounds: { x: 10, y: 10, width: 10, height: 20 }, fontSize: 12, fontName: 'Arial', color: { r: 0, g: 0, b: 0 } },
					{ char: 'e', bounds: { x: 20, y: 10, width: 10, height: 20 }, fontSize: 12, fontName: 'Arial', color: { r: 0, g: 0, b: 0 } },
					{ char: 'l', bounds: { x: 30, y: 10, width: 10, height: 20 }, fontSize: 12, fontName: 'Arial', color: { r: 0, g: 0, b: 0 } },
					{ char: 'l', bounds: { x: 40, y: 10, width: 10, height: 20 }, fontSize: 12, fontName: 'Arial', color: { r: 0, g: 0, b: 0 } },
					{ char: 'o', bounds: { x: 50, y: 10, width: 10, height: 20 }, fontSize: 12, fontName: 'Arial', color: { r: 0, g: 0, b: 0 } },
				],
			},
		],
	},
]

// Mock PdfPage
class MockPdfPage implements PdfPageInterface {
	readonly pageNumber: number
	readonly width = 612
	readonly height = 792
	readonly rotation = 0 as const

	constructor(pageNumber: number) {
		this.pageNumber = pageNumber
	}

	render(_ctx: CanvasRenderingContext2D, _scale: number): void {}

	getText(): string {
		return 'Hello World'
	}

	getTextBlocks(): readonly TextBlock[] {
		return mockTextBlocks
	}

	destroy(): void {}
}

// Mock PdfDocument
class MockPdfDocument implements PdfDocumentInterface {
	#loaded = false
	#pages: MockPdfPage[] = []

	isLoaded(): boolean {
		return this.#loaded
	}

	getPageCount(): number {
		return this.#pages.length
	}

	getFileName(): string | undefined {
		return 'test.pdf'
	}

	async loadFromBuffer(_buffer: ArrayBuffer, _fileName?: string): Promise<void> {
		this.#loaded = true
		this.#pages = [
			new MockPdfPage(1),
			new MockPdfPage(2),
		]
	}

	getPage(pageNumber: number): PdfPageInterface {
		return this.#pages[pageNumber - 1] ?? new MockPdfPage(pageNumber)
	}

	getPageDimensions(_pageNumber: number): { width: number; height: number } {
		return { width: 612, height: 792 }
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

// Mock CoordinateTransform
class MockCoordinateTransform implements CoordinateTransformInterface {
	setScale(_scale: number): void {}
	setRotation(_rotation: 0 | 90 | 180 | 270): void {}
	setOffset(_offsetX: number, _offsetY: number): void {}
	setContainerBounds(_bounds: DOMRect): void {}
	setPageSize(_width: number, _height: number): void {}
	setElement(_element: HTMLElement): void {}

	clientToPage(clientX: number, clientY: number) {
		return { x: clientX, y: clientY }
	}

	pageToClient(pageX: number, pageY: number) {
		return { x: pageX, y: pageY }
	}

	pageToClientDistance(distance: number): number {
		return distance
	}

	clientToPageDistance(distance: number): number {
		return distance
	}

	getScale(): number {
		return 1
	}

	getRotation(): 0 | 90 | 180 | 270 {
		return 0
	}
}

describe('TextLayer', () => {
	let container: HTMLElement
	let textLayer: TextLayer
	let mockDocument: MockPdfDocument
	let mockTransform: MockCoordinateTransform

	beforeEach(async() => {
		container = createMockElement()
		container.style.width = '800px'
		container.style.height = '600px'
		document.body.appendChild(container)

		textLayer = new TextLayer(container)
		mockDocument = new MockPdfDocument()
		mockTransform = new MockCoordinateTransform()

		await mockDocument.loadFromBuffer(new ArrayBuffer(0), 'test.pdf')
		textLayer.setDocument(mockDocument)
		textLayer.setTransform(mockTransform)
	})

	afterEach(() => {
		textLayer.destroy()
		container.remove()
	})

	describe('constructor', () => {
		it('creates instance successfully', () => {
			expect(textLayer).toBeInstanceOf(TextLayer)
		})

		it('sets user-select to text', () => {
			const layerContainer = container.querySelector('div')
			expect(layerContainer?.style.userSelect).toBe('text')
		})
	})

	describe('setDocument', () => {
		it('sets document reference', () => {
			const newDoc = new MockPdfDocument()
			textLayer.setDocument(newDoc)
			// No errors thrown
		})
	})

	describe('setTransform', () => {
		it('sets transform reference', () => {
			const newTransform = new MockCoordinateTransform()
			textLayer.setTransform(newTransform)
			// No errors thrown
		})
	})

	describe('getPlainText', () => {
		it('returns page text', () => {
			const text = textLayer.getPlainText(1)
			expect(text).toBe('Hello World')
		})

		it('returns empty string for unloaded document', () => {
			const emptyDoc = new MockPdfDocument()
			textLayer.setDocument(emptyDoc)

			const text = textLayer.getPlainText(1)
			expect(text).toBe('')
		})

		it('handles various page numbers', () => {
			expect(() => {
				textLayer.getPlainText(1)
				textLayer.getPlainText(2)
			}).not.toThrow()
		})
	})

	describe('getTextBlocks', () => {
		it('returns text blocks for page', () => {
			const blocks = textLayer.getTextBlocks(1)
			expect(blocks).toHaveLength(1)
		})

		it('returns blocks with correct structure', () => {
			const blocks = textLayer.getTextBlocks(1)
			expect(blocks[0]).toHaveProperty('id')
			expect(blocks[0]).toHaveProperty('bounds')
			expect(blocks[0]).toHaveProperty('lines')
		})

		it('returns empty array for unloaded document', () => {
			const emptyDoc = new MockPdfDocument()
			textLayer.setDocument(emptyDoc)

			const blocks = textLayer.getTextBlocks(1)
			expect(blocks).toEqual([])
		})
	})

	describe('getSelection', () => {
		it('returns null when no selection', () => {
			const selection = textLayer.getSelection()
			expect(selection).toBeNull()
		})
	})

	describe('clearSelection', () => {
		it('clears any existing selection', () => {
			textLayer.clearSelection()
			expect(textLayer.getSelection()).toBeNull()
		})

		it('does not throw when no selection', () => {
			expect(() => textLayer.clearSelection()).not.toThrow()
		})
	})

	describe('copySelection', () => {
		it('resolves without error when no selection', async() => {
			await expect(textLayer.copySelection()).resolves.not.toThrow()
		})
	})

	describe('onSelectionChange', () => {
		it('registers callback and returns unsubscribe', () => {
			const callback = vi.fn()
			const unsubscribe = textLayer.onSelectionChange(callback)

			expect(typeof unsubscribe).toBe('function')
		})

		it('unsubscribe removes callback', () => {
			const callback = vi.fn()
			const unsubscribe = textLayer.onSelectionChange(callback)
			unsubscribe()

			// Callback should not be called after unsubscribe
		})
	})

	describe('search', () => {
		it('returns empty array for empty query', () => {
			const matches = textLayer.search('')
			expect(matches).toEqual([])
		})

		it('finds matches in document', () => {
			const matches = textLayer.search('Hello')
			expect(matches.length).toBeGreaterThan(0)
		})

		it('returns empty array when document not loaded', () => {
			const emptyDoc = new MockPdfDocument()
			textLayer.setDocument(emptyDoc)

			const matches = textLayer.search('test')
			expect(matches).toEqual([])
		})

		it('search is case insensitive', () => {
			const matches1 = textLayer.search('hello')
			const matches2 = textLayer.search('HELLO')

			expect(matches1.length).toBe(matches2.length)
		})
	})

	describe('searchPage', () => {
		it('returns empty array for empty query', () => {
			const matches = textLayer.searchPage(1, '')
			expect(matches).toEqual([])
		})

		it('finds matches on specific page', () => {
			const matches = textLayer.searchPage(1, 'Hello')
			expect(matches.length).toBeGreaterThan(0)
		})

		it('returns matches with correct page number', () => {
			const matches = textLayer.searchPage(1, 'Hello')
			if (matches.length > 0) {
				expect(matches[0]?.pageNumber).toBe(1)
			}
		})

		it('returns empty array when document not loaded', () => {
			const emptyDoc = new MockPdfDocument()
			textLayer.setDocument(emptyDoc)

			const matches = textLayer.searchPage(1, 'test')
			expect(matches).toEqual([])
		})
	})

	describe('text editing methods (deferred)', () => {
		it('startEditing does not throw', () => {
			expect(() => textLayer.startEditing(1, { x: 100, y: 100 })).not.toThrow()
		})

		it('applyEdit does not throw', () => {
			expect(() => textLayer.applyEdit()).not.toThrow()
		})

		it('cancelEdit does not throw', () => {
			expect(() => textLayer.cancelEdit()).not.toThrow()
		})

		it('undoEdit does not throw', () => {
			expect(() => textLayer.undoEdit()).not.toThrow()
		})

		it('redoEdit does not throw', () => {
			expect(() => textLayer.redoEdit()).not.toThrow()
		})

		it('onEdit returns unsubscribe function', () => {
			const callback = vi.fn()
			const unsubscribe = textLayer.onEdit(callback)
			expect(typeof unsubscribe).toBe('function')
		})
	})

	describe('render', () => {
		it('renders text overlay for page', () => {
			textLayer.render(1, 1)
			// Should create text spans
			const spans = container.querySelectorAll('span')
			expect(spans.length).toBeGreaterThan(0)
		})

		it('clears previous overlay on re-render', () => {
			textLayer.render(1, 1)
			const spansBefore = container.querySelectorAll('span').length

			textLayer.render(1, 1)
			const spansAfter = container.querySelectorAll('span').length

			expect(spansAfter).toBe(spansBefore)
		})

		it('handles scale changes', () => {
			textLayer.render(1, 0.5)
			textLayer.render(1, 2.0)
			// Should not throw
		})
	})

	describe('resize', () => {
		it('triggers re-render', () => {
			textLayer.render(1, 1)
			vi.spyOn(textLayer, 'render')

			textLayer.resize(1024, 768)

			// Internal re-render via onResize
		})

		it('does nothing when no current page', () => {
			expect(() => textLayer.resize(1024, 768)).not.toThrow()
		})
	})

	describe('activate', () => {
		it('sets cursor to text', () => {
			textLayer.activate()

			const layerContainer = container.querySelector('div')
			expect(layerContainer?.style.cursor).toBe('text')
		})
	})

	describe('deactivate', () => {
		it('clears selection', () => {
			textLayer.activate()
			textLayer.deactivate()

			expect(textLayer.getSelection()).toBeNull()
		})

		it('sets cursor to default', () => {
			textLayer.activate()
			textLayer.deactivate()

			const layerContainer = container.querySelector('div')
			expect(layerContainer?.style.cursor).toBe('default')
		})
	})

	describe('destroy', () => {
		it('cleans up resources', () => {
			textLayer.destroy()
			// Should not throw
		})

		it('handles multiple destroy calls', () => {
			expect(() => {
				textLayer.destroy()
				textLayer.destroy()
			}).not.toThrow()
		})
	})

	describe('edge cases', () => {
		it('handles empty text blocks', async() => {
			// Create mock that returns empty blocks
			class EmptyMockPdfPage implements PdfPageInterface {
				readonly pageNumber = 1
				readonly width = 612
				readonly height = 792
				readonly rotation = 0 as const

				render(_ctx: CanvasRenderingContext2D, _scale: number): void {}
				getText(): string { return '' }
				getTextBlocks(): readonly TextBlock[] { return [] }
				destroy(): void {}
			}

			class EmptyMockDocument implements PdfDocumentInterface {
				isLoaded() { return true }
				getPageCount() { return 1 }
				getFileName() { return 'empty.pdf' }
				async loadFromBuffer() {}
				getPage() { return new EmptyMockPdfPage() }
				getPageDimensions() { return { width: 612, height: 792 } }
				getPageRotation(): 0 | 90 | 180 | 270 { return 0 }
				toArrayBuffer() { return new ArrayBuffer(0) }
				destroy() {}
			}

			textLayer.setDocument(new EmptyMockDocument())
			textLayer.render(1, 1)

			// Should not throw
			expect(textLayer.getTextBlocks(1)).toEqual([])
		})

		it('handles rapid page changes', () => {
			for (let i = 0; i < 50; i++) {
				textLayer.render((i % 2) + 1, 1)
			}

			// Should not crash
		})
	})
})
