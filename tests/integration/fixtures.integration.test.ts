/**
 * Fixture-based Integration Tests
 *
 * Uses real PDF files and real mupdf library to test validation and loading logic.
 * No mocks - tests run in Playwright browser environment with full mupdf support.
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { PdfEditor } from '~/src/core/PdfEditor.js'
import { createTestElement, PDF_FIXTURES, loadPdfFixture } from '../setup.js'
import { isValidPdfFile } from '~/src/helpers.js'

describe('Fixture-based Integration Tests', () => {
	let container: HTMLElement
	let editor: PdfEditor

	// Load fixtures as ArrayBuffer
	const fixtures: {
		simple: ArrayBuffer
		multiPage: ArrayBuffer
		searchable: ArrayBuffer
		blank: ArrayBuffer
	} = {
		simple: new ArrayBuffer(0),
		multiPage: new ArrayBuffer(0),
		searchable: new ArrayBuffer(0),
		blank: new ArrayBuffer(0),
	}

	beforeAll(async () => {
		// Fetch all fixtures
		const [simple, multiPage, searchable, blank] = await Promise.all([
			loadPdfFixture(PDF_FIXTURES.simple),
			loadPdfFixture(PDF_FIXTURES.multiPage),
			loadPdfFixture(PDF_FIXTURES.searchable),
			loadPdfFixture(PDF_FIXTURES.blank),
		])

		fixtures.simple = simple
		fixtures.multiPage = multiPage
		fixtures.searchable = searchable
		fixtures.blank = blank
	})

	beforeEach(() => {
		container = createTestElement()
		container.style.width = '800px'
		container.style.height = '600px'
		document.body.appendChild(container)

		// Use real PdfDocument - no mocks
		editor = new PdfEditor({ container })
	})

	afterEach(() => {
		editor.destroy()
		container.remove()
	})

	describe('PDF Fixture Validation', () => {
		it('should have valid PDF headers in all fixtures', () => {
			for (const [name, buffer] of Object.entries(fixtures)) {
				const view = new Uint8Array(buffer)
				const header = String.fromCharCode(...view.slice(0, 4))
				expect(header, `${name} should have valid PDF header`).toBe('%PDF')
			}
		})

		it('should recognize simple.pdf as valid PDF file', () => {
			const file = new File([fixtures.simple], 'simple.pdf', { type: 'application/pdf' })
			expect(isValidPdfFile(file)).toBe(true)
		})

		it('should recognize multi-page.pdf as valid PDF file', () => {
			const file = new File([fixtures.multiPage], 'multi-page.pdf', { type: 'application/pdf' })
			expect(isValidPdfFile(file)).toBe(true)
		})

		it('should recognize searchable.pdf as valid PDF file', () => {
			const file = new File([fixtures.searchable], 'searchable.pdf', { type: 'application/pdf' })
			expect(isValidPdfFile(file)).toBe(true)
		})

		it('should recognize blank.pdf as valid PDF file', () => {
			const file = new File([fixtures.blank], 'blank.pdf', { type: 'application/pdf' })
			expect(isValidPdfFile(file)).toBe(true)
		})

		it('should reject non-PDF files', () => {
			const textFile = new File(['not a pdf'], 'test.txt', { type: 'text/plain' })
			expect(isValidPdfFile(textFile)).toBe(false)
		})

		it('should require valid type or extension for validation', () => {
			// File with wrong MIME type but correct extension still passes
			const wrongMime = new File([fixtures.simple], 'document.pdf', { type: 'text/html' })
			expect(isValidPdfFile(wrongMime)).toBe(true) // Extension is valid

			// File with wrong extension and wrong MIME type fails
			const wrongBoth = new File([fixtures.simple], 'document.txt', { type: 'text/html' })
			expect(isValidPdfFile(wrongBoth)).toBe(false)
		})
	})

	describe('Fixture File Properties', () => {
		it('simple.pdf should have reasonable file size', () => {
			expect(fixtures.simple.byteLength).toBeGreaterThan(500)
			expect(fixtures.simple.byteLength).toBeLessThan(5000)
		})

		it('multi-page.pdf should be larger than simple.pdf', () => {
			expect(fixtures.multiPage.byteLength).toBeGreaterThan(fixtures.simple.byteLength)
		})

		it('blank.pdf should be the smallest', () => {
			expect(fixtures.blank.byteLength).toBeLessThan(fixtures.simple.byteLength)
		})
	})

	describe('Document Loading with Fixtures', () => {
		it('should load simple.pdf File object', async () => {
			const file = new File([fixtures.simple], 'simple.pdf', { type: 'application/pdf' })
			await editor.load(file)

			expect(editor.isLoaded()).toBe(true)
			expect(editor.getFileName()).toBe('simple.pdf')
		})

		it('should load from buffer with filename', async () => {
			await editor.loadFromBuffer(fixtures.simple, 'simple.pdf')

			expect(editor.isLoaded()).toBe(true)
			expect(editor.getFileName()).toBe('simple.pdf')
		})

		it('should load from buffer without filename', async () => {
			await editor.loadFromBuffer(fixtures.simple)

			expect(editor.isLoaded()).toBe(true)
		})
	})

	describe('Navigation with Real Multi-Page Document', () => {
		beforeEach(async () => {
			await editor.loadFromBuffer(fixtures.multiPage, 'multi-page.pdf')
		})

		it('should start on page 1', () => {
			expect(editor.getCurrentPage()).toBe(1)
		})

		it('should have correct page count', () => {
			expect(editor.getPageCount()).toBe(5)
		})

		it('should navigate to specific page', () => {
			editor.goToPage(3)
			expect(editor.getCurrentPage()).toBe(3)
		})

		it('should navigate to next page', () => {
			editor.goToNextPage()
			expect(editor.getCurrentPage()).toBe(2)

			editor.goToNextPage()
			expect(editor.getCurrentPage()).toBe(3)
		})

		it('should navigate to previous page', () => {
			editor.goToPage(4)
			editor.goToPreviousPage()
			expect(editor.getCurrentPage()).toBe(3)
		})

		it('should not go before page 1', () => {
			editor.goToPage(1)
			editor.goToPreviousPage()
			expect(editor.getCurrentPage()).toBe(1)
		})

		it('should not go past last page', () => {
			editor.goToPage(5)
			editor.goToNextPage()
			expect(editor.getCurrentPage()).toBe(5)
		})
	})

	describe('Zoom Operations', () => {
		beforeEach(async () => {
			await editor.loadFromBuffer(fixtures.simple, 'simple.pdf')
		})

		it('should zoom in', () => {
			const initialZoom = editor.getZoom()
			editor.zoomIn()
			expect(editor.getZoom()).toBeGreaterThan(initialZoom)
		})

		it('should zoom out', () => {
			editor.setZoom(1.5)
			editor.zoomOut()
			expect(editor.getZoom()).toBeLessThan(1.5)
		})

		it('should reset zoom to default', () => {
			editor.setZoom(2)
			editor.resetZoom()
			expect(editor.getZoom()).toBe(1)
		})

		it('should clamp zoom to maximum', () => {
			editor.setZoom(10)
			expect(editor.getZoom()).toBeLessThanOrEqual(5)
		})

		it('should clamp zoom to minimum', () => {
			editor.setZoom(0.01)
			expect(editor.getZoom()).toBeGreaterThanOrEqual(0.1)
		})
	})

	describe('Mode Switching', () => {
		beforeEach(async () => {
			await editor.loadFromBuffer(fixtures.simple, 'simple.pdf')
		})

		it('should start in pan mode', () => {
			expect(editor.getMode()).toBe('pan')
		})

		it('should switch to text mode', () => {
			editor.setMode('text')
			expect(editor.getMode()).toBe('text')
		})

		it('should switch to draw mode', () => {
			editor.setMode('draw')
			expect(editor.getMode()).toBe('draw')
		})

		it('should switch back to pan mode', () => {
			editor.setMode('draw')
			editor.setMode('pan')
			expect(editor.getMode()).toBe('pan')
		})

		it('should not trigger callback when setting same mode', () => {
			let callCount = 0
			editor.onModeChange(() => callCount++)

			editor.setMode('pan') // Already in pan mode
			expect(callCount).toBe(0)

			editor.setMode('text')
			expect(callCount).toBe(1)

			editor.setMode('text') // Already in text mode
			expect(callCount).toBe(1)
		})
	})

	describe('Document State', () => {
		it('should report correct state after load', async () => {
			await editor.loadFromBuffer(fixtures.simple, 'simple.pdf')

			const state = editor.getState()
			expect(state.isLoaded).toBe(true)
			expect(state.fileName).toBe('simple.pdf')
			expect(state.currentPage).toBe(1)
			expect(state.mode).toBe('pan')
			expect(state.zoom).toBe(1)
		})

		it('should have no unsaved changes after load', async () => {
			await editor.loadFromBuffer(fixtures.simple, 'simple.pdf')
			expect(editor.hasUnsavedChanges()).toBe(false)
		})
	})

	describe('Event Callbacks', () => {
		it('should fire load callback with correct data', async () => {
			let loadedFileName = ''
			let loadedPageCount = 0

			editor.onLoad((fileName, pageCount) => {
				loadedFileName = fileName
				loadedPageCount = pageCount
			})

			await editor.loadFromBuffer(fixtures.multiPage, 'multi-page.pdf')

			expect(loadedFileName).toBe('multi-page.pdf')
			expect(loadedPageCount).toBe(5)
		})

		it('should fire page change callback', async () => {
			await editor.loadFromBuffer(fixtures.multiPage, 'multi-page.pdf')

			let changedPage = 0
			editor.onPageChange((page) => {
				changedPage = page
			})

			editor.goToPage(3)
			expect(changedPage).toBe(3)
		})

		it('should fire zoom change callback', async () => {
			await editor.loadFromBuffer(fixtures.simple, 'simple.pdf')

			let changedZoom = 0
			editor.onZoomChange((zoom) => {
				changedZoom = zoom
			})

			editor.setZoom(1.5)
			expect(changedZoom).toBe(1.5)
		})

		it('should allow unsubscribing from callbacks', async () => {
			await editor.loadFromBuffer(fixtures.multiPage, 'multi-page.pdf')

			let callCount = 0

			const unsubscribe = editor.onPageChange(() => {
				callCount++
			})

			editor.goToPage(2)
			expect(callCount).toBe(1)

			editor.goToPage(3)
			expect(callCount).toBe(2)

			unsubscribe()

			editor.goToPage(4)
			expect(callCount).toBe(2) // Should not increase after unsubscribe
		})
	})

	describe('Error Handling', () => {
		it('should reject invalid PDF files on load', async () => {
			const invalidFile = new File(['not a pdf'], 'test.txt', { type: 'text/plain' })

			await expect(editor.load(invalidFile)).rejects.toThrow()
		})

		it('should throw when accessing toArrayBuffer without document', () => {
			// Create a fresh editor without loading
			const freshEditor = new PdfEditor({ container })

			expect(() => freshEditor.toArrayBuffer()).toThrow()

			freshEditor.destroy()
		})
	})

	describe('Lifecycle', () => {
		it('should properly destroy editor', async () => {
			await editor.loadFromBuffer(fixtures.simple, 'simple.pdf')

			editor.destroy()

			// After destroy, creating a new editor should work
			const newEditor = new PdfEditor({ container })
			expect(newEditor.isLoaded()).toBe(false)
			newEditor.destroy()
		})
	})
})
