/**
 * Mock mupdf module for testing
 * @module tests/__mocks__/mupdf
 *
 * Provides mock implementations of mupdf classes to avoid WASM dependencies in tests.
 */

// Mock Matrix class
export const Matrix = {
	scale: (x: number, y: number) => [x, 0, 0, y, 0, 0],
	identity: [1, 0, 0, 1, 0, 0],
	translate: (x: number, y: number) => [1, 0, 0, 1, x, y],
	rotate: (degrees: number) => {
		const rad = (degrees * Math.PI) / 180
		return [Math.cos(rad), Math.sin(rad), -Math.sin(rad), Math.cos(rad), 0, 0]
	},
}

// Mock ColorSpace
export const ColorSpace = {
	DeviceRGB: 'DeviceRGB',
	DeviceGray: 'DeviceGray',
	DeviceCMYK: 'DeviceCMYK',
}

// Mock Pixmap class
class MockPixmap {
	#width: number
	#height: number

	constructor(width: number, height: number) {
		this.#width = width
		this.#height = height
	}

	getWidth(): number {
		return this.#width
	}

	getHeight(): number {
		return this.#height
	}

	getPixels(): Uint8Array {
		return new Uint8Array(this.#width * this.#height * 4)
	}

	destroy(): void {}
}

// Mock StructuredText
class MockStructuredText {
	asText(): string {
		return 'Mock page text content'
	}

	walk(callbacks: {
		beginTextBlock?: (bbox: number[]) => void
		beginLine?: (bbox: number[], wmode: number, direction: number[]) => void
		onChar?: (c: string, origin: number[], font: MockFont, size: number, quad: number[], color: number[]) => void
		endLine?: () => void
		endTextBlock?: () => void
	}): void {
		// Simulate a simple text structure
		callbacks.beginTextBlock?.([0, 0, 200, 20])
		callbacks.beginLine?.([0, 0, 200, 20], 0, [1, 0])
		const text = 'Hello'
		for (let i = 0; i < text.length; i++) {
			callbacks.onChar?.(
				text[i]!,
				[10 + i * 10, 10],
				new MockFont(),
				12,
				[10 + i * 10, 10, 20 + i * 10, 10, 20 + i * 10, 20, 10 + i * 10, 20],
				[0, 0, 0],
			)
		}
		callbacks.endLine?.()
		callbacks.endTextBlock?.()
	}
}

// Mock Font
class MockFont {
	getName(): string {
		return 'MockFont'
	}
}

// Mock PDFObject
class MockPDFObject {
	#value: unknown

	constructor(value: unknown = null) {
		this.#value = value
	}

	isNumber(): boolean {
		return typeof this.#value === 'number'
	}

	asNumber(): number {
		return typeof this.#value === 'number' ? this.#value : 0
	}

	isString(): boolean {
		return typeof this.#value === 'string'
	}

	asString(): string {
		return typeof this.#value === 'string' ? this.#value : ''
	}

	get(_key: string): MockPDFObject {
		return new MockPDFObject()
	}
}

// Mock PDFPage
class MockPDFPage {
	#pageNumber: number
	#bounds: [number, number, number, number]

	constructor(pageNumber: number, bounds: [number, number, number, number] = [0, 0, 612, 792]) {
		this.#pageNumber = pageNumber
		this.#bounds = bounds
	}

	getBounds(): [number, number, number, number] {
		return [...this.#bounds]
	}

	toPixmap(
		_matrix: number[],
		_colorSpace: string,
		_alpha: boolean,
	): MockPixmap {
		const scale = _matrix[0] ?? 1
		return new MockPixmap(
			Math.round(this.#bounds[2] * scale),
			Math.round(this.#bounds[3] * scale),
		)
	}

	toStructuredText(): MockStructuredText {
		return new MockStructuredText()
	}

	getObject(): MockPDFObject {
		return new MockPDFObject()
	}

	destroy(): void {}
}

// Mock PDFDocument
export class PDFDocument {
	#buffer: ArrayBuffer | undefined
	#pages: MockPDFPage[] = []
	#destroyed = false

	constructor(buffer?: ArrayBuffer) {
		if (buffer) {
			this.#buffer = buffer
			// Create 3 mock pages by default
			this.#pages = [
				new MockPDFPage(0),
				new MockPDFPage(1),
				new MockPDFPage(2),
			]
		}
	}

	countPages(): number {
		return this.#destroyed ? 0 : this.#pages.length
	}

	loadPage(index: number): MockPDFPage {
		if (this.#destroyed || index < 0 || index >= this.#pages.length) {
			throw new Error(`Invalid page index: ${index}`)
		}
		return this.#pages[index]!
	}

	saveToBuffer(_options?: string): { asUint8Array: () => Uint8Array } {
		return {
			asUint8Array: () => {
				if (this.#buffer) {
					return new Uint8Array(this.#buffer)
				}
				return new Uint8Array(100)
			},
		}
	}

	destroy(): void {
		this.#destroyed = true
		this.#pages = []
		this.#buffer = undefined
	}
}

// Default export for compatibility
export default {
	PDFDocument,
	Matrix,
	ColorSpace,
}
