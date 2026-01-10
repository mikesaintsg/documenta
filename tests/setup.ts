/**
 * Documenta - Test Setup
 * @module tests/setup
 */

/**
 * Delay for specified milliseconds
 *
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
export function delay(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Create a mock canvas element
 *
 * @returns A canvas element
 */
export function createMockCanvas(): HTMLCanvasElement {
	const canvas = document.createElement('canvas')
	canvas.width = 100
	canvas.height = 100
	return canvas
}

/**
 * Create a mock container element
 *
 * @returns A div element
 */
export function createMockContainer(): HTMLDivElement {
	const container = document.createElement('div')
	container.style.width = '800px'
	container.style.height = '600px'
	return container
}

/**
 * Create a sample PDF ArrayBuffer for testing
 *
 * @returns A minimal PDF as ArrayBuffer
 */
export function createSamplePdfBuffer(): ArrayBuffer {
	// Minimal valid PDF structure
	const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << >> >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Hello World) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
312
%%EOF`

	const encoder = new TextEncoder()
	const bytes = encoder.encode(pdfContent)
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}

/**
 * Create a File object from an ArrayBuffer
 *
 * @param buffer - The buffer
 * @param fileName - The file name
 * @returns A File object
 */
export function createFileFromBuffer(buffer: ArrayBuffer, fileName: string): File {
	return new File([buffer], fileName, { type: 'application/pdf' })
}
