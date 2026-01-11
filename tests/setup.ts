/**
 * Test utilities and setup for Documenta
 * @module tests/setup
 */

import type { PdfDocumentInterface, PdfPageInterface, TextBlock, PageRotation, PageDimensions } from '~/src/types.js'

/**
 * Create a mock HTML element for testing
 *
 * @param tag - Element tag name (default: 'div')
 * @param id - Optional element ID
 * @returns Created element
 */
export function createMockElement(tag = 'div', id?: string): HTMLElement {
	const el = document.createElement(tag)
	if (id) {
		el.id = id
	}
	return el
}

/**
 * Create a mock File for testing
 *
 * @param name - File name
 * @param content - File content
 * @param type - MIME type
 * @returns Created File object
 */
export function createMockFile(
	name: string,
	content = '',
	type = 'application/pdf',
): File {
	return new File([content], name, { type })
}

/**
 * Create a mock ArrayBuffer with content
 *
 * @param size - Buffer size in bytes
 * @returns Created ArrayBuffer
 */
export function createMockArrayBuffer(size: number): ArrayBuffer {
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
 * Create a mock canvas element with 2D context
 *
 * @param width - Canvas width
 * @param height - Canvas height
 * @returns Created canvas element
 */
export function createMockCanvas(width = 100, height = 100): HTMLCanvasElement {
	const canvas = document.createElement('canvas')
	canvas.width = width
	canvas.height = height
	return canvas
}

/**
 * Create a mock PDF buffer that simulates a valid PDF structure
 *
 * @returns ArrayBuffer with mock PDF data
 */
export function createMockPdfBuffer(): ArrayBuffer {
	// Create a minimal PDF-like structure
	const pdfHeader = '%PDF-1.4\n'
	const encoder = new TextEncoder()
	const data = encoder.encode(pdfHeader + '\n%%EOF')
	return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
}

/**
 * Create a mock PDF page for testing
 *
 * @param pageNumber - Page number
 * @param width - Page width
 * @param height - Page height
 * @returns Mock PdfPageInterface
 */
export function createMockPdfPage(pageNumber = 1, width = 612, height = 792): PdfPageInterface {
	return {
		pageNumber,
		width,
		height,
		rotation: 0 as PageRotation,
		render(_ctx: CanvasRenderingContext2D, _scale: number): void {
			// No-op for testing
		},
		getText(): string {
			return `Sample text for page ${pageNumber}`
		},
		getTextBlocks(): readonly TextBlock[] {
			return [{
				id: `block-${pageNumber}-1`,
				bounds: { x: 50, y: 50, width: 200, height: 20 },
				lines: [{
					id: `line-${pageNumber}-1`,
					bounds: { x: 50, y: 50, width: 200, height: 20 },
					characters: [
						{
							char: 'T',
							bounds: { x: 50, y: 50, width: 10, height: 20 },
							fontSize: 12,
							fontName: 'Helvetica',
							color: { r: 0, g: 0, b: 0 },
						},
						{
							char: 'e',
							bounds: { x: 60, y: 50, width: 10, height: 20 },
							fontSize: 12,
							fontName: 'Helvetica',
							color: { r: 0, g: 0, b: 0 },
						},
						{
							char: 's',
							bounds: { x: 70, y: 50, width: 10, height: 20 },
							fontSize: 12,
							fontName: 'Helvetica',
							color: { r: 0, g: 0, b: 0 },
						},
						{
							char: 't',
							bounds: { x: 80, y: 50, width: 10, height: 20 },
							fontSize: 12,
							fontName: 'Helvetica',
							color: { r: 0, g: 0, b: 0 },
						},
					],
				}],
			}]
		},
		destroy(): void {
			// No-op for testing
		},
	}
}

/**
 * Create a mock PDF document for testing
 *
 * @param pageCount - Number of pages
 * @param fileName - Document file name
 * @returns Mock PdfDocumentInterface
 */
export function createMockPdfDocument(pageCount = 3, fileName = 'test.pdf'): PdfDocumentInterface {
	let loaded = true
	const pages = new Map<number, PdfPageInterface>()

	return {
		isLoaded(): boolean {
			return loaded
		},
		getPageCount(): number {
			return pageCount
		},
		getFileName(): string | undefined {
			return fileName
		},
		async loadFromBuffer(_buffer: ArrayBuffer, _fileName?: string): Promise<void> {
			loaded = true
		},
		getPage(pageNumber: number): PdfPageInterface {
			if (!pages.has(pageNumber)) {
				pages.set(pageNumber, createMockPdfPage(pageNumber))
			}
			return pages.get(pageNumber)!
		},
		getPageDimensions(pageNumber: number): PageDimensions {
			const page = this.getPage(pageNumber)
			return { width: page.width, height: page.height }
		},
		getPageRotation(_pageNumber: number): PageRotation {
			return 0
		},
		toArrayBuffer(): ArrayBuffer {
			return createMockPdfBuffer()
		},
		destroy(): void {
			loaded = false
			pages.clear()
		},
	}
}
