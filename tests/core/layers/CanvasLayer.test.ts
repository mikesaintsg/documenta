/**
 * Tests for CanvasLayer
 * @module tests/core/layers/CanvasLayer
 *
 * Uses real mupdf library - no mocks.
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { CanvasLayer } from '~/src/core/layers/CanvasLayer.js'
import { PdfDocument } from '~/src/core/document/PdfDocument.js'
import { createTestElement, loadPdfFixture, PDF_FIXTURES } from '../../setup.js'
import type { PdfDocumentInterface } from '~/src/types.js'

describe('CanvasLayer', () => {
	let container: HTMLElement
	let canvasLayer: CanvasLayer
	let pdfDocument: PdfDocumentInterface
	let simplePdfBuffer: ArrayBuffer
	let multiPagePdfBuffer: ArrayBuffer

	beforeAll(async() => {
		// Pre-load fixtures
		simplePdfBuffer = await loadPdfFixture(PDF_FIXTURES.simple)
		multiPagePdfBuffer = await loadPdfFixture(PDF_FIXTURES.multiPage)
	})

	beforeEach(async() => {
		container = createTestElement()
		container.style.width = '800px'
		container.style.height = '600px'
		document.body.appendChild(container)

		canvasLayer = new CanvasLayer(container)
		pdfDocument = new PdfDocument()
		await pdfDocument.loadFromBuffer(multiPagePdfBuffer, 'test.pdf')
	})

	afterEach(() => {
		canvasLayer.destroy()
		container.remove()
	})

	describe('constructor', () => {
		it('creates canvas element', () => {
			const canvas = container.querySelector('canvas')
			expect(canvas).not.toBeNull()
		})

		it('canvas has expected class', () => {
			const canvas = container.querySelector('canvas')
			expect(canvas?.classList.length).toBeGreaterThan(0)
		})

		it('canvas is absolutely positioned', () => {
			const canvas = container.querySelector('canvas')
			expect(canvas?.style.position).toBe('absolute')
		})
	})

	describe('setDocument', () => {
		it('accepts a document', () => {
			expect(() => canvasLayer.setDocument(pdfDocument)).not.toThrow()
		})

		it('allows setting different documents', async() => {
			const anotherDoc = new PdfDocument()
			await anotherDoc.loadFromBuffer(simplePdfBuffer, 'simple.pdf')

			canvasLayer.setDocument(pdfDocument)
			expect(() => canvasLayer.setDocument(anotherDoc)).not.toThrow()
		})
	})

	describe('render', () => {
		beforeEach(() => {
			canvasLayer.setDocument(pdfDocument)
		})

		it('renders page at scale 1', () => {
			expect(() => canvasLayer.render(1, 1.0)).not.toThrow()
		})

		it('renders page at different scales', () => {
			expect(() => canvasLayer.render(1, 0.5)).not.toThrow()
			expect(() => canvasLayer.render(1, 2.0)).not.toThrow()
		})

		it('renders different pages', () => {
			expect(() => canvasLayer.render(1, 1.0)).not.toThrow()
			expect(() => canvasLayer.render(2, 1.0)).not.toThrow()
			expect(() => canvasLayer.render(3, 1.0)).not.toThrow()
		})

		it('does nothing without document', () => {
			const freshLayer = new CanvasLayer(container)
			expect(() => freshLayer.render(1, 1.0)).not.toThrow()
			freshLayer.destroy()
		})
	})

	describe('resize', () => {
		it('accepts new dimensions', () => {
			expect(() => canvasLayer.resize(1024, 768)).not.toThrow()
		})

		it('re-renders current page on resize', () => {
			canvasLayer.setDocument(pdfDocument)
			canvasLayer.render(1, 1.0)
			expect(() => canvasLayer.resize(1024, 768)).not.toThrow()
		})
	})

	describe('activate/deactivate', () => {
		it('activates layer', () => {
			canvasLayer.activate()
			expect(canvasLayer.isActive()).toBe(true)
		})

		it('deactivates layer', () => {
			canvasLayer.activate()
			canvasLayer.deactivate()
			expect(canvasLayer.isActive()).toBe(false)
		})

		it('toggles active state', () => {
			canvasLayer.deactivate()
			expect(canvasLayer.isActive()).toBe(false)

			canvasLayer.activate()
			expect(canvasLayer.isActive()).toBe(true)
		})
	})

	describe('isActive', () => {
		it('returns true when active', () => {
			canvasLayer.activate()
			expect(canvasLayer.isActive()).toBe(true)
		})

		it('returns false when inactive', () => {
			canvasLayer.deactivate()
			expect(canvasLayer.isActive()).toBe(false)
		})

		it('starts inactive by default', () => {
			// CanvasLayer starts inactive by default
			const freshLayer = new CanvasLayer(container)
			expect(freshLayer.isActive()).toBe(false)
			freshLayer.destroy()
		})
	})

	describe('destroy', () => {
		it('removes canvas from container', () => {
			canvasLayer.destroy()
			const canvas = container.querySelector('canvas')
			expect(canvas).toBeNull()
		})

		it('handles multiple destroy calls', () => {
			expect(() => {
				canvasLayer.destroy()
				canvasLayer.destroy()
			}).not.toThrow()
		})
	})

	describe('high DPI support', () => {
		it('configures canvas for device pixel ratio', () => {
			canvasLayer.setDocument(pdfDocument)
			canvasLayer.render(1, 1.0)

			const canvas = container.querySelector('canvas')!
			// Canvas should be scaled for DPI
			expect(canvas.width).toBeGreaterThan(0)
			expect(canvas.height).toBeGreaterThan(0)
		})
	})

	describe('scale handling', () => {
		beforeEach(() => {
			canvasLayer.setDocument(pdfDocument)
		})

		it('handles very small scale', () => {
			expect(() => canvasLayer.render(1, 0.1)).not.toThrow()
		})

		it('handles large scale', () => {
			expect(() => canvasLayer.render(1, 5.0)).not.toThrow()
		})
	})

	describe('document without pages', () => {
		it('handles empty document gracefully', async() => {
			const emptyDoc = new PdfDocument()
			// Don't load anything - it's empty
			canvasLayer.setDocument(emptyDoc)
			expect(() => canvasLayer.render(1, 1.0)).not.toThrow()
		})
	})
})
