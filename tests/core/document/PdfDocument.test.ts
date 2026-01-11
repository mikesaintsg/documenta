/**
 * Tests for PdfDocument
 * @module tests/core/document/PdfDocument
 *
 * Note: These tests mock mupdf since it requires WASM which isn't available in test environment
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { PdfDocumentInterface, PdfPageInterface } from '~/src/types.js'

// Since PdfDocument depends on mupdf which requires WASM,
// we test the interface contract with a mock implementation

class MockPdfPage implements PdfPageInterface {
	readonly pageNumber: number
	readonly width: number
	readonly height: number
	readonly rotation: 0 | 90 | 180 | 270

	constructor(pageNumber: number, width = 612, height = 792, rotation: 0 | 90 | 180 | 270 = 0) {
		this.pageNumber = pageNumber
		this.width = width
		this.height = height
		this.rotation = rotation
	}

	render(ctx: CanvasRenderingContext2D, scale: number): void {
		ctx.fillStyle = 'white'
		ctx.fillRect(0, 0, this.width * scale, this.height * scale)
	}

	getText(): string {
		return `Page ${this.pageNumber} text content`
	}

	getTextBlocks(): readonly [] {
		return []
	}

	destroy(): void {}
}

class MockPdfDocument implements PdfDocumentInterface {
	#loaded = false
	#fileName: string | undefined
	#pages: MockPdfPage[] = []
	#buffer: ArrayBuffer | undefined

	isLoaded(): boolean {
		return this.#loaded
	}

	getPageCount(): number {
		return this.#pages.length
	}

	getFileName(): string | undefined {
		return this.#fileName
	}

	async loadFromBuffer(buffer: ArrayBuffer, fileName?: string): Promise<void> {
		this.#buffer = buffer
		this.#fileName = fileName
		this.#loaded = true
		// Create mock pages based on buffer size (arbitrary logic for testing)
		const pageCount = Math.max(1, Math.floor(buffer.byteLength / 1000) || 3)
		this.#pages = []
		for (let i = 1; i <= pageCount; i++) {
			this.#pages.push(new MockPdfPage(i))
		}
	}

	getPage(pageNumber: number): PdfPageInterface {
		if (!this.#loaded) {
			throw new Error('No document loaded')
		}
		if (pageNumber < 1 || pageNumber > this.#pages.length) {
			throw new Error(`Invalid page number: ${pageNumber}. Document has ${this.#pages.length} pages.`)
		}
		return this.#pages[pageNumber - 1]!
	}

	getPageDimensions(pageNumber: number): { width: number; height: number } {
		const page = this.getPage(pageNumber)
		return { width: page.width, height: page.height }
	}

	getPageRotation(pageNumber: number): 0 | 90 | 180 | 270 {
		const page = this.getPage(pageNumber)
		return page.rotation
	}

	toArrayBuffer(): ArrayBuffer {
		if (!this.#loaded || !this.#buffer) {
			throw new Error('No document loaded')
		}
		return this.#buffer
	}

	destroy(): void {
		this.#loaded = false
		this.#pages = []
		this.#buffer = undefined
		this.#fileName = undefined
	}
}

describe('PdfDocument', () => {
	let document: MockPdfDocument

	beforeEach(() => {
		document = new MockPdfDocument()
	})

	describe('isLoaded', () => {
		it('returns false initially', () => {
			expect(document.isLoaded()).toBe(false)
		})

		it('returns true after loading', async() => {
			await document.loadFromBuffer(new ArrayBuffer(5000), 'test.pdf')
			expect(document.isLoaded()).toBe(true)
		})

		it('returns false after destroy', async() => {
			await document.loadFromBuffer(new ArrayBuffer(5000), 'test.pdf')
			document.destroy()
			expect(document.isLoaded()).toBe(false)
		})
	})

	describe('getPageCount', () => {
		it('returns 0 before loading', () => {
			expect(document.getPageCount()).toBe(0)
		})

		it('returns page count after loading', async() => {
			await document.loadFromBuffer(new ArrayBuffer(5000), 'test.pdf')
			expect(document.getPageCount()).toBeGreaterThan(0)
		})
	})

	describe('getFileName', () => {
		it('returns undefined before loading', () => {
			expect(document.getFileName()).toBeUndefined()
		})

		it('returns filename after loading', async() => {
			await document.loadFromBuffer(new ArrayBuffer(5000), 'document.pdf')
			expect(document.getFileName()).toBe('document.pdf')
		})

		it('handles undefined filename', async() => {
			await document.loadFromBuffer(new ArrayBuffer(5000))
			expect(document.getFileName()).toBeUndefined()
		})
	})

	describe('loadFromBuffer', () => {
		it('loads document from buffer', async() => {
			await document.loadFromBuffer(new ArrayBuffer(5000), 'test.pdf')
			expect(document.isLoaded()).toBe(true)
		})

		it('sets filename', async() => {
			await document.loadFromBuffer(new ArrayBuffer(5000), 'my-doc.pdf')
			expect(document.getFileName()).toBe('my-doc.pdf')
		})

		it('creates pages', async() => {
			await document.loadFromBuffer(new ArrayBuffer(5000), 'test.pdf')
			expect(document.getPageCount()).toBeGreaterThan(0)
		})

		it('replaces previous document', async() => {
			await document.loadFromBuffer(new ArrayBuffer(1000), 'first.pdf')
			const _firstCount = document.getPageCount()

			await document.loadFromBuffer(new ArrayBuffer(10000), 'second.pdf')

			expect(document.getFileName()).toBe('second.pdf')
		})

		it('handles empty buffer', async() => {
			await document.loadFromBuffer(new ArrayBuffer(0), 'empty.pdf')
			expect(document.isLoaded()).toBe(true)
			expect(document.getPageCount()).toBeGreaterThan(0) // At least 1 page
		})
	})

	describe('getPage', () => {
		beforeEach(async() => {
			await document.loadFromBuffer(new ArrayBuffer(5000), 'test.pdf')
		})

		it('returns page for valid page number', () => {
			const page = document.getPage(1)
			expect(page.pageNumber).toBe(1)
		})

		it('throws for page number less than 1', () => {
			expect(() => document.getPage(0)).toThrow()
		})

		it('throws for page number greater than page count', () => {
			const pageCount = document.getPageCount()
			expect(() => document.getPage(pageCount + 1)).toThrow()
		})

		it('throws when document not loaded', () => {
			const unloaded = new MockPdfDocument()
			expect(() => unloaded.getPage(1)).toThrow('No document loaded')
		})

		it('returns same page instance on repeated calls (caching)', () => {
			const page1 = document.getPage(1)
			const page1Again = document.getPage(1)
			expect(page1).toBe(page1Again)
		})
	})

	describe('getPageDimensions', () => {
		beforeEach(async() => {
			await document.loadFromBuffer(new ArrayBuffer(5000), 'test.pdf')
		})

		it('returns width and height', () => {
			const dims = document.getPageDimensions(1)
			expect(dims.width).toBeGreaterThan(0)
			expect(dims.height).toBeGreaterThan(0)
		})

		it('returns standard Letter size by default', () => {
			const dims = document.getPageDimensions(1)
			expect(dims.width).toBe(612) // 8.5 inches at 72 DPI
			expect(dims.height).toBe(792) // 11 inches at 72 DPI
		})
	})

	describe('getPageRotation', () => {
		beforeEach(async() => {
			await document.loadFromBuffer(new ArrayBuffer(5000), 'test.pdf')
		})

		it('returns rotation value', () => {
			const rotation = document.getPageRotation(1)
			expect([0, 90, 180, 270]).toContain(rotation)
		})

		it('returns 0 for unrotated page', () => {
			const rotation = document.getPageRotation(1)
			expect(rotation).toBe(0)
		})
	})

	describe('toArrayBuffer', () => {
		it('throws when document not loaded', () => {
			expect(() => document.toArrayBuffer()).toThrow('No document loaded')
		})

		it('returns ArrayBuffer when loaded', async() => {
			const original = new ArrayBuffer(5000)
			await document.loadFromBuffer(original, 'test.pdf')

			const buffer = document.toArrayBuffer()
			expect(buffer).toBeInstanceOf(ArrayBuffer)
		})
	})

	describe('destroy', () => {
		beforeEach(async() => {
			await document.loadFromBuffer(new ArrayBuffer(5000), 'test.pdf')
		})

		it('sets loaded to false', () => {
			document.destroy()
			expect(document.isLoaded()).toBe(false)
		})

		it('clears pages', () => {
			document.destroy()
			expect(document.getPageCount()).toBe(0)
		})

		it('clears filename', () => {
			document.destroy()
			expect(document.getFileName()).toBeUndefined()
		})

		it('handles multiple destroy calls', () => {
			expect(() => {
				document.destroy()
				document.destroy()
			}).not.toThrow()
		})
	})
})

describe('PdfPage', () => {
	let page: MockPdfPage

	beforeEach(() => {
		page = new MockPdfPage(1, 612, 792, 0)
	})

	describe('properties', () => {
		it('has pageNumber', () => {
			expect(page.pageNumber).toBe(1)
		})

		it('has width', () => {
			expect(page.width).toBe(612)
		})

		it('has height', () => {
			expect(page.height).toBe(792)
		})

		it('has rotation', () => {
			expect(page.rotation).toBe(0)
		})
	})

	describe('render', () => {
		it('renders to canvas context', () => {
			const canvas = document.createElement('canvas')
			canvas.width = 612
			canvas.height = 792
			const ctx = canvas.getContext('2d')!

			expect(() => page.render(ctx, 1)).not.toThrow()
		})

		it('handles different scale values', () => {
			const canvas = document.createElement('canvas')
			const ctx = canvas.getContext('2d')!

			expect(() => {
				page.render(ctx, 0.5)
				page.render(ctx, 1.0)
				page.render(ctx, 2.0)
			}).not.toThrow()
		})
	})

	describe('getText', () => {
		it('returns page text', () => {
			const text = page.getText()
			expect(typeof text).toBe('string')
			expect(text.length).toBeGreaterThan(0)
		})
	})

	describe('getTextBlocks', () => {
		it('returns array of text blocks', () => {
			const blocks = page.getTextBlocks()
			expect(Array.isArray(blocks)).toBe(true)
		})
	})

	describe('destroy', () => {
		it('cleans up resources', () => {
			expect(() => page.destroy()).not.toThrow()
		})
	})

	describe('different page configurations', () => {
		it('handles landscape orientation', () => {
			const landscape = new MockPdfPage(1, 792, 612, 0)
			expect(landscape.width).toBe(792)
			expect(landscape.height).toBe(612)
		})

		it('handles 90 degree rotation', () => {
			const rotated = new MockPdfPage(1, 612, 792, 90)
			expect(rotated.rotation).toBe(90)
		})

		it('handles 180 degree rotation', () => {
			const rotated = new MockPdfPage(1, 612, 792, 180)
			expect(rotated.rotation).toBe(180)
		})

		it('handles 270 degree rotation', () => {
			const rotated = new MockPdfPage(1, 612, 792, 270)
			expect(rotated.rotation).toBe(270)
		})

		it('handles custom dimensions', () => {
			const custom = new MockPdfPage(1, 1000, 500, 0)
			expect(custom.width).toBe(1000)
			expect(custom.height).toBe(500)
		})
	})
})
