/**
 * Documenta - Helper Functions
 * @module helpers
 *
 * Project-specific helpers for PDF editing.
 * For general utilities, import directly from 'tactica'.
 */

import { clamp, generateId } from 'tactica'
import type { AnnotationColor, Point, Rectangle } from './types.js'

/**
 * Check if a File is a valid PDF file
 * Handles mobile browsers where MIME type may be empty or incorrect.
 *
 * @param file - The File to validate
 * @returns True if the file appears to be a valid PDF
 */
export function isValidPdfFile(file: File): boolean {
	// Valid MIME types (some mobile browsers report different types)
	const validTypes = ['application/pdf', 'application/x-pdf']
	// Valid file extensions
	const validExtensions = ['.pdf']

	const hasValidType = file.type !== '' && validTypes.includes(file.type.toLowerCase())
	const hasValidExtension = validExtensions.some(ext =>
		file.name.toLowerCase().endsWith(ext),
	)

	// On mobile, MIME type is often empty, so we rely more on extension
	// If both are empty/invalid but the file was selected via PDF picker, accept it
	return hasValidType || hasValidExtension || file.type === ''
}

/**
 * Check if an ArrayBuffer is non-empty
 *
 * @param buffer - The buffer to check
 * @returns True if the buffer has content
 */
export function isNonEmptyArrayBuffer(buffer: ArrayBuffer): boolean {
	return buffer.byteLength > 0
}

/**
 * Check if a value is a valid page number
 *
 * @param value - The value to check
 * @param maxPage - The maximum valid page number
 * @returns True if the value is a valid page number
 */
export function isValidPageNumber(value: unknown, maxPage: number): value is number {
	return typeof value === 'number' &&
		Number.isInteger(value) &&
		value >= 1 &&
		value <= maxPage
}

/**
 * Check if a value is a valid zoom level
 *
 * @param value - The value to check
 * @param min - Minimum allowed zoom
 * @param max - Maximum allowed zoom
 * @returns True if the value is a valid zoom level
 */
export function isValidZoom(value: unknown, min: number, max: number): value is number {
	return typeof value === 'number' &&
		Number.isFinite(value) &&
		value >= min &&
		value <= max
}

// ============================================================================
// Clamping Helpers
// ============================================================================

/**
 * Clamp a page number to valid range
 *
 * @param pageNumber - The page number to clamp
 * @param maxPage - The maximum page number
 * @returns The clamped page number (1 to maxPage)
 */
export function clampPageNumber(pageNumber: number, maxPage: number): number {
	if (maxPage < 1) return 1
	return Math.max(1, Math.min(Math.floor(pageNumber), maxPage))
}

/**
 * Clamp a zoom level to valid range
 * Uses tactica's clamp helper
 *
 * @param zoom - The zoom level to clamp
 * @param min - Minimum zoom
 * @param max - Maximum zoom
 * @returns The clamped zoom level
 */
export function clampZoom(zoom: number, min: number, max: number): number {
	return clamp(zoom, min, max)
}

// ============================================================================
// Dimension Helpers
// ============================================================================

/**
 * Compute scaled dimensions maintaining aspect ratio
 *
 * @param width - Original width
 * @param height - Original height
 * @param scale - Scale factor
 * @returns Scaled dimensions
 */
export function computeScaledDimensions(
	width: number,
	height: number,
	scale: number,
): { width: number; height: number } {
	return {
		width: Math.round(width * scale),
		height: Math.round(height * scale),
	}
}

/**
 * Compute scale to fit content within container
 *
 * @param contentWidth - Content width
 * @param contentHeight - Content height
 * @param containerWidth - Container width
 * @param containerHeight - Container height
 * @returns Scale factor to fit content in container
 */
export function computeFitScale(
	contentWidth: number,
	contentHeight: number,
	containerWidth: number,
	containerHeight: number,
): number {
	const scaleX = containerWidth / contentWidth
	const scaleY = containerHeight / contentHeight
	return Math.min(scaleX, scaleY)
}

/**
 * Compute scale to fit content width within container
 *
 * @param contentWidth - Content width
 * @param containerWidth - Container width
 * @returns Scale factor to fit width
 */
export function computeFitWidthScale(
	contentWidth: number,
	containerWidth: number,
): number {
	return containerWidth / contentWidth
}

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a unique annotation ID
 * Uses tactica's generateId for UUID generation
 *
 * @returns A unique string ID
 */
export function generateAnnotationId(): string {
	return `annot-${generateId()}`
}

// ============================================================================
// Color Helpers
// ============================================================================

/**
 * Convert AnnotationColor to CSS color string
 *
 * @param color - The annotation color
 * @param opacity - Optional opacity (0-1)
 * @returns CSS color string
 */
