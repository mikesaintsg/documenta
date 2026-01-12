/**
 * PdfEditor Integration Tests
 *
 * Tests end-to-end workflows simulating real user scenarios.
 * Uses real mupdf library - no mocks.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PdfEditor } from '~/src/core/PdfEditor.js'
import { createTestElement, createInvalidFile, loadPdfFixture, PDF_FIXTURES } from '../setup.js'
import type { EditorMode } from '~/src/types.js'

describe('PdfEditor Integration', () => {
	let container: HTMLElement
	let editor: PdfEditor
	let simplePdfBuffer: ArrayBuffer

	beforeEach(async () => {
		container = createTestElement()
		container.style.width = '800px'
		container.style.height = '600px'
		document.body.appendChild(container)

		// Load fixture once for the test suite
		simplePdfBuffer = await loadPdfFixture(PDF_FIXTURES.simple)

		editor = new PdfEditor({ container })
	})

	afterEach(() => {
		editor.destroy()
		container.remove()
	})

	describe('Document Lifecycle', () => {
		it('should initialize in unloaded state', () => {
			expect(editor.isLoaded()).toBe(false)
			expect(editor.getCurrentPage()).toBe(0)
			expect(editor.getPageCount()).toBe(0)
			expect(editor.getMode()).toBe('pan')
		})

		it('should load document and update state', async () => {
			await editor.loadFromBuffer(simplePdfBuffer, 'test.pdf')

			expect(editor.isLoaded()).toBe(true)
			expect(editor.getCurrentPage()).toBe(1)
			expect(editor.getPageCount()).toBeGreaterThan(0)
			expect(editor.getFileName()).toBe('test.pdf')
		})

		it('should emit load event with correct data', async () => {
			let loadedFileName = ''
			let loadedPageCount = 0

			editor.onLoad((fileName, pageCount) => {
				loadedFileName = fileName
				loadedPageCount = pageCount
			})

			await editor.loadFromBuffer(simplePdfBuffer, 'report.pdf')

			expect(loadedFileName).toBe('report.pdf')
			expect(loadedPageCount).toBeGreaterThan(0)
		})

		it('should clean up on destroy', async () => {
			await editor.loadFromBuffer(simplePdfBuffer, 'test.pdf')

			editor.destroy()

			expect(editor.isLoaded()).toBe(false)
		})
	})

	describe('Navigation Workflow', () => {
		beforeEach(async () => {
			// Use multi-page fixture for navigation tests
			const multiPageBuffer = await loadPdfFixture(PDF_FIXTURES.multiPage)
			await editor.loadFromBuffer(multiPageBuffer, 'test.pdf')
		})

		it('should navigate through pages sequentially', () => {
			const pageCount = editor.getPageCount()
			if (pageCount < 2) return // Skip if single page

			expect(editor.getCurrentPage()).toBe(1)

			editor.goToNextPage()
			expect(editor.getCurrentPage()).toBe(2)

			editor.goToPreviousPage()
			expect(editor.getCurrentPage()).toBe(1)
		})

		it('should clamp navigation to valid pages', () => {
			const pageCount = editor.getPageCount()

			editor.goToPage(0)
			expect(editor.getCurrentPage()).toBe(1)

			editor.goToPage(9999)
			expect(editor.getCurrentPage()).toBe(pageCount)

			editor.goToPage(-5)
			expect(editor.getCurrentPage()).toBe(1)
		})

		it('should emit page change events', () => {
			const pageChanges: number[] = []
			editor.onPageChange((page) => pageChanges.push(page))

			editor.goToPage(2)

			expect(pageChanges).toContain(2)
		})
	})

	describe('Zoom Workflow', () => {
		beforeEach(async () => {
			await editor.loadFromBuffer(simplePdfBuffer, 'test.pdf')
		})

		it('should zoom in and out', () => {
			const initialZoom = editor.getZoom()

			editor.zoomIn()
			expect(editor.getZoom()).toBeGreaterThan(initialZoom)

			editor.zoomOut()
			editor.zoomOut()
			expect(editor.getZoom()).toBeLessThan(initialZoom)
		})

		it('should reset zoom to default', () => {
			editor.setZoom(2.5)
			expect(editor.getZoom()).toBe(2.5)

			editor.resetZoom()
			expect(editor.getZoom()).toBe(1.0)
		})

		it('should clamp zoom to valid range', () => {
			editor.setZoom(0.01)
			expect(editor.getZoom()).toBeGreaterThanOrEqual(0.25)

			editor.setZoom(100)
			expect(editor.getZoom()).toBeLessThanOrEqual(5.0)
		})

		it('should emit zoom change events', () => {
			const zoomChanges: number[] = []
			editor.onZoomChange((zoom) => zoomChanges.push(zoom))

			editor.setZoom(1.5)

			expect(zoomChanges).toContain(1.5)
		})
	})

	describe('Mode Switching Workflow', () => {
		it('should switch between modes', () => {
			const modes: EditorMode[] = ['pan', 'text', 'draw', 'form', 'annotate']

			for (const mode of modes) {
				editor.setMode(mode)
				expect(editor.getMode()).toBe(mode)
			}
		})

		it('should emit mode change events', () => {
			const modeChanges: EditorMode[] = []
			editor.onModeChange((mode) => modeChanges.push(mode))

			editor.setMode('text')
			editor.setMode('draw')

			expect(modeChanges).toContain('text')
			expect(modeChanges).toContain('draw')
		})

		it('should not emit event for same mode', () => {
			const modeChanges: EditorMode[] = []
			editor.onModeChange((mode) => modeChanges.push(mode))

			editor.setMode('pan') // Already pan
			editor.setMode('pan')

			expect(modeChanges.length).toBe(0)
		})
	})

	describe('State Snapshot', () => {
		it('should return complete state snapshot', async () => {
			await editor.loadFromBuffer(simplePdfBuffer, 'document.pdf')
			editor.setMode('draw')
			editor.setZoom(1.5)

			const state = editor.getState()

			expect(state.isLoaded).toBe(true)
			expect(state.fileName).toBe('document.pdf')
			expect(state.currentPage).toBe(1)
			expect(state.pageCount).toBeGreaterThan(0)
			expect(state.mode).toBe('draw')
			expect(state.zoom).toBe(1.5)
			expect(state.hasUnsavedChanges).toBe(false)
		})

		it('should return immutable state', () => {
			const state1 = editor.getState()
			editor.setMode('text')
			const state2 = editor.getState()

			expect(state1.mode).toBe('pan')
			expect(state2.mode).toBe('text')
		})
	})

	describe('Event Subscription Management', () => {
		it('should allow unsubscribing from events', () => {
			let callCount = 0
			const unsubscribe = editor.onModeChange(() => {
				callCount++
			})

			editor.setMode('text')
			expect(callCount).toBe(1)

			unsubscribe()
			editor.setMode('draw')
			expect(callCount).toBe(1) // No additional calls
		})

		it('should support multiple listeners', () => {
			const results: string[] = []

			editor.onModeChange(() => results.push('listener1'))
			editor.onModeChange(() => results.push('listener2'))

			editor.setMode('text')

			expect(results).toContain('listener1')
			expect(results).toContain('listener2')
		})
	})

	describe('Error Handling', () => {
		it('should emit error for invalid PDF file', async () => {
			let errorReceived: Error | null = null
			editor.onError((error) => {
				errorReceived = error
			})

			const invalidFile = createInvalidFile('invalid.txt', 'not a pdf', 'text/plain')

			try {
				await editor.load(invalidFile)
			} catch {
				// Expected
			}

			expect(errorReceived).not.toBeNull()
		})

		it('should throw when saving without document', async () => {
			await expect(editor.save()).rejects.toThrow()
		})

		it('should throw when getting buffer without document', () => {
			expect(() => editor.toArrayBuffer()).toThrow()
		})
	})

	describe('Options Callbacks', () => {
		it('should call option callbacks on events', async () => {
			container.remove()
			container = createTestElement()
			container.style.width = '800px'
			container.style.height = '600px'
			document.body.appendChild(container)

			const callbacks = {
				loadCalled: false,
				pageChangeCalled: false,
				zoomChangeCalled: false,
				modeChangeCalled: false,
			}

			const editorWithCallbacks = new PdfEditor({
				container,
				onLoad: () => { callbacks.loadCalled = true },
				onPageChange: () => { callbacks.pageChangeCalled = true },
				onZoomChange: () => { callbacks.zoomChangeCalled = true },
				onModeChange: () => { callbacks.modeChangeCalled = true },
			})

			await editorWithCallbacks.loadFromBuffer(simplePdfBuffer, 'test.pdf')

			expect(callbacks.loadCalled).toBe(true)
			expect(callbacks.pageChangeCalled).toBe(true)

			editorWithCallbacks.setZoom(2.0)
			expect(callbacks.zoomChangeCalled).toBe(true)

			editorWithCallbacks.setMode('draw')
			expect(callbacks.modeChangeCalled).toBe(true)

			editorWithCallbacks.destroy()
		})
	})
})
