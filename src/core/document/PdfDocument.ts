/**
 * PdfDocument - mupdf.PDFDocument wrapper
 * @module core/document/PdfDocument
 *
 * Provides a type-safe wrapper around mupdf.PDFDocument with proper resource management.
 */

import * as mupdf from 'mupdf'
import type {
	PdfDocumentInterface,
	PdfPageInterface,
	PageDimensions,
	PageRotation,
	TextBlock,
	TextLine,
	TextCharacter,
} from '../../types.js'
import { generateId, mupdfRectToRectangle, mupdfArrayToColor } from '../../helpers.js'

/**
 * PdfPage - Wrapper for a single PDF page
 */
class PdfPage implements PdfPageInterface {
	readonly pageNumber: number
	readonly width: number
	readonly height: number
	readonly rotation: PageRotation

	#page: mupdf.PDFPage
	#destroyed = false

	constructor(page: mupdf.PDFPage, pageNumber: number) {
		this.#page = page
		this.pageNumber = pageNumber

		const bounds = page.getBounds()
		this.width = bounds[2] - bounds[0]
		this.height = bounds[3] - bounds[1]

		// Get rotation from page object
		const pageObj = page.getObject()
		const rotateObj = pageObj.get('Rotate')
		const rotateValue = rotateObj.isNumber() ? rotateObj.asNumber() : 0
		this.rotation = (rotateValue % 360) as PageRotation
	}

