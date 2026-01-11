/**
 * Test utilities and setup for Documenta
 * @module tests/setup
 */

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
