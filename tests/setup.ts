/**
 * Test utilities and setup for Documenta
 * @module tests/setup
 *
 * Uses real mupdf library - no mocks. Tests run in Playwright browser environment.
 */

import { PdfDocument } from '~/src/core/document/PdfDocument.js'
import type { PdfDocumentInterface } from '~/src/types.js'

/**
 * Paths to PDF fixture files (relative to project root for fetch)
 */
export const PDF_FIXTURES = {
	simple: '/tests/fixtures/simple.pdf',
	multiPage: '/tests/fixtures/multi-page.pdf',
	searchable: '/tests/fixtures/searchable.pdf',
	blank: '/tests/fixtures/blank.pdf',
	form: '/tests/fixtures/form.pdf',
} as const

/**
 * Create a test HTML element
 *
 * @param tag - Element tag name (default: 'div')
 * @param id - Optional element ID
 * @returns Created element
 */
export function createTestElement(tag = 'div', id?: string): HTMLElement {
	const el = document.createElement(tag)
	if (id) {
		el.id = id
	}
	return el
}

/**
 * Create a test File object from an ArrayBuffer
 *
 * @param buffer - The PDF data
 * @param name - File name
 * @param type - MIME type (default: application/pdf)
 * @returns Created File object
 */
export function createTestFile(
	buffer: ArrayBuffer,
	name: string,
	type = 'application/pdf',
): File {
	return new File([buffer], name, { type })
}

/**
 * Create a File with string content for testing file operations
 *
 * @param name - File name
 * @param content - String content for the file
 * @param type - MIME type
 * @returns Created File object
 */
export function createFileWithContent(
	name: string,
	content = '',
	type = 'application/pdf',
): File {
	return new File([content], name, { type })
}

/**
 * Create an invalid (non-PDF) file for testing error handling
 *
 * @param name - File name
 * @param content - File content
 * @param type - MIME type
 * @returns Created File object
 */
export function createInvalidFile(
	name: string,
	content = 'not a pdf',
	type = 'text/plain',
): File {
	return new File([content], name, { type })
}

/**
 * Create an ArrayBuffer with sequential byte content for testing
 *
 * @param size - Buffer size in bytes
 * @returns Created ArrayBuffer
 */
export function createTestArrayBuffer(size: number): ArrayBuffer {
	const buffer = new ArrayBuffer(size)
	const view = new Uint8Array(buffer)
	for (let i = 0; i < size; i++) {
		view[i] = i % 256
	}
	return buffer
}

/**
 * Delay for a specified time
 *
 * @param ms - Delay in milliseconds
 * @returns Promise that resolves after delay
 */
export function delay(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Create a test canvas element with 2D context
 *
 * @param width - Canvas width
 * @param height - Canvas height
 * @returns Created canvas element
 */
export function createTestCanvas(width = 100, height = 100): HTMLCanvasElement {
	const canvas = document.createElement('canvas')
	canvas.width = width
	canvas.height = height
	return canvas
}

/**
 * Load a PDF fixture file and return its ArrayBuffer
 *
 * @param fixturePath - Path to the fixture (use PDF_FIXTURES constants)
 * @returns ArrayBuffer containing PDF data
 */
export async function loadPdfFixture(fixturePath: string): Promise<ArrayBuffer> {
	const response = await fetch(fixturePath)
	if (!response.ok) {
		throw new Error(`Failed to load fixture: ${fixturePath} (${response.status})`)
	}
	return response.arrayBuffer()
}

/**
 * Create a real PdfDocument instance and load it with fixture data
 *
 * @param fixturePath - Path to the fixture (use PDF_FIXTURES constants)
 * @param fileName - Optional file name to associate with the document
 * @returns Loaded PdfDocument instance
 */
export async function createLoadedPdfDocument(
	fixturePath: string = PDF_FIXTURES.simple,
	fileName?: string,
): Promise<PdfDocumentInterface> {
	const buffer = await loadPdfFixture(fixturePath)
	const doc = new PdfDocument()
	await doc.loadFromBuffer(buffer, fileName ?? fixturePath.split('/').pop())
	return doc
}

/**
 * Create a real PdfDocument instance (not loaded)
 *
 * @returns Empty PdfDocument instance ready for loading
 */
export function createPdfDocument(): PdfDocumentInterface {
	return new PdfDocument()
}
