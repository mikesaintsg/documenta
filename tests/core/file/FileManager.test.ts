/**
 * Tests for FileManager
 * @module tests/core/file/FileManager
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { FileManager } from '~/src/core/file/FileManager.js'
import { createMockFile, createMockArrayBuffer } from '../../setup.js'

describe('FileManager', () => {
	let fileManager: FileManager

	beforeEach(() => {
		fileManager = new FileManager()
	})

	describe('constructor', () => {
		it('creates instance successfully', () => {
			expect(fileManager).toBeInstanceOf(FileManager)
		})
	})

	describe('loadFile', () => {
		it('loads file and returns ArrayBuffer', async() => {
			const content = 'test content'
			const file = createMockFile('test.pdf', content)

			const buffer = await fileManager.loadFile(file)

			expect(buffer).toBeInstanceOf(ArrayBuffer)
			expect(buffer.byteLength).toBe(content.length)
		})

		it('handles empty file', async() => {
			const file = createMockFile('empty.pdf', '')

			const buffer = await fileManager.loadFile(file)

			expect(buffer.byteLength).toBe(0)
		})

		it('handles large file content', async() => {
			const content = 'x'.repeat(1000000)
			const file = createMockFile('large.pdf', content)

			const buffer = await fileManager.loadFile(file)

			expect(buffer.byteLength).toBe(1000000)
		})

		it('preserves file content correctly', async() => {
			const content = 'Hello, PDF!'
			const file = createMockFile('test.pdf', content)

			const buffer = await fileManager.loadFile(file)
			const decoder = new TextDecoder()
			const result = decoder.decode(buffer)

			expect(result).toBe(content)
		})
	})

	describe('loadUrl', () => {
		let originalFetch: typeof globalThis.fetch

		beforeEach(() => {
			originalFetch = globalThis.fetch
		})

		afterEach(() => {
			globalThis.fetch = originalFetch
		})

		it('fetches and returns ArrayBuffer', async() => {
			const mockBuffer = createMockArrayBuffer(100)
			globalThis.fetch = vi.fn().mockResolvedValue({
				ok: true,
				arrayBuffer: () => Promise.resolve(mockBuffer),
			})

			const buffer = await fileManager.loadUrl('https://example.com/test.pdf')

			expect(buffer).toBe(mockBuffer)
			expect(fetch).toHaveBeenCalledWith('https://example.com/test.pdf')
		})

		it('throws error on failed fetch', async() => {
			globalThis.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
				statusText: 'Not Found',
			})

			await expect(fileManager.loadUrl('https://example.com/missing.pdf'))
				.rejects.toThrow('Failed to fetch PDF: 404 Not Found')
		})

		it('throws error on network failure', async() => {
			globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

			await expect(fileManager.loadUrl('https://example.com/test.pdf'))
				.rejects.toThrow('Network error')
		})

		it('handles different HTTP error codes', async() => {
			globalThis.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				statusText: 'Internal Server Error',
			})

			await expect(fileManager.loadUrl('https://example.com/test.pdf'))
				.rejects.toThrow('Failed to fetch PDF: 500 Internal Server Error')
		})
	})

	describe('save', () => {
		it('returns undefined when no handle provided', async() => {
			const data = createMockArrayBuffer(100)

			const result = await fileManager.save(data)

			expect(result).toBeUndefined()
		})

		it('saves to handle when File System Access available', async() => {
			const data = createMockArrayBuffer(100)
			const mockWritable = {
				write: vi.fn(),
				close: vi.fn(),
			}
			const mockHandle = {
				createWritable: vi.fn().mockResolvedValue(mockWritable),
			} as unknown as FileSystemFileHandle

			const result = await fileManager.save(data, mockHandle)

			expect(mockHandle.createWritable).toHaveBeenCalled()
			expect(mockWritable.write).toHaveBeenCalledWith(data)
			expect(mockWritable.close).toHaveBeenCalled()
			expect(result).toBe(mockHandle)
		})
	})

	describe('saveAs', () => {
		let originalShowSaveFilePicker: typeof window.showSaveFilePicker | undefined

		beforeEach(() => {
			originalShowSaveFilePicker = window.showSaveFilePicker
		})

		afterEach(() => {
			// Restore original or delete if it was undefined
			if (originalShowSaveFilePicker !== undefined) {
				window.showSaveFilePicker = originalShowSaveFilePicker
			}
		})

		it('falls back to download when File System Access not available', async() => {
			// Delete showSaveFilePicker to simulate unavailable API
			delete (window as { showSaveFilePicker?: typeof window.showSaveFilePicker }).showSaveFilePicker

			const downloadSpy = vi.spyOn(fileManager, 'download').mockImplementation(() => {})
			const data = createMockArrayBuffer(100)

			const result = await fileManager.saveAs(data, 'test.pdf')

			expect(result).toBeUndefined()
			expect(downloadSpy).toHaveBeenCalledWith(data, 'test.pdf')
		})
	})

	describe('download', () => {
		let originalCreateObjectURL: typeof URL.createObjectURL
		let originalRevokeObjectURL: typeof URL.revokeObjectURL
		let clickedLinks: HTMLAnchorElement[] = []

		beforeEach(() => {
			clickedLinks = []
			originalCreateObjectURL = URL.createObjectURL
			originalRevokeObjectURL = URL.revokeObjectURL

			URL.createObjectURL = vi.fn().mockReturnValue('blob:test-url')
			URL.revokeObjectURL = vi.fn()

			// Mock anchor click
			const originalCreateElement = document.createElement.bind(document)
			vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
				const element = originalCreateElement(tagName)
				if (tagName === 'a') {
					element.click = vi.fn(() => clickedLinks.push(element as HTMLAnchorElement))
				}
				return element
			})
		})

		afterEach(() => {
			URL.createObjectURL = originalCreateObjectURL
			URL.revokeObjectURL = originalRevokeObjectURL
			vi.restoreAllMocks()
		})

		it('creates and clicks download link', () => {
			const data = createMockArrayBuffer(100)

			fileManager.download(data, 'test.pdf')

			expect(clickedLinks).toHaveLength(1)
		})

		it('sets correct filename', () => {
			const data = createMockArrayBuffer(100)

			fileManager.download(data, 'my-document.pdf')

			expect(clickedLinks[0]?.download).toBe('my-document.pdf')
		})

		it('sets correct href', () => {
			const data = createMockArrayBuffer(100)

			fileManager.download(data, 'test.pdf')

			expect(clickedLinks[0]?.href).toContain('blob:')
		})

		it('creates blob with correct MIME type', () => {
			const data = createMockArrayBuffer(100)

			fileManager.download(data, 'test.pdf')

			expect(URL.createObjectURL).toHaveBeenCalled()
		})
	})

	describe('edge cases', () => {
		it('handles unicode filenames', async() => {
			const file = createMockFile('日本語.pdf', 'content')

			const buffer = await fileManager.loadFile(file)

			expect(buffer).toBeInstanceOf(ArrayBuffer)
		})

		it('handles filenames with special characters', async() => {
			const file = createMockFile('test file (1).pdf', 'content')

			const buffer = await fileManager.loadFile(file)

			expect(buffer).toBeInstanceOf(ArrayBuffer)
		})

		it('handles binary content in file', async() => {
			const file = new File([new Uint8Array([0, 1, 2, 255, 254, 253])], 'binary.pdf', { type: 'application/pdf' })

			const buffer = await fileManager.loadFile(file)

			expect(buffer.byteLength).toBe(6)
			const view = new Uint8Array(buffer)
			expect(view[0]).toBe(0)
			expect(view[3]).toBe(255)
		})
	})
})
