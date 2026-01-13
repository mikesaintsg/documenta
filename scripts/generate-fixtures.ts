/**
 * Generate PDF fixtures for testing
 * @module scripts/generate-fixtures
 *
 * Creates sample PDF files using mupdf for use in integration tests.
 * Uses low-level PDF content streams since mupdf doesn't have high-level text APIs.
 */

import * as mupdf from 'mupdf'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FIXTURES_DIR = join(__dirname, '../tests/fixtures')

// Ensure fixtures directory exists
if (!existsSync(FIXTURES_DIR)) {
	mkdirSync(FIXTURES_DIR, { recursive: true })
}

/**
 * Create a PDF content stream for text
 */
function createTextContent(fontRef: string, lines: Array<{ text: string; x: number; y: number; size: number }>): string {
	const parts: string[] = ['BT']

	for (const line of lines) {
		parts.push(`${fontRef} ${line.size} Tf`)
		parts.push(`${line.x} ${line.y} Td`)
		parts.push(`(${escapeText(line.text)}) Tj`)
		// Reset position for next line
		parts.push(`${-line.x} ${-line.y} Td`)
	}

	parts.push('ET')
	return parts.join('\n')
}

/**
 * Escape text for PDF strings
 */
function escapeText(text: string): string {
	return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

/**
 * Create a page and insert it into the document
 */
function insertPageWithContent(
	doc: mupdf.PDFDocument,
	resources: mupdf.PDFObject,
	content: string,
	mediaBox: [number, number, number, number] = [0, 0, 612, 792],
): void {
	const pageDict = doc.newDictionary()
	pageDict.put('Type', doc.newName('Page'))
	pageDict.put('MediaBox', mediaBox)
	pageDict.put('Resources', resources)

	const contentStream = doc.addStream(content, {})
	pageDict.put('Contents', contentStream)

	const pageObj = doc.addObject(pageDict)
	doc.insertPage(-1, pageObj)
}

/**
 * Create a simple single-page PDF with text
 */
function createSimplePdf(): ArrayBuffer {
	const doc = new mupdf.PDFDocument()

	// Add a standard font
	const font = new mupdf.Font('Helvetica')
	const fontRef = doc.addSimpleFont(font)

	// Create resources dict with font
	const resources = doc.newDictionary()
	const fonts = doc.newDictionary()
	fonts.put('F1', fontRef)
	resources.put('Font', fonts)

	// Create content stream with text
	const content = createTextContent('F1', [
		{ text: 'Hello, Documenta!', x: 72, y: 720, size: 24 },
		{ text: 'This is a sample PDF document for testing.', x: 72, y: 680, size: 12 },
		{ text: 'Page 1 of 1', x: 72, y: 50, size: 10 },
	])

	// Insert page with content
	insertPageWithContent(doc, resources, content)

	const buffer = doc.saveToBuffer('').asUint8Array()
	doc.destroy()

	const result = new ArrayBuffer(buffer.byteLength)
	new Uint8Array(result).set(buffer)
	return result
}

/**
 * Create a multi-page PDF
 */
function createMultiPagePdf(): ArrayBuffer {
	const doc = new mupdf.PDFDocument()

	// Add a standard font
	const font = new mupdf.Font('Helvetica')
	const fontRef = doc.addSimpleFont(font)

	// Create resources dict with font
	const resources = doc.newDictionary()
	const fonts = doc.newDictionary()
	fonts.put('F1', fontRef)
	resources.put('Font', fonts)

	for (let i = 0; i < 5; i++) {
		const pageNum = i + 1
		const content = createTextContent('F1', [
			{ text: `Page ${pageNum}`, x: 72, y: 720, size: 36 },
			{ text: `This is page ${pageNum} of 5 pages.`, x: 72, y: 660, size: 14 },
			{ text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', x: 72, y: 600, size: 10 },
			{ text: `Footer - Page ${pageNum}/5`, x: 72, y: 50, size: 10 },
		])

		insertPageWithContent(doc, resources, content)
	}

	const buffer = doc.saveToBuffer('').asUint8Array()
	doc.destroy()

	const result = new ArrayBuffer(buffer.byteLength)
	new Uint8Array(result).set(buffer)
	return result
}

/**
 * Create a PDF with form field labels
 */
function createFormPdf(): ArrayBuffer {
	const doc = new mupdf.PDFDocument()

	// Add a standard font
	const font = new mupdf.Font('Helvetica')
	const fontRef = doc.addSimpleFont(font)

	const resources = doc.newDictionary()
	const fonts = doc.newDictionary()
	fonts.put('F1', fontRef)
	resources.put('Font', fonts)

	const content = createTextContent('F1', [
		{ text: 'Form Example', x: 72, y: 720, size: 24 },
		{ text: 'Name:', x: 72, y: 660, size: 12 },
		{ text: 'Email:', x: 72, y: 620, size: 12 },
		{ text: 'Comments:', x: 72, y: 580, size: 12 },
	])

	insertPageWithContent(doc, resources, content)

	const buffer = doc.saveToBuffer('').asUint8Array()
	doc.destroy()

	const result = new ArrayBuffer(buffer.byteLength)
	new Uint8Array(result).set(buffer)
	return result
}

/**
 * Create a PDF with searchable text
 */
function createSearchablePdf(): ArrayBuffer {
	const doc = new mupdf.PDFDocument()

	// Add a standard font
	const font = new mupdf.Font('Helvetica')
	const fontRef = doc.addSimpleFont(font)

	const resources = doc.newDictionary()
	const fonts = doc.newDictionary()
	fonts.put('F1', fontRef)
	resources.put('Font', fonts)

	const content = createTextContent('F1', [
		{ text: 'Searchable Document', x: 72, y: 720, size: 24 },
		{ text: 'The quick brown fox jumps over the lazy dog.', x: 72, y: 660, size: 12 },
		{ text: 'Pack my box with five dozen liquor jugs.', x: 72, y: 630, size: 12 },
		{ text: 'How vexingly quick daft zebras jump!', x: 72, y: 600, size: 12 },
		{ text: 'The five boxing wizards jump quickly.', x: 72, y: 570, size: 12 },
		{ text: 'Sphinx of black quartz, judge my vow.', x: 72, y: 540, size: 12 },
		{ text: 'apple banana cherry apple orange apple', x: 72, y: 480, size: 10 },
	])

	insertPageWithContent(doc, resources, content)

	const buffer = doc.saveToBuffer('').asUint8Array()
	doc.destroy()

	const result = new ArrayBuffer(buffer.byteLength)
	new Uint8Array(result).set(buffer)
	return result
}

/**
 * Create a blank PDF for drawing tests
 */
function createBlankPdf(): ArrayBuffer {
	const doc = new mupdf.PDFDocument()

	// Create blank page with no content using insertPage
	const pageDict = doc.newDictionary()
	pageDict.put('Type', doc.newName('Page'))
	pageDict.put('MediaBox', [0, 0, 612, 792])
	const pageObj = doc.addObject(pageDict)
	doc.insertPage(-1, pageObj)

	const buffer = doc.saveToBuffer('').asUint8Array()
	doc.destroy()

	const result = new ArrayBuffer(buffer.byteLength)
	new Uint8Array(result).set(buffer)
	return result
}

/**
 * Save buffer to file
 */
function saveFixture(buffer: ArrayBuffer, filename: string): void {
	const filepath = join(FIXTURES_DIR, filename)
	writeFileSync(filepath, Buffer.from(buffer))
	console.log(`Created: ${filepath}`)
}

// Generate all fixtures
console.log('Generating PDF fixtures...\n')

try {
	saveFixture(createSimplePdf(), 'simple.pdf')
	saveFixture(createMultiPagePdf(), 'multi-page.pdf')
	saveFixture(createFormPdf(), 'form.pdf')
	saveFixture(createSearchablePdf(), 'searchable.pdf')
	saveFixture(createBlankPdf(), 'blank.pdf')

	console.log('\n✅ All fixtures generated successfully!')
} catch (error) {
	console.error('❌ Error generating fixtures:', error)
	process.exit(1)
}