export function colorToCss(color: AnnotationColor, opacity?: number): string {
	const r = Math.round(Math.max(0, Math.min(255, color.r * 255)))
	const g = Math.round(Math.max(0, Math.min(255, color.g * 255)))
	const b = Math.round(Math.max(0, Math.min(255, color.b * 255)))

	if (opacity !== undefined && opacity < 1) {
		return `rgba(${r}, ${g}, ${b}, ${opacity})`
	}
	return `rgb(${r}, ${g}, ${b})`
}

/**
 * Convert CSS color string to AnnotationColor
 *
 * @param cssColor - CSS color string (hex or rgb)
 * @returns AnnotationColor or undefined if parsing fails
 */
export function cssToColor(cssColor: string): AnnotationColor | undefined {
	// Handle hex colors
	const hexMatch = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(cssColor)
	if (hexMatch) {
		const r = parseInt(hexMatch[1] ?? '0', 16)
		const g = parseInt(hexMatch[2] ?? '0', 16)
		const b = parseInt(hexMatch[3] ?? '0', 16)
		return { r: r / 255, g: g / 255, b: b / 255 }
	}

	// Handle short hex colors
	const shortHexMatch = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(cssColor)
	if (shortHexMatch) {
		const r = parseInt((shortHexMatch[1] ?? '0') + (shortHexMatch[1] ?? '0'), 16)
		const g = parseInt((shortHexMatch[2] ?? '0') + (shortHexMatch[2] ?? '0'), 16)
		const b = parseInt((shortHexMatch[3] ?? '0') + (shortHexMatch[3] ?? '0'), 16)
		return { r: r / 255, g: g / 255, b: b / 255 }
	}

	// Handle rgb/rgba colors
	const rgbMatch = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(cssColor)
	if (rgbMatch) {
		const r = parseInt(rgbMatch[1] ?? '0', 10)
		const g = parseInt(rgbMatch[2] ?? '0', 10)
		const b = parseInt(rgbMatch[3] ?? '0', 10)
		return { r: r / 255, g: g / 255, b: b / 255 }
	}

	return undefined
}

/**
 * Convert AnnotationColor to mupdf color array
 *
 * @param color - The annotation color
 * @returns Color as [r, g, b] array
 */
export function colorToMupdfArray(color: AnnotationColor): [number, number, number] {
	return [color.r, color.g, color.b]
}

// ============================================================================
// Rectangle Helpers
// ============================================================================

/**
 * Convert Rectangle to mupdf Rect format [x0, y0, x1, y1]
 *
 * @param rect - The rectangle
 * @returns Rect as [x0, y0, x1, y1]
 */
export function rectangleToMupdfRect(rect: Rectangle): [number, number, number, number] {
	return [rect.x, rect.y, rect.x + rect.width, rect.y + rect.height]
}

/**
 * Convert mupdf Rect [x0, y0, x1, y1] to Rectangle
 *
 * @param mupdfRect - The mupdf rect
 * @returns Rectangle
 */
export function mupdfRectToRectangle(mupdfRect: readonly [number, number, number, number]): Rectangle {
	return {
		x: mupdfRect[0],
		y: mupdfRect[1],
		width: mupdfRect[2] - mupdfRect[0],
		height: mupdfRect[3] - mupdfRect[1],
	}
}

// ============================================================================
// Point Helpers
// ============================================================================

/**
 * Convert Point to mupdf Point format [x, y]
 *
 * @param point - The point
 * @returns Point as [x, y]
 */
export function pointToMupdfPoint(point: Point): [number, number] {
	return [point.x, point.y]
}

/**
 * Convert mupdf Point [x, y] to Point
 *
 * @param mupdfPoint - The mupdf point
 * @returns Point
 */
export function mupdfPointToPoint(mupdfPoint: readonly [number, number]): Point {
	return { x: mupdfPoint[0], y: mupdfPoint[1] }
}

// ============================================================================
// File System Helpers
// ============================================================================

/**
 * Check if File System Access API is available
 *
 * @returns True if the API is available
 */
export function hasFileSystemAccess(): boolean {
	return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window
}

/**
 * Read a File as ArrayBuffer
 *
 * @param file - The file to read
 * @returns Promise resolving to ArrayBuffer
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
	return file.arrayBuffer()
}

/**
 * Download data as a file
 *
 * @param data - The data to download
 * @param fileName - The file name
 * @param mimeType - The MIME type
 */
export function downloadBlob(data: ArrayBuffer | Uint8Array, fileName: string, mimeType: string): void {
	// Create a fresh ArrayBuffer to avoid SharedArrayBuffer issues
	let buffer: ArrayBuffer
	if (data instanceof ArrayBuffer) {
		buffer = data
	} else {
		buffer = new ArrayBuffer(data.length)
		new Uint8Array(buffer).set(data)
	}
	const blob = new Blob([buffer], { type: mimeType })
	const url = URL.createObjectURL(blob)

	const link = document.createElement('a')
	link.href = url
	link.download = fileName
	link.style.display = 'none'

	document.body.appendChild(link)
	link.click()

	// Cleanup
	document.body.removeChild(link)
	URL.revokeObjectURL(url)
}
