/**
 * Tests for PdfEditor
 * @module tests/core/PdfEditor
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PdfEditor } from '~/src/core/PdfEditor.js'
import type { EditorMode, EditorOptions } from '~/src/types.js'
import { createMockElement, createMockFile } from '../setup.js'
import { DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM, ZOOM_STEP } from '~/src/constants.js'

// mupdf is mocked globally via vitest.config.ts alias

describe('PdfEditor', () => {
	let container: HTMLElement
	let editor: PdfEditor

	beforeEach(() => {
		container = createMockElement()
		container.style.width = '800px'
		container.style.height = '600px'
		Object.defineProperty(container, 'clientWidth', { value: 800 })
		Object.defineProperty(container, 'clientHeight', { value: 600 })
		document.body.appendChild(container)

		editor = new PdfEditor({ container })
	})

	afterEach(() => {
		editor.destroy()
		container.remove()
	})

	describe('constructor', () => {
		it('creates instance with container', () => {
			expect(editor).toBeInstanceOf(PdfEditor)
		})

		it('throws when container is missing', () => {
			expect(() => new PdfEditor({} as EditorOptions)).toThrow()
		})

		it('applies container class', () => {
			expect(container.classList.length).toBeGreaterThan(0)
		})

		it('sets container position to relative', () => {
			expect(container.style.position).toBe('relative')
		})

		it('sets container overflow to hidden', () => {
			expect(container.style.overflow).toBe('hidden')
		})

		it('accepts initial mode option', () => {
			const customEditor = new PdfEditor({
				container: createMockElement(),
				initialMode: 'text',
			})
			expect(customEditor.getMode()).toBe('text')
			customEditor.destroy()
		})

		it('accepts initial zoom option', () => {
			const customEditor = new PdfEditor({
				container: createMockElement(),
				initialZoom: 1.5,
			})
			expect(customEditor.getZoom()).toBe(1.5)
			customEditor.destroy()
		})

		it('clamps initial zoom to valid range', () => {
			const customEditor = new PdfEditor({
				container: createMockElement(),
				initialZoom: 100, // Way above MAX_ZOOM
			})
			expect(customEditor.getZoom()).toBe(MAX_ZOOM)
			customEditor.destroy()
		})

		it('registers option callbacks', () => {
			const onLoad = vi.fn()
			const onPageChange = vi.fn()
			const onZoomChange = vi.fn()
			const onModeChange = vi.fn()
			const onSave = vi.fn()
			const onError = vi.fn()

			const customEditor = new PdfEditor({
				container: createMockElement(),
				onLoad,
				onPageChange,
				onZoomChange,
				onModeChange,
				onSave,
				onError,
			})

			// Mode change should trigger
			customEditor.setMode('text')
			expect(onModeChange).toHaveBeenCalledWith('text')

			customEditor.destroy()
		})
	})

	describe('getState', () => {
		it('returns document state', () => {
			const state = editor.getState()

			expect(state).toHaveProperty('isLoaded')
			expect(state).toHaveProperty('fileName')
			expect(state).toHaveProperty('pageCount')
			expect(state).toHaveProperty('currentPage')
			expect(state).toHaveProperty('zoom')
			expect(state).toHaveProperty('mode')
			expect(state).toHaveProperty('hasUnsavedChanges')
		})

		it('reflects correct initial state', () => {
			const state = editor.getState()

			expect(state.isLoaded).toBe(false)
			expect(state.currentPage).toBe(0)
			expect(state.zoom).toBe(DEFAULT_ZOOM)
			expect(state.mode).toBe('pan')
			expect(state.hasUnsavedChanges).toBe(false)
		})
	})

	describe('isLoaded', () => {
		it('returns false before loading', () => {
			expect(editor.isLoaded()).toBe(false)
		})
	})

	describe('getCurrentPage', () => {
		it('returns 0 before loading', () => {
			expect(editor.getCurrentPage()).toBe(0)
		})
	})

	describe('getPageCount', () => {
		it('returns 0 before loading', () => {
			expect(editor.getPageCount()).toBe(0)
		})
	})

	describe('getZoom', () => {
		it('returns default zoom', () => {
			expect(editor.getZoom()).toBe(DEFAULT_ZOOM)
		})

		it('returns current zoom after change', () => {
			editor.setZoom(1.5)
			expect(editor.getZoom()).toBe(1.5)
		})
	})

	describe('getMode', () => {
		it('returns default mode', () => {
			expect(editor.getMode()).toBe('pan')
		})

		it('returns current mode after change', () => {
			editor.setMode('text')
			expect(editor.getMode()).toBe('text')
		})
	})

	describe('hasUnsavedChanges', () => {
		it('returns false initially', () => {
			expect(editor.hasUnsavedChanges()).toBe(false)
		})
	})

	describe('getFileName', () => {
		it('returns undefined before loading', () => {
			expect(editor.getFileName()).toBeUndefined()
		})
	})

	describe('setMode', () => {
		it('changes mode to text', () => {
			editor.setMode('text')
			expect(editor.getMode()).toBe('text')
		})

		it('changes mode to draw', () => {
			editor.setMode('draw')
			expect(editor.getMode()).toBe('draw')
		})

		it('changes mode to form', () => {
			editor.setMode('form')
			expect(editor.getMode()).toBe('form')
		})

		it('changes mode to annotate', () => {
			editor.setMode('annotate')
			expect(editor.getMode()).toBe('annotate')
		})

		it('changes mode to pan', () => {
			editor.setMode('text')
			editor.setMode('pan')
			expect(editor.getMode()).toBe('pan')
		})

		it('does nothing when setting same mode', () => {
			const callback = vi.fn()
			editor.onModeChange(callback)

			editor.setMode('text')
			expect(callback).toHaveBeenCalledTimes(1)

			editor.setMode('text')
			expect(callback).toHaveBeenCalledTimes(1)
		})

		it('notifies mode change listeners', () => {
			const callback = vi.fn()
			editor.onModeChange(callback)

			editor.setMode('draw')

			expect(callback).toHaveBeenCalledWith('draw')
		})
	})

	describe('setZoom', () => {
		it('sets zoom within valid range', () => {
			editor.setZoom(1.5)
			expect(editor.getZoom()).toBe(1.5)
		})

		it('clamps zoom to minimum', () => {
			editor.setZoom(0.01)
			expect(editor.getZoom()).toBe(MIN_ZOOM)
		})

		it('clamps zoom to maximum', () => {
			editor.setZoom(100)
			expect(editor.getZoom()).toBe(MAX_ZOOM)
		})

		it('does nothing when setting same zoom', () => {
			const callback = vi.fn()
			editor.onZoomChange(callback)

			editor.setZoom(DEFAULT_ZOOM)
			expect(callback).not.toHaveBeenCalled()
		})

		it('notifies zoom change listeners', () => {
			const callback = vi.fn()
			editor.onZoomChange(callback)

			editor.setZoom(1.5)

			expect(callback).toHaveBeenCalledWith(1.5)
		})
	})

	describe('zoomIn', () => {
		it('increases zoom by step', () => {
			const initial = editor.getZoom()
			editor.zoomIn()
			expect(editor.getZoom()).toBe(initial + ZOOM_STEP)
		})

		it('respects maximum zoom', () => {
			editor.setZoom(MAX_ZOOM)
			editor.zoomIn()
			expect(editor.getZoom()).toBe(MAX_ZOOM)
		})
	})

	describe('zoomOut', () => {
		it('decreases zoom by step', () => {
			const initial = editor.getZoom()
			editor.zoomOut()
			expect(editor.getZoom()).toBe(initial - ZOOM_STEP)
		})

		it('respects minimum zoom', () => {
			editor.setZoom(MIN_ZOOM)
			editor.zoomOut()
			expect(editor.getZoom()).toBe(MIN_ZOOM)
		})
	})

	describe('resetZoom', () => {
		it('resets to default zoom', () => {
			editor.setZoom(2.5)
			editor.resetZoom()
			expect(editor.getZoom()).toBe(DEFAULT_ZOOM)
		})
	})

	describe('fitToWidth', () => {
		it('does nothing when no document loaded', () => {
			const initialZoom = editor.getZoom()
			editor.fitToWidth()
			expect(editor.getZoom()).toBe(initialZoom)
		})
	})

	describe('fitToPage', () => {
		it('does nothing when no document loaded', () => {
			const initialZoom = editor.getZoom()
			editor.fitToPage()
			expect(editor.getZoom()).toBe(initialZoom)
		})
	})

	describe('goToPage', () => {
		it('does nothing when no document loaded', () => {
			editor.goToPage(5)
			expect(editor.getCurrentPage()).toBe(0)
		})
	})

	describe('goToPreviousPage', () => {
		it('does nothing when no document loaded', () => {
			expect(() => editor.goToPreviousPage()).not.toThrow()
		})
	})

	describe('goToNextPage', () => {
		it('does nothing when no document loaded', () => {
			expect(() => editor.goToNextPage()).not.toThrow()
		})
	})

	describe('getPageDimensions', () => {
		it('returns zero dimensions when no document', () => {
			const dims = editor.getPageDimensions(1)
			expect(dims.width).toBe(0)
			expect(dims.height).toBe(0)
		})
	})

	describe('getPageRotation', () => {
		it('returns 0 when no document', () => {
			expect(editor.getPageRotation(1)).toBe(0)
		})
	})

	describe('getPageText', () => {
		it('returns empty string when no document', () => {
			expect(editor.getPageText(1)).toBe('')
		})
	})

	describe('searchText', () => {
		it('returns empty array (not implemented)', () => {
			expect(editor.searchText('test')).toEqual([])
		})
	})

	describe('hasFormFields', () => {
		it('returns false (not implemented)', () => {
			expect(editor.hasFormFields()).toBe(false)
		})
	})

	describe('layer access methods', () => {
		it('getTextLayer returns undefined', () => {
			expect(editor.getTextLayer()).toBeUndefined()
		})

		it('getDrawingLayer returns undefined', () => {
			expect(editor.getDrawingLayer()).toBeUndefined()
		})

		it('getFormLayer returns undefined', () => {
			expect(editor.getFormLayer()).toBeUndefined()
		})

		it('getAnnotationLayer returns undefined', () => {
			expect(editor.getAnnotationLayer()).toBeUndefined()
		})
	})

	describe('page management (not implemented)', () => {
		it('addBlankPage throws', () => {
			expect(() => editor.addBlankPage()).toThrow('Not implemented')
		})

		it('deletePage throws', () => {
			expect(() => editor.deletePage(1)).toThrow('Not implemented')
		})

		it('rotatePage throws', () => {
			expect(() => editor.rotatePage(1, 90)).toThrow('Not implemented')
		})

		it('movePage throws', () => {
			expect(() => editor.movePage(1, 2)).toThrow('Not implemented')
		})
	})

	describe('save operations', () => {
		it('save throws when no document', async() => {
			await expect(editor.save()).rejects.toThrow()
		})

		it('saveAs throws when no document', async() => {
			await expect(editor.saveAs()).rejects.toThrow()
		})

		it('download throws when no document', () => {
			expect(() => editor.download()).toThrow()
		})

		it('toArrayBuffer throws when no document', () => {
			expect(() => editor.toArrayBuffer()).toThrow()
		})
	})

	describe('event subscriptions', () => {
		describe('onLoad', () => {
			it('registers callback and returns unsubscribe', () => {
				const callback = vi.fn()
				const unsubscribe = editor.onLoad(callback)

				expect(typeof unsubscribe).toBe('function')
			})

			it('unsubscribe removes callback', () => {
				const callback = vi.fn()
				const unsubscribe = editor.onLoad(callback)
				unsubscribe()
			})
		})

		describe('onPageChange', () => {
			it('registers callback and returns unsubscribe', () => {
				const callback = vi.fn()
				const unsubscribe = editor.onPageChange(callback)

				expect(typeof unsubscribe).toBe('function')
			})
		})

		describe('onZoomChange', () => {
			it('registers callback and returns unsubscribe', () => {
				const callback = vi.fn()
				const unsubscribe = editor.onZoomChange(callback)

				expect(typeof unsubscribe).toBe('function')
			})

			it('callback is called on zoom change', () => {
				const callback = vi.fn()
				editor.onZoomChange(callback)

				editor.setZoom(1.5)

				expect(callback).toHaveBeenCalledWith(1.5)
			})
		})

		describe('onModeChange', () => {
			it('registers callback and returns unsubscribe', () => {
				const callback = vi.fn()
				const unsubscribe = editor.onModeChange(callback)

				expect(typeof unsubscribe).toBe('function')
			})

			it('callback is called on mode change', () => {
				const callback = vi.fn()
				editor.onModeChange(callback)

				editor.setMode('draw')

				expect(callback).toHaveBeenCalledWith('draw')
			})
		})

		describe('onSave', () => {
			it('registers callback and returns unsubscribe', () => {
				const callback = vi.fn()
				const unsubscribe = editor.onSave(callback)

				expect(typeof unsubscribe).toBe('function')
			})
		})

		describe('onError', () => {
			it('registers callback and returns unsubscribe', () => {
				const callback = vi.fn()
				const unsubscribe = editor.onError(callback)

				expect(typeof unsubscribe).toBe('function')
			})
		})
	})

	describe('destroy', () => {
		it('cleans up resources', () => {
			editor.destroy()
		})

		it('handles multiple destroy calls', () => {
			expect(() => {
				editor.destroy()
				editor.destroy()
			}).not.toThrow()
		})
	})

	describe('load operations', () => {
		it('rejects invalid file type', async() => {
			const errorCallback = vi.fn()
			editor.onError(errorCallback)

			const invalidFile = createMockFile('test.txt', 'content', 'text/plain')

			await expect(editor.load(invalidFile)).rejects.toThrow()
			expect(errorCallback).toHaveBeenCalled()
		})

		it('loadFromBuffer accepts ArrayBuffer', async() => {
			// This will use the mocked mupdf
			const buffer = new ArrayBuffer(100)
			await expect(editor.loadFromBuffer(buffer, 'test.pdf')).resolves.not.toThrow()
		})
	})

	describe('edge cases', () => {
		it('handles rapid mode changes', () => {
			const modes: EditorMode[] = ['pan', 'text', 'draw', 'form', 'annotate']
			for (let i = 0; i < 50; i++) {
				editor.setMode(modes[i % modes.length]!)
			}
		})

		it('handles rapid zoom changes', () => {
			for (let i = 0; i < 50; i++) {
				editor.setZoom(MIN_ZOOM + (i / 50) * (MAX_ZOOM - MIN_ZOOM))
			}
		})

		it('handles multiple listener registrations', () => {
			const callbacks: Array<() => void> = []
			for (let i = 0; i < 20; i++) {
				callbacks.push(editor.onModeChange(() => {}))
				callbacks.push(editor.onZoomChange(() => {}))
			}

			// Unsubscribe all
			callbacks.forEach(unsub => unsub())
		})
	})
})
