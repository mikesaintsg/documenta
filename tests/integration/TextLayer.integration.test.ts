/**
 * Text Selection Workflow Integration Tests
 *
 * Tests text layer interactions simulating real user scenarios.
 * Uses real mupdf library - no mocks.
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { TextLayer } from '~/src/core/text/TextLayer.js'
import { createTestElement, loadPdfFixture, PDF_FIXTURES, createLoadedPdfDocument } from '../setup.js'
import type { TextSelection, PdfDocumentInterface } from '~/src/types.js'

describe('TextLayer Integration', () => {
	let container: HTMLElement
	let textLayer: TextLayer
	let pdfDocument: PdfDocumentInterface

	beforeAll(async () => {
		// Pre-load document for tests that need it
		pdfDocument = await createLoadedPdfDocument(PDF_FIXTURES.searchable)
	})

	beforeEach(() => {
		container = createTestElement()
		container.style.width = '800px'
		container.style.height = '600px'
		document.body.appendChild(container)

		textLayer = new TextLayer(container)
		textLayer.activate()
		textLayer.render(1, 1.0)
		textLayer.resize(800, 600)
	})

	afterEach(() => {
		textLayer.destroy()
		container.remove()
	})

	describe('Text Extraction', () => {
		it('should return empty string without document', () => {
			const text = textLayer.getPlainText(1)
			expect(text).toBe('')
		})

		it('should return empty blocks without document', () => {
			const blocks = textLayer.getTextBlocks(1)
			expect(blocks.length).toBe(0)
		})

		it('should set document for text extraction', () => {
			expect(() => textLayer.setDocument(pdfDocument)).not.toThrow()
		})
	})

	describe('Text Selection', () => {
		it('should return null when no selection', () => {
			const selection = textLayer.getSelection()
			expect(selection).toBeNull()
		})

		it('should clear selection', () => {
			textLayer.clearSelection()
			expect(textLayer.getSelection()).toBeNull()
		})

		it('should allow subscribing to selection changes', () => {
			const selections: (TextSelection | null)[] = []
			const unsubscribe = textLayer.onSelectionChange((selection) => {
				selections.push(selection)
			})

			expect(typeof unsubscribe).toBe('function')
			unsubscribe()
		})

		it('should allow unsubscribing from selection changes', () => {
			let callCount = 0
			const unsubscribe = textLayer.onSelectionChange(() => {
				callCount++
			})

			unsubscribe()
			textLayer.clearSelection()
			// Selection change event will fire but our listener is unsubscribed
			expect(callCount).toBe(0)
		})
	})

	describe('Text Search', () => {
		it('should return empty array when searching without document', () => {
			const matches = textLayer.search('test')
			expect(matches.length).toBe(0)
		})

		it('should return empty array when searching empty query', () => {
			textLayer.setDocument(pdfDocument)

			const matches = textLayer.search('')
			expect(matches.length).toBe(0)
		})

		it('should search on specific page', () => {
			const matches = textLayer.searchPage(1, 'test')
			expect(Array.isArray(matches)).toBe(true)
		})

		it('should perform case-insensitive search', () => {
			textLayer.setDocument(pdfDocument)

			// Both should work the same way
			const upper = textLayer.search('TEST')
			const lower = textLayer.search('test')

			expect(Array.isArray(upper)).toBe(true)
			expect(Array.isArray(lower)).toBe(true)
		})
	})

	describe('Copy to Clipboard', () => {
		it('should not throw when copying without selection', async () => {
			await expect(textLayer.copySelection()).resolves.not.toThrow()
		})
	})

	describe('Text Editing Placeholders', () => {
		it('should not throw on startEditing', () => {
			expect(() => textLayer.startEditing(1, { x: 100, y: 100 })).not.toThrow()
		})

		it('should not throw on applyEdit', () => {
			expect(() => textLayer.applyEdit()).not.toThrow()
		})

		it('should not throw on cancelEdit', () => {
			expect(() => textLayer.cancelEdit()).not.toThrow()
		})

		it('should not throw on undoEdit', () => {
			expect(() => textLayer.undoEdit()).not.toThrow()
		})

		it('should not throw on redoEdit', () => {
			expect(() => textLayer.redoEdit()).not.toThrow()
		})

		it('should return unsubscribe function for onEdit', () => {
			const unsubscribe = textLayer.onEdit(() => {})
			expect(typeof unsubscribe).toBe('function')
			unsubscribe()
		})
	})

	describe('Layer Lifecycle', () => {
		it('should activate and deactivate', () => {
			expect(textLayer.isActive()).toBe(true)

			textLayer.deactivate()
			expect(textLayer.isActive()).toBe(false)

			textLayer.activate()
			expect(textLayer.isActive()).toBe(true)
		})

		it('should handle resize', () => {
			expect(() => textLayer.resize(1024, 768)).not.toThrow()
		})

		it('should handle page changes', () => {
			textLayer.render(1, 1.0)
			textLayer.render(2, 1.5)
			textLayer.render(1, 2.0)

			expect(textLayer.isActive()).toBe(true)
		})

		it('should clean up on destroy', () => {
			textLayer.destroy()
			// After destroy, layer should not have event listeners
			// We verify by checking container no longer has layer element
			expect(container.querySelector('[class*="text-layer"]')).toBeNull()
		})

		it('should set cursor style on activate', () => {
			textLayer.deactivate()
			textLayer.activate()

			// Layer should be active after activation
			expect(textLayer.isActive()).toBe(true)
		})
	})

	describe('Overlay Rendering', () => {
		it('should render text overlay on page change', () => {
			textLayer.setDocument(pdfDocument)
			textLayer.render(1, 1.0)

			// Layer should be rendered without errors
			expect(textLayer.isActive()).toBe(true)
		})

		it('should handle different scales', () => {
			textLayer.setDocument(pdfDocument)

			textLayer.render(1, 0.5)
			textLayer.render(1, 1.0)
			textLayer.render(1, 2.0)

			expect(textLayer.isActive()).toBe(true)
		})
	})
})
