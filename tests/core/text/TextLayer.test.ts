/**
 * Tests for TextLayer
 * @module tests/core/text/TextLayer
 *
 * Uses real mupdf library - no mocks.
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest'
import { TextLayer } from '~/src/core/text/TextLayer.js'
import { PdfDocument } from '~/src/core/document/PdfDocument.js'
import { createTestElement, loadPdfFixture, PDF_FIXTURES } from '../../setup.js'
import type { PdfDocumentInterface } from '~/src/types.js'

describe('TextLayer', () => {
	let container: HTMLElement
	let textLayer: TextLayer
	let pdfDocument: PdfDocumentInterface
	let searchablePdfBuffer: ArrayBuffer

	beforeAll(async() => {
		// Pre-load the searchable PDF which has text
		searchablePdfBuffer = await loadPdfFixture(PDF_FIXTURES.searchable)
	})

	beforeEach(async() => {
		container = createTestElement()
		container.style.width = '800px'
		container.style.height = '600px'
		document.body.appendChild(container)

		textLayer = new TextLayer(container)
		pdfDocument = new PdfDocument()
		await pdfDocument.loadFromBuffer(searchablePdfBuffer, 'test.pdf')
	})

	afterEach(() => {
		textLayer.destroy()
		container.remove()
	})

	describe('constructor', () => {
		it('creates layer element', () => {
			const layer = container.querySelector('[class*="text-layer"]')
			expect(layer).not.toBeNull()
		})
	})

	describe('setDocument', () => {
		it('accepts a document', () => {
			expect(() => textLayer.setDocument(pdfDocument)).not.toThrow()
		})

		it('allows setting different documents', async() => {
			const anotherDoc = new PdfDocument()
			await anotherDoc.loadFromBuffer(searchablePdfBuffer, 'another.pdf')

			textLayer.setDocument(pdfDocument)
			expect(() => textLayer.setDocument(anotherDoc)).not.toThrow()
		})
	})

	describe('render', () => {
		beforeEach(() => {
			textLayer.setDocument(pdfDocument)
		})

		it('renders at scale 1', () => {
			expect(() => textLayer.render(1, 1.0)).not.toThrow()
		})

		it('renders at different scales', () => {
			expect(() => textLayer.render(1, 0.5)).not.toThrow()
			expect(() => textLayer.render(1, 2.0)).not.toThrow()
		})
	})

	describe('resize', () => {
		it('accepts new dimensions', () => {
			expect(() => textLayer.resize(1024, 768)).not.toThrow()
		})
	})

	describe('activate/deactivate', () => {
		it('activates layer', () => {
			textLayer.activate()
			expect(textLayer.isActive()).toBe(true)
		})

		it('deactivates layer', () => {
			textLayer.activate()
			textLayer.deactivate()
			expect(textLayer.isActive()).toBe(false)
		})
	})

	describe('getPlainText', () => {
		it('returns empty string without document', () => {
			const freshLayer = new TextLayer(container)
			expect(freshLayer.getPlainText(1)).toBe('')
			freshLayer.destroy()
		})

		it('returns text with document', () => {
			textLayer.setDocument(pdfDocument)
			const text = textLayer.getPlainText(1)
			expect(typeof text).toBe('string')
		})
	})

	describe('getTextBlocks', () => {
		it('returns empty array without document', () => {
			const freshLayer = new TextLayer(container)
			expect(freshLayer.getTextBlocks(1)).toEqual([])
			freshLayer.destroy()
		})

		it('returns array with document', () => {
			textLayer.setDocument(pdfDocument)
			const blocks = textLayer.getTextBlocks(1)
			expect(Array.isArray(blocks)).toBe(true)
		})
	})

	describe('selection', () => {
		it('returns null when no selection', () => {
			expect(textLayer.getSelection()).toBeNull()
		})

		it('clears selection', () => {
			textLayer.clearSelection()
			expect(textLayer.getSelection()).toBeNull()
		})

		it('allows subscribing to selection changes', () => {
			const callback = vi.fn()
			const unsubscribe = textLayer.onSelectionChange(callback)

			expect(typeof unsubscribe).toBe('function')
			unsubscribe()
		})
	})

	describe('search', () => {
		it('returns empty array without document', () => {
			const freshLayer = new TextLayer(container)
			expect(freshLayer.search('test')).toEqual([])
			freshLayer.destroy()
		})

		it('returns empty array for empty query', () => {
			textLayer.setDocument(pdfDocument)
			expect(textLayer.search('')).toEqual([])
		})

		it('returns array for valid query', () => {
			textLayer.setDocument(pdfDocument)
			const results = textLayer.search('the')
			expect(Array.isArray(results)).toBe(true)
		})
	})

	describe('searchPage', () => {
		it('returns array', () => {
			textLayer.setDocument(pdfDocument)
			const results = textLayer.searchPage(1, 'test')
			expect(Array.isArray(results)).toBe(true)
		})
	})

	describe('copySelection', () => {
		it('does not throw when no selection', async() => {
			await expect(textLayer.copySelection()).resolves.not.toThrow()
		})
	})

	describe('editing stubs', () => {
		it('startEditing does not throw', () => {
			expect(() => textLayer.startEditing(1, { x: 0, y: 0 })).not.toThrow()
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
			const unsubscribe = textLayer.onEdit(() => {})
			expect(typeof unsubscribe).toBe('function')
			unsubscribe()
		})
	})

	describe('destroy', () => {
		it('removes layer from container', () => {
			textLayer.destroy()
			const layer = container.querySelector('[class*="text-layer"]')
			expect(layer).toBeNull()
		})

		it('handles multiple destroy calls', () => {
			expect(() => {
				textLayer.destroy()
				textLayer.destroy()
			}).not.toThrow()
		})
	})
})