	render(ctx: CanvasRenderingContext2D, scale: number): void {
		if (this.#destroyed) return

		const matrix = mupdf.Matrix.scale(scale, scale)
		const pixmap = this.#page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, true)

		const width = pixmap.getWidth()
		const height = pixmap.getHeight()
		const pixels = pixmap.getPixels()

		// Create a new ArrayBuffer to avoid SharedArrayBuffer issues
		const pixelData = new Uint8ClampedArray(pixels.length)
		pixelData.set(pixels)

		const imageData = new ImageData(pixelData, width, height)
		ctx.putImageData(imageData, 0, 0)
	}

	getText(): string {
		if (this.#destroyed) return ''

		const stext = this.#page.toStructuredText()
		return stext.asText()
	}

	getTextBlocks(): readonly TextBlock[] {
		if (this.#destroyed) return []

		const stext = this.#page.toStructuredText()
		const blocks: TextBlock[] = []

		stext.walk({
			beginTextBlock: (bbox) => {
				const block: TextBlock = {
					id: generateId(),
					bounds: mupdfRectToRectangle(bbox),
					lines: [],
				}
				blocks.push(block)
			},
			beginLine: (bbox, _wmode, _direction) => {
				const currentBlock = blocks[blocks.length - 1]
				if (currentBlock) {
					const line: TextLine = {
						id: generateId(),
						bounds: mupdfRectToRectangle(bbox),
						characters: [],
					}
					;(currentBlock.lines as TextLine[]).push(line)
				}
			},
			onChar: (c, origin, font, size, quad, color) => {
				const currentBlock = blocks[blocks.length - 1]
				if (currentBlock) {
					const currentLine = currentBlock.lines[currentBlock.lines.length - 1]
					if (currentLine) {
						const char: TextCharacter = {
							char: c,
							bounds: {
								x: quad[0],
								y: quad[1],
								width: quad[2] - quad[0],
								height: quad[5] - quad[1],
							},
							fontSize: size,
							fontName: font.getName(),
							color: mupdfArrayToColor(color as [number, number, number]),
						}
						;(currentLine.characters as TextCharacter[]).push(char)
					}
				}
			},
		})

		return blocks
	}

	destroy(): void {
		if (this.#destroyed) return
		this.#destroyed = true
	}
}

/**
 * PdfDocument - Main PDF document wrapper
 *
 * @remarks
 * Wraps mupdf.PDFDocument with a type-safe interface.
 * Handles page caching and resource cleanup.
 */
export class PdfDocument implements PdfDocumentInterface {
	#doc: mupdf.PDFDocument | undefined
	#fileName: string | undefined
	#pageCache: Map<number, PdfPage> = new Map()
	#destroyed = false

	isLoaded(): boolean {
		return this.#doc !== undefined && !this.#destroyed
	}

	getPageCount(): number {
		if (!this.#doc) return 0
		return this.#doc.countPages()
	}

	getFileName(): string | undefined {
		return this.#fileName
	}

	async loadFromBuffer(buffer: ArrayBuffer, fileName?: string): Promise<void> {
		// Clean up existing document
		if (this.#doc) {
			this.#clearPageCache()
			this.#doc.destroy()
		}

		// Create new document from buffer
		this.#doc = new mupdf.PDFDocument(buffer)
		this.#fileName = fileName
	}

	getPage(pageNumber: number): PdfPageInterface {
		if (!this.#doc) {
			throw new Error('No document loaded')
		}

		// Validate page number (mupdf uses 0-indexed pages)
		const pageCount = this.#doc.countPages()
		if (pageNumber < 1 || pageNumber > pageCount) {
			throw new Error(`Invalid page number: ${pageNumber}. Document has ${pageCount} pages.`)
		}

		// Check cache first
		const cached = this.#pageCache.get(pageNumber)
		if (cached) {
			return cached
		}

		// Load page (mupdf uses 0-indexed)
		const mupdfPage = this.#doc.loadPage(pageNumber - 1)
		const page = new PdfPage(mupdfPage, pageNumber)

		// Cache the page
		this.#pageCache.set(pageNumber, page)

		return page
	}

	getPageDimensions(pageNumber: number): PageDimensions {
		const page = this.getPage(pageNumber)
		return {
			width: page.width,
			height: page.height,
		}
	}

	getPageRotation(pageNumber: number): PageRotation {
		const page = this.getPage(pageNumber)
		return page.rotation
	}

	toArrayBuffer(): ArrayBuffer {
		if (!this.#doc) {
			throw new Error('No document loaded')
		}

		const buffer = this.#doc.saveToBuffer('').asUint8Array()
		// Create a new ArrayBuffer to avoid SharedArrayBuffer issues
		const result = new ArrayBuffer(buffer.byteLength)
		new Uint8Array(result).set(buffer)
		return result
	}

	/**
	 * Add a blank page to the document
	 *
	 * @param afterPage - Insert after this page (0 for beginning, -1 for end)
	 * @param width - Page width in points (default: 612 = Letter)
	 * @param height - Page height in points (default: 792 = Letter)
	 * @returns The new page number (1-indexed)
	 */
	addBlankPage(afterPage = -1, width = 612, height = 792): number {
		if (!this.#doc) {
			throw new Error('No document loaded')
		}

		const pageCount = this.#doc.countPages()

		// Convert to 0-indexed insertion position
		let insertIndex: number
		if (afterPage === -1 || afterPage >= pageCount) {
			insertIndex = pageCount // Insert at end
		} else if (afterPage <= 0) {
			insertIndex = 0 // Insert at beginning
		} else {
			insertIndex = afterPage // Insert after the specified page (0-indexed)
		}

		// Use mupdf's insertPage with a blank page object
		this.#doc.insertPage(insertIndex, this.#createBlankPageObject(width, height))

		// Clear page cache since page numbers may have shifted
		this.#clearPageCache()

		// Return new page number (1-indexed)
		return insertIndex + 1
	}

	/**
	 * Create a blank page object for insertion
	 */
	#createBlankPageObject(width: number, height: number): mupdf.PDFObject {
		const doc = this.#doc!
		const pageDict = doc.newDictionary()
		const mediaBox = doc.newArray()

		// MediaBox: [0, 0, width, height]
		mediaBox.push(doc.newInteger(0))
		mediaBox.push(doc.newInteger(0))
		mediaBox.push(doc.newReal(width))
		mediaBox.push(doc.newReal(height))

		pageDict.put('Type', doc.newName('Page'))
		pageDict.put('MediaBox', mediaBox)

		// Empty resources and contents
		pageDict.put('Resources', doc.newDictionary())
		pageDict.put('Contents', doc.addStream('', {}))

		return doc.addObject(pageDict)
	}

	/**
	 * Delete a page from the document
	 *
	 * @param pageNumber - Page to delete (1-indexed)
	 */
	deletePage(pageNumber: number): void {
		if (!this.#doc) {
			throw new Error('No document loaded')
		}

		const pageCount = this.#doc.countPages()
		if (pageNumber < 1 || pageNumber > pageCount) {
			throw new Error(`Invalid page number: ${pageNumber}. Document has ${pageCount} pages.`)
		}

		if (pageCount === 1) {
			throw new Error('Cannot delete the only page in the document')
		}

		// Delete page (mupdf uses 0-indexed)
		this.#doc.deletePage(pageNumber - 1)

		// Clear page cache since page numbers have shifted
		this.#clearPageCache()
	}

	/**
	 * Rotate a page
	 *
	 * @param pageNumber - Page to rotate (1-indexed)
	 * @param rotation - New rotation (0, 90, 180, or 270)
	 */
	rotatePage(pageNumber: number, rotation: PageRotation): void {
		if (!this.#doc) {
			throw new Error('No document loaded')
		}

		const pageCount = this.#doc.countPages()
		if (pageNumber < 1 || pageNumber > pageCount) {
			throw new Error(`Invalid page number: ${pageNumber}. Document has ${pageCount} pages.`)
		}

		// Validate rotation
		if (![0, 90, 180, 270].includes(rotation)) {
			throw new Error(`Invalid rotation: ${rotation}. Must be 0, 90, 180, or 270.`)
		}

		// Get the page object and set rotation
		const page = this.#doc.loadPage(pageNumber - 1)
		const pageObj = page.getObject()
		pageObj.put('Rotate', this.#doc.newInteger(rotation))

		// Clear page cache since rotation affects dimensions
		this.#clearPageCache()
	}

	/**
	 * Move a page to a new position
	 *
	 * @param fromPage - Source page (1-indexed)
	 * @param toPage - Destination position (1-indexed)
	 */
	movePage(fromPage: number, toPage: number): void {
		if (!this.#doc) {
			throw new Error('No document loaded')
		}

		const pageCount = this.#doc.countPages()
		if (fromPage < 1 || fromPage > pageCount) {
			throw new Error(`Invalid source page: ${fromPage}. Document has ${pageCount} pages.`)
		}
		if (toPage < 1 || toPage > pageCount) {
			throw new Error(`Invalid destination page: ${toPage}. Document has ${pageCount} pages.`)
		}

		if (fromPage === toPage) {
			return // No-op
		}

		// mupdf doesn't have a direct movePage, so we need to rearrange the page tree
		// This is complex in mupdf, so we'll use a workaround with insertPage/deletePage
		// Note: This is a simplified implementation that may not preserve all page properties

		// For now, throw not implemented as mupdf's page tree manipulation is complex
		// A full implementation would need to:
		// 1. Get the page object at fromPage
		// 2. Insert a reference to it at toPage
		// 3. Delete the original reference
		// This requires careful handling of the page tree structure

		throw new Error('movePage is not yet implemented - requires complex page tree manipulation')
	}

	destroy(): void {
		if (this.#destroyed) return
		this.#destroyed = true

		this.#clearPageCache()

		if (this.#doc) {
			this.#doc.destroy()
			this.#doc = undefined
		}
	}

	#clearPageCache(): void {
		for (const page of this.#pageCache.values()) {
			page.destroy()
		}
		this.#pageCache.clear()
	}
}
