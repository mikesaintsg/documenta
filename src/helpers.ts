/**
 * Documenta - Helper Functions
 * @module helpers
 *
 * Pure utility functions for PDF editing operations.
 * All helpers are side-effect free and deterministic.
 */

import type {
	Color,
	Point,
	Rectangle,
	Quad,
	PageRotation,
} from './types.js'

// ============================================================================
// Core Utility Functions
// ============================================================================

/**
 * Clamp a number to a range
 *
 * @param value - The value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns The clamped value
 *
 * @example
 * ```ts
 * clamp(5, 0, 10)   // 5
 * clamp(-5, 0, 10)  // 0
 * clamp(15, 0, 10)  // 10
 * ```
 */
export function clamp(value:  number, min:  number, max: number): number {
	return Math.max(min, Math. min(max, value))
}

/**
 * Generate a unique ID using crypto.randomUUID
 *
 * @returns A unique string ID (UUID v4)
 *
 * @example
 * ```ts
 * const id = generateId() // "550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
export function generateId(): string {
	return crypto. randomUUID()
}

/**
 * Calculate squared distance between two points
 *
 * @remarks
 * Faster than distance() since it avoids Math.sqrt().
 * Use for distance comparisons where exact distance isn't needed.
 *
 * @param x1 - First point X
 * @param y1 - First point Y
 * @param x2 - Second point X
 * @param y2 - Second point Y
 * @returns Squared distance between points
 *
 * @example
 * ```ts
 * // Check if points are within 10px (compare against 100)
 * if (distanceSquared(p1.x, p1.y, p2.x, p2.y) < 100) {
 *   // Points are close
 * }
 * ```
 */
export function distanceSquared(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
): number {
	const dx = x2 - x1
	const dy = y2 - y1
	return dx * dx + dy * dy
}

/**
 * Calculate distance between two points
 *
 * @param x1 - First point X
 * @param y1 - First point Y
 * @param x2 - Second point X
 * @param y2 - Second point Y
 * @returns Distance between points
 *
 * @example
 * ```ts
 * const dist = distance(0, 0, 3, 4) // 5
 * ```
 */
export function distance(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
): number {
	return Math.sqrt(distanceSquared(x1, y1, x2, y2))
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a value is a non-empty string
 *
 * @param value - The value to check
 * @returns True if the value is a non-empty string
 *
 * @example
 * ```ts
 * isNonEmptyString('hello')  // true
 * isNonEmptyString('')       // false
 * isNonEmptyString(123)      // false
 * ```
 */
export function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.length > 0
}

/**
 * Check if a File is a valid PDF file
 *
 * @remarks
 * Handles mobile browsers where MIME type may be empty or incorrect.
 * Checks both MIME type and file extension for reliability.
 *
 * @param file - The File to validate
 * @returns True if the file appears to be a valid PDF
 *
 * @example
 * ```ts
 * const input = document.querySelector('input[type="file"]')
 * const file = input. files[0]
 * if (isValidPdfFile(file)) {
 *   await editor.load(file)
 * }
 * ```
 */
export function isValidPdfFile(file: File): boolean {
	const validTypes = ['application/pdf', 'application/x-pdf']
	const hasValidType = file.type !== '' && validTypes.includes(file.type. toLowerCase())
	const hasValidExtension = file.name.toLowerCase().endsWith('.pdf')

	// On mobile, MIME type is often empty, so rely on extension
	return hasValidType || hasValidExtension
}

/**
 * Check if an ArrayBuffer is non-empty
 *
 * @param buffer - The buffer to check
 * @returns True if the buffer has content
 *
 * @example
 * ```ts
 * const buffer = await file.arrayBuffer()
 * if (isNonEmptyArrayBuffer(buffer)) {
 *   await doc.loadFromBuffer(buffer)
 * }
 * ```
 */
export function isNonEmptyArrayBuffer(buffer: ArrayBuffer): boolean {
	return buffer.byteLength > 0
}

/**
 * Check if a value is a valid page number
 *
 * @param value - The value to check
 * @param maxPage - The maximum valid page number
 * @returns True if the value is a valid page number (1 to maxPage)
 *
 * @example
 * ```ts
 * isValidPageNumber(1, 10)   // true
 * isValidPageNumber(0, 10)   // false (pages are 1-indexed)
 * isValidPageNumber(11, 10)  // false (exceeds max)
 * ```
 */
export function isValidPageNumber(value:  unknown, maxPage:  number): value is number {
	return (
		typeof value === 'number' &&
		Number.isInteger(value) &&
		value >= 1 &&
		value <= maxPage
	)
}

/**
 * Check if a value is a valid zoom level
 *
 * @param value - The value to check
 * @param min - Minimum allowed zoom
 * @param max - Maximum allowed zoom
 * @returns True if the value is a valid zoom level
 *
 * @example
 * ```ts
 * isValidZoom(1. 5, 0.25, 5.0)  // true
 * isValidZoom(0.1, 0.25, 5.0)  // false (below min)
 * isValidZoom(Infinity, 0.25, 5.0)  // false (not finite)
 * ```
 */
export function isValidZoom(value: unknown, min:  number, max: number): value is number {
	return (
		typeof value === 'number' &&
		Number.isFinite(value) &&
		value >= min &&
		value <= max
	)
}

/**
 * Check if a value is a valid Color object
 *
 * @param value - The value to check
 * @returns True if the value is a valid Color
 *
 * @example
 * ```ts
 * isValidColor({ r: 1, g: 0, b: 0 })  // true
 * isValidColor({ r: 2, g: 0, b: 0 })  // false (r > 1)
 * ```
 */
export function isValidColor(value:  unknown): value is Color {
	if (typeof value !== 'object' || value === null) return false
	const obj = value as Record<string, unknown>
	return (
		typeof obj. r === 'number' &&
		typeof obj.g === 'number' &&
		typeof obj.b === 'number' &&
		obj.r >= 0 && obj.r <= 1 &&
		obj.g >= 0 && obj. g <= 1 &&
		obj. b >= 0 && obj.b <= 1
	)
}

/**
 * Check if a value is a valid Point object
 *
 * @param value - The value to check
 * @returns True if the value is a valid Point
 *
 * @example
 * ```ts
 * isValidPoint({ x:  100, y: 200 })  // true
 * isValidPoint({ x: 'a', y: 200 })  // false
 * ```
 */
export function isValidPoint(value:  unknown): value is Point {
	if (typeof value !== 'object' || value === null) return false
	const obj = value as Record<string, unknown>
	return (
		typeof obj.x === 'number' &&
		typeof obj.y === 'number' &&
		Number.isFinite(obj.x) &&
		Number.isFinite(obj.y)
	)
}

/**
 * Check if a value is a valid Rectangle object
 *
 * @param value - The value to check
 * @returns True if the value is a valid Rectangle
 *
 * @example
 * ```ts
 * isValidRectangle({ x:  0, y:  0, width:  100, height:  50 })  // true
 * isValidRectangle({ x: 0, y: 0, width: -10, height: 50 })  // false (negative width)
 * ```
 */
export function isValidRectangle(value: unknown): value is Rectangle {
	if (typeof value !== 'object' || value === null) return false
	const obj = value as Record<string, unknown>
	return (
		typeof obj.x === 'number' &&
		typeof obj. y === 'number' &&
		typeof obj.width === 'number' &&
		typeof obj.height === 'number' &&
		Number. isFinite(obj.x) &&
		Number.isFinite(obj.y) &&
		obj.width >= 0 &&
		obj.height >= 0
	)
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
 *
 * @example
 * ```ts
 * clampPageNumber(0, 10)   // 1
 * clampPageNumber(5, 10)   // 5
 * clampPageNumber(15, 10)  // 10
 * ```
 */
export function clampPageNumber(pageNumber: number, maxPage: number): number {
	if (maxPage < 1) return 1
	return Math.max(1, Math. min(Math.floor(pageNumber), maxPage))
}

/**
 * Clamp a zoom level to valid range
 *
 * @param zoom - The zoom level to clamp
 * @param min - Minimum zoom
 * @param max - Maximum zoom
 * @returns The clamped zoom level
 *
 * @example
 * ```ts
 * clampZoom(0.1, 0.25, 5.0)  // 0.25
 * clampZoom(1.5, 0.25, 5.0)  // 1.5
 * clampZoom(10, 0.25, 5.0)   // 5.0
 * ```
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
 * @returns Scaled dimensions (rounded to integers)
 *
 * @example
 * ```ts
 * computeScaledDimensions(100, 200, 2)  // { width: 200, height: 400 }
 * ```
 */
export function computeScaledDimensions(
	width: number,
	height:  number,
	scale: number,
): { readonly width: number; readonly height: number } {
	return {
		width:  Math.round(width * scale),
		height: Math.round(height * scale),
	}
}

/**
 * Compute scale to fit content within container (fit entire content)
 *
 * @param contentWidth - Content width
 * @param contentHeight - Content height
 * @param containerWidth - Container width
 * @param containerHeight - Container height
 * @returns Scale factor to fit content in container
 *
 * @example
 * ```ts
 * // Fit 1000x800 content in 500x600 container
 * computeFitScale(1000, 800, 500, 600)  // 0.5 (constrained by width)
 * ```
 */
export function computeFitScale(
	contentWidth: number,
	contentHeight: number,
	containerWidth:  number,
	containerHeight: number,
): number {
	if (contentWidth <= 0 || contentHeight <= 0) return 1
	const scaleX = containerWidth / contentWidth
	const scaleY = containerHeight / contentHeight
	return Math. min(scaleX, scaleY)
}

/**
 * Compute scale to fit content width within container
 *
 * @param contentWidth - Content width
 * @param containerWidth - Container width
 * @returns Scale factor to fit width
 *
 * @example
 * ```ts
 * computeFitWidthScale(1000, 500)  // 0.5
 * ```
 */
export function computeFitWidthScale(
	contentWidth: number,
	containerWidth: number,
): number {
	if (contentWidth <= 0) return 1
	return containerWidth / contentWidth
}

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a unique annotation ID
 *
 * @returns A unique string ID with 'annot-' prefix
 *
 * @example
 * ```ts
 * const id = generateAnnotationId()  // "annot-550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
export function generateAnnotationId(): string {
	return `annot-${generateId()}`
}

/**
 * Generate a unique stroke ID
 *
 * @returns A unique string ID with 'stroke-' prefix
 *
 * @remarks
 * @preserve Used by DrawingLayer in Phase 5 for stroke identification
 *
 * @example
 * ```ts
 * const id = generateStrokeId()  // "stroke-550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
export function generateStrokeId(): string {
	return `stroke-${generateId()}`
}

/**
 * Generate a unique layer element ID
 *
 * @param layerName - Name of the layer
 * @returns A unique string ID with layer prefix
 *
 * @remarks
 * @preserve Used by LayerStack in Phase 3 for DOM element identification
 *
 * @example
 * ```ts
 * const id = generateLayerId('text')  // "layer-text-550e8400..."
 * ```
 */
export function generateLayerId(layerName: string): string {
	return `layer-${layerName}-${generateId()}`
}

/**
 * Generate a unique form field ID
 *
 * @returns A unique string ID with 'field-' prefix
 *
 * @remarks
 * @preserve Used by FormLayer in Phase 6 for field identification
 *
 * @example
 * ```ts
 * const id = generateFieldId()  // "field-550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
export function generateFieldId(): string {
	return `field-${generateId()}`
}

// ============================================================================
// Color Helpers
// ============================================================================

/**
 * Convert Color to CSS color string
 *
 * @param color - The color (0-1 range)
 * @param opacity - Optional opacity (0-1)
 * @returns CSS color string (rgb or rgba)
 *
 * @example
 * ```ts
 * colorToCss({ r: 1, g: 0, b: 0 })        // "rgb(255, 0, 0)"
 * colorToCss({ r: 1, g: 0, b: 0 }, 0.5)   // "rgba(255, 0, 0, 0.5)"
 * ```
 */
export function colorToCss(color: Color, opacity?: number): string {
	const r = Math.round(clamp(color.r * 255, 0, 255))
	const g = Math.round(clamp(color.g * 255, 0, 255))
	const b = Math.round(clamp(color.b * 255, 0, 255))

	if (opacity !== undefined && opacity < 1) {
		return `rgba(${r}, ${g}, ${b}, ${opacity})`
	}
	return `rgb(${r}, ${g}, ${b})`
}

/**
 * Convert CSS color string to Color
 *
 * @param cssColor - CSS color string (hex or rgb/rgba)
 * @returns Color object or undefined if parsing fails
 *
 * @example
 * ```ts
 * cssToColor('#ff0000')           // { r: 1, g: 0, b: 0 }
 * cssToColor('#f00')              // { r: 1, g: 0, b: 0 }
 * cssToColor('rgb(255, 0, 0)')    // { r: 1, g: 0, b: 0 }
 * cssToColor('invalid')           // undefined
 * ```
 */
export function cssToColor(cssColor: string): Color | undefined {
	// Handle 6-digit hex colors
	const hexMatch = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(cssColor)
	if (hexMatch) {
		const rHex = hexMatch[1]
		const gHex = hexMatch[2]
		const bHex = hexMatch[3]
		if (rHex && gHex && bHex) {
			return {
				r: parseInt(rHex, 16) / 255,
				g: parseInt(gHex, 16) / 255,
				b:  parseInt(bHex, 16) / 255,
			}
		}
	}

	// Handle 3-digit hex colors
	const shortHexMatch = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(cssColor)
	if (shortHexMatch) {
		const rHex = shortHexMatch[1]
		const gHex = shortHexMatch[2]
		const bHex = shortHexMatch[3]
		if (rHex && gHex && bHex) {
			return {
				r: parseInt(rHex + rHex, 16) / 255,
				g:  parseInt(gHex + gHex, 16) / 255,
				b: parseInt(bHex + bHex, 16) / 255,
			}
		}
	}

	// Handle rgb/rgba colors
	const rgbMatch = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/. exec(cssColor)
	if (rgbMatch) {
		const rStr = rgbMatch[1]
		const gStr = rgbMatch[2]
		const bStr = rgbMatch[3]
		if (rStr && gStr && bStr) {
			return {
				r: parseInt(rStr, 10) / 255,
				g: parseInt(gStr, 10) / 255,
				b: parseInt(bStr, 10) / 255,
			}
		}
	}

	return undefined
}

/**
 * Convert Color to mupdf color array
 *
 * @param color - The color
 * @returns Color as [r, g, b] tuple
 *
 * @example
 * ```ts
 * colorToMupdfArray({ r: 1, g: 0. 5, b: 0 })  // [1, 0.5, 0]
 * ```
 */
export function colorToMupdfArray(color:  Color): readonly [number, number, number] {
	return [color.r, color. g, color.b] as const
}

/**
 * Convert mupdf color array to Color
 *
 * @param mupdfColor - Color as [r, g, b] array
 * @returns Color object
 *
 * @remarks
 * @preserve Used by annotation loading in Phase 6
 *
 * @example
 * ```ts
 * mupdfArrayToColor([1, 0.5, 0])  // { r: 1, g: 0.5, b: 0 }
 * ```
 */
export function mupdfArrayToColor(
	mupdfColor: readonly [number, number, number],
): Color {
	return {
		r: mupdfColor[0],
		g: mupdfColor[1],
		b:  mupdfColor[2],
	}
}

/**
 * Blend two colors together
 *
 * @param color1 - First color
 * @param color2 - Second color
 * @param ratio - Blend ratio (0 = color1, 1 = color2)
 * @returns Blended color
 *
 * @remarks
 * @preserve Used by highlighter tool in Phase 5 for color mixing
 *
 * @example
 * ```ts
 * blendColors({ r:  1, g:  0, b: 0 }, { r: 0, g: 0, b: 1 }, 0.5)
 * // { r: 0.5, g: 0, b: 0.5 }
 * ```
 */
export function blendColors(color1: Color, color2: Color, ratio: number): Color {
	const t = clamp(ratio, 0, 1)
	return {
		r: color1.r + (color2.r - color1.r) * t,
		g: color1.g + (color2.g - color1.g) * t,
		b:  color1.b + (color2.b - color1.b) * t,
	}
}

// ============================================================================
// Rectangle Helpers
// ============================================================================

/**
 * Convert Rectangle to mupdf Rect format [x0, y0, x1, y1]
 *
 * @param rect - The rectangle
 * @returns Rect as [x0, y0, x1, y1] tuple
 *
 * @example
 * ```ts
 * rectangleToMupdfRect({ x:  10, y:  20, width:  100, height:  50 })
 * // [10, 20, 110, 70]
 * ```
 */
export function rectangleToMupdfRect(
	rect: Rectangle,
): readonly [number, number, number, number] {
	return [rect.x, rect.y, rect.x + rect.width, rect. y + rect.height] as const
}

/**
 * Convert mupdf Rect [x0, y0, x1, y1] to Rectangle
 *
 * @param mupdfRect - The mupdf rect
 * @returns Rectangle object
 *
 * @example
 * ```ts
 * mupdfRectToRectangle([10, 20, 110, 70])
 * // { x: 10, y: 20, width: 100, height: 50 }
 * ```
 */
export function mupdfRectToRectangle(
	mupdfRect: readonly [number, number, number, number],
): Rectangle {
	return {
		x: mupdfRect[0],
		y: mupdfRect[1],
		width: mupdfRect[2] - mupdfRect[0],
		height: mupdfRect[3] - mupdfRect[1],
	}
}

/**
 * Check if a point is inside a rectangle
 *
 * @param point - The point to test
 * @param rect - The rectangle
 * @returns True if point is inside rectangle
 *
 * @example
 * ```ts
 * const rect = { x:  0, y: 0, width: 100, height: 100 }
 * isPointInRectangle({ x: 50, y: 50 }, rect)  // true
 * isPointInRectangle({ x: 150, y: 50 }, rect) // false
 * ```
 */
export function isPointInRectangle(point: Point, rect: Rectangle): boolean {
	return (
		point. x >= rect.x &&
		point. x <= rect.x + rect.width &&
		point.y >= rect.y &&
		point.y <= rect.y + rect. height
	)
}

/**
 * Check if two rectangles intersect
 *
 * @param rect1 - First rectangle
 * @param rect2 - Second rectangle
 * @returns True if rectangles intersect
 *
 * @remarks
 * @preserve Used by eraser hit testing in Phase 5
 *
 * @example
 * ```ts
 * const r1 = { x: 0, y: 0, width: 100, height: 100 }
 * const r2 = { x: 50, y: 50, width: 100, height: 100 }
 * doRectanglesIntersect(r1, r2)  // true
 * ```
 */
export function doRectanglesIntersect(rect1: Rectangle, rect2: Rectangle): boolean {
	return !(
		rect1.x + rect1.width < rect2.x ||
		rect2.x + rect2.width < rect1.x ||
		rect1.y + rect1.height < rect2.y ||
		rect2.y + rect2.height < rect1.y
	)
}

/**
 * Calculate the intersection of two rectangles
 *
 * @param rect1 - First rectangle
 * @param rect2 - Second rectangle
 * @returns Intersection rectangle or undefined if no intersection
 *
 * @remarks
 * @preserve Used by text selection bounds calculation in Phase 4
 *
 * @example
 * ```ts
 * const r1 = { x: 0, y: 0, width: 100, height: 100 }
 * const r2 = { x: 50, y: 50, width: 100, height: 100 }
 * getRectangleIntersection(r1, r2)
 * // { x: 50, y: 50, width: 50, height: 50 }
 * ```
 */
export function getRectangleIntersection(
	rect1: Rectangle,
	rect2: Rectangle,
): Rectangle | undefined {
	const x = Math.max(rect1.x, rect2.x)
	const y = Math. max(rect1.y, rect2.y)
	const right = Math.min(rect1.x + rect1.width, rect2.x + rect2.width)
	const bottom = Math.min(rect1.y + rect1.height, rect2.y + rect2.height)

	if (right <= x || bottom <= y) {
		return undefined
	}

	return {
		x,
		y,
		width: right - x,
		height:  bottom - y,
	}
}

/**
 * Calculate bounding rectangle containing all points
 *
 * @param points - Array of points
 * @param padding - Optional padding around bounds
 * @returns Bounding rectangle or undefined if no points
 *
 * @remarks
 * @preserve Used by DrawingLayer in Phase 5 for stroke bounds
 *
 * @example
 * ```ts
 * getBoundingRectangle([{ x: 0, y: 0 }, { x: 100, y: 50 }])
 * // { x:  0, y:  0, width:  100, height:  50 }
 * ```
 */
export function getBoundingRectangle(
	points:  readonly Point[],
	padding = 0,
): Rectangle | undefined {
	if (points. length === 0) return undefined

	let minX = Infinity
	let minY = Infinity
	let maxX = -Infinity
	let maxY = -Infinity

	for (const point of points) {
		minX = Math.min(minX, point. x)
		minY = Math.min(minY, point.y)
		maxX = Math. max(maxX, point.x)
		maxY = Math.max(maxY, point.y)
	}

	return {
		x:  minX - padding,
		y: minY - padding,
		width: maxX - minX + padding * 2,
		height: maxY - minY + padding * 2,
	}
}

/**
 * Expand a rectangle by a given amount in all directions
 *
 * @param rect - The rectangle to expand
 * @param amount - Amount to expand (can be negative to shrink)
 * @returns Expanded rectangle
 *
 * @remarks
 * @preserve Used by annotation selection hit area in Phase 6
 *
 * @example
 * ```ts
 * expandRectangle({ x: 10, y: 10, width: 100, height: 50 }, 5)
 * // { x: 5, y: 5, width: 110, height: 60 }
 * ```
 */
export function expandRectangle(rect: Rectangle, amount:  number): Rectangle {
	return {
		x: rect.x - amount,
		y: rect.y - amount,
		width: rect.width + amount * 2,
		height: rect. height + amount * 2,
	}
}

// ============================================================================
// Point Helpers
// ============================================================================

/**
 * Convert Point to mupdf Point format [x, y]
 *
 * @param point - The point
 * @returns Point as [x, y] tuple
 *
 * @example
 * ```ts
 * pointToMupdfPoint({ x:  10, y: 20 })  // [10, 20]
 * ```
 */
export function pointToMupdfPoint(point: Point): readonly [number, number] {
	return [point.x, point. y] as const
}

/**
 * Convert mupdf Point [x, y] to Point
 *
 * @param mupdfPoint - The mupdf point
 * @returns Point object
 *
 * @example
 * ```ts
 * mupdfPointToPoint([10, 20])  // { x: 10, y: 20 }
 * ```
 */
export function mupdfPointToPoint(
	mupdfPoint: readonly [number, number],
): Point {
	return { x: mupdfPoint[0], y: mupdfPoint[1] }
}

/**
 * Calculate midpoint between two points
 *
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Midpoint
 *
 * @remarks
 * @preserve Used by stroke smoothing in Phase 5
 *
 * @example
 * ```ts
 * getMidpoint({ x: 0, y: 0 }, { x:  100, y: 100 })
 * // { x: 50, y: 50 }
 * ```
 */
export function getMidpoint(p1: Point, p2: Point): Point {
	return {
		x: (p1.x + p2.x) / 2,
		y: (p1.y + p2.y) / 2,
	}
}

/**
 * Add two points (vector addition)
 *
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Sum of points
 *
 * @remarks
 * @preserve Used by coordinate transforms in Phase 3
 *
 * @example
 * ```ts
 * addPoints({ x: 10, y: 20 }, { x:  5, y:  10 })
 * // { x: 15, y: 30 }
 * ```
 */
export function addPoints(p1: Point, p2: Point): Point {
	return { x: p1.x + p2.x, y: p1.y + p2.y }
}

/**
 * Subtract two points (vector subtraction)
 *
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Difference of points (p1 - p2)
 *
 * @remarks
 * @preserve Used by gesture delta calculation in Phase 3
 *
 * @example
 * ```ts
 * subtractPoints({ x: 10, y: 20 }, { x: 5, y: 10 })
 * // { x:  5, y:  10 }
 * ```
 */
export function subtractPoints(p1: Point, p2: Point): Point {
	return { x: p1.x - p2.x, y: p1.y - p2.y }
}

/**
 * Scale a point by a factor
 *
 * @param point - The point
 * @param scale - Scale factor
 * @returns Scaled point
 *
 * @remarks
 * @preserve Used by coordinate transforms in Phase 3
 *
 * @example
 * ```ts
 * scalePoint({ x: 10, y: 20 }, 2)  // { x: 20, y: 40 }
 * ```
 */
export function scalePoint(point: Point, scale: number): Point {
	return { x: point. x * scale, y: point.y * scale }
}

// ============================================================================
// Quad Helpers
// ============================================================================

/**
 * Convert a Rectangle to a Quad
 *
 * @param rect - The rectangle
 * @returns Quad with four corners
 *
 * @remarks
 * @preserve Used by highlight annotation creation in Phase 6
 *
 * @example
 * ```ts
 * rectangleToQuad({ x: 0, y: 0, width: 100, height: 50 })
 * // { topLeft: { x:  0, y:  0 }, topRight: { x:  100, y:  0 }, ...  }
 * ```
 */
export function rectangleToQuad(rect: Rectangle): Quad {
	return {
		topLeft: { x: rect.x, y: rect.y },
		topRight: { x: rect.x + rect. width, y: rect.y },
		bottomRight: { x: rect.x + rect. width, y: rect.y + rect. height },
		bottomLeft: { x:  rect.x, y: rect.y + rect.height },
	}
}

/**
 * Get bounding rectangle of a Quad
 *
 * @param quad - The quad
 * @returns Bounding rectangle
 *
 * @remarks
 * @preserve Used by text selection bounds in Phase 4
 *
 * @example
 * ```ts
 * quadToRectangle({
 *   topLeft: { x:  0, y:  0 },
 *   topRight: { x: 100, y: 10 },
 *   bottomRight: { x: 100, y: 60 },
 *   bottomLeft: { x: 0, y: 50 }
 * })
 * // { x: 0, y: 0, width: 100, height: 60 }
 * ```
 */
export function quadToRectangle(quad:  Quad): Rectangle {
	const points = [quad.topLeft, quad.topRight, quad.bottomRight, quad.bottomLeft]
	return getBoundingRectangle(points) ??  { x: 0, y: 0, width: 0, height: 0 }
}

// ============================================================================
// Rotation Helpers
// ============================================================================

/**
 * Rotate a point around an origin
 *
 * @param point - Point to rotate
 * @param origin - Center of rotation
 * @param degrees - Rotation in degrees (clockwise)
 * @returns Rotated point
 *
 * @remarks
 * @preserve Used by coordinate transforms in Phase 3 for page rotation
 *
 * @example
 * ```ts
 * rotatePoint({ x: 100, y: 0 }, { x:  0, y:  0 }, 90)
 * // { x: 0, y: 100 }
 * ```
 */
export function rotatePoint(point: Point, origin: Point, degrees: number): Point {
	const radians = (degrees * Math.PI) / 180
	const cos = Math.cos(radians)
	const sin = Math.sin(radians)

	const dx = point.x - origin.x
	const dy = point.y - origin. y

	return {
		x: origin.x + dx * cos - dy * sin,
		y:  origin.y + dx * sin + dy * cos,
	}
}

/**
 * Get the next rotation value (90 degree increment)
 *
 * @param current - Current rotation
 * @returns Next rotation (wraps from 270 to 0)
 *
 * @remarks
 * @preserve Used by page rotation in Phase 6
 *
 * @example
 * ```ts
 * getNextRotation(0)    // 90
 * getNextRotation(90)   // 180
 * getNextRotation(270)  // 0
 * ```
 */
export function getNextRotation(current: PageRotation): PageRotation {
	const rotations:  readonly PageRotation[] = [0, 90, 180, 270]
	const index = rotations.indexOf(current)
	const nextIndex = (index + 1) % rotations.length
	return rotations[nextIndex] ??  0
}

/**
 * Get the previous rotation value (90 degree decrement)
 *
 * @param current - Current rotation
 * @returns Previous rotation (wraps from 0 to 270)
 *
 * @remarks
 * @preserve Used by page rotation in Phase 6
 *
 * @example
 * ```ts
 * getPreviousRotation(0)    // 270
 * getPreviousRotation(90)   // 0
 * getPreviousRotation(180)  // 90
 * ```
 */
export function getPreviousRotation(current: PageRotation): PageRotation {
	const rotations: readonly PageRotation[] = [0, 90, 180, 270]
	const index = rotations.indexOf(current)
	const prevIndex = (index - 1 + rotations.length) % rotations.length
	return rotations[prevIndex] ?? 0
}

// ============================================================================
// File System Helpers
// ============================================================================

/**
 * Check if File System Access API is available
 *
 * @returns True if the API is available
 *
 * @example
 * ```ts
 * if (hasFileSystemAccess()) {
 *   await editor.save()
 * } else {
 *   editor.download()
 * }
 * ```
 */
export function hasFileSystemAccess(): boolean {
	return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window
}

/**
 * Read a File as ArrayBuffer
 *
 * @param file - The file to read
 * @returns Promise resolving to ArrayBuffer
 *
 * @example
 * ```ts
 * const buffer = await readFileAsArrayBuffer(file)
 * await doc.loadFromBuffer(buffer)
 * ```
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
 *
 * @example
 * ```ts
 * const pdfData = doc.toArrayBuffer()
 * downloadBlob(pdfData, 'document.pdf', 'application/pdf')
 * ```
 */
export function downloadBlob(
	data: ArrayBuffer | Uint8Array,
	fileName: string,
	mimeType:  string,
): void {
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
	link. style.display = 'none'

	document.body. appendChild(link)
	link.click()

	// Cleanup
	document. body.removeChild(link)
	URL.revokeObjectURL(url)
}

// ============================================================================
// Canvas Helpers
// ============================================================================

/**
 * Get the effective device pixel ratio
 *
 * @returns Device pixel ratio (minimum 1)
 *
 * @remarks
 * @preserve Used by CanvasLayer and DrawingLayer for high-DPI rendering
 *
 * @example
 * ```ts
 * const dpr = getDevicePixelRatio()  // 2 on Retina displays
 * canvas.width = width * dpr
 * canvas.height = height * dpr
 * ```
 */
export function getDevicePixelRatio(): number {
	return Math.max(1, window. devicePixelRatio || 1)
}

/**
 * Configure a canvas for high-DPI rendering
 *
 * @param canvas - The canvas element
 * @param width - Desired CSS width
 * @param height - Desired CSS height
 *
 * @remarks
 * @preserve Used by CanvasLayer in Phase 2 and DrawingLayer in Phase 5
 *
 * @example
 * ```ts
 * configureCanvasForHighDpi(canvas, 800, 600)
 * // Canvas is now properly sized for Retina displays
 * ```
 */
export function configureCanvasForHighDpi(
	canvas: HTMLCanvasElement,
	width:  number,
	height: number,
): void {
	const dpr = getDevicePixelRatio()

	// Set actual canvas size in memory
	canvas.width = Math.round(width * dpr)
	canvas.height = Math.round(height * dpr)

	// Set display size via CSS
	canvas. style.width = `${width}px`
	canvas.style.height = `${height}px`

	// Scale context to account for DPR
	const ctx = canvas.getContext('2d')
	if (ctx) {
		ctx. scale(dpr, dpr)
	}
}

// ============================================================================
// Touch/Pointer Helpers
// ============================================================================

/**
 * Get center point from multiple touch/pointer positions
 *
 * @param points - Array of points
 * @returns Center point
 *
 * @remarks
 * @preserve Used by GestureRecognizer in Phase 3 for pinch center
 *
 * @example
 * ```ts
 * const center = getCenterPoint([touch1, touch2])
 * ```
 */
export function getCenterPoint(points: readonly Point[]): Point {
	if (points.length === 0) {
		return { x: 0, y: 0 }
	}

	let sumX = 0
	let sumY = 0

	for (const point of points) {
		sumX += point.x
		sumY += point.y
	}

	return {
		x: sumX / points.length,
		y: sumY / points.length,
	}
}

/**
 * Calculate distance between two touch points for pinch gesture
 *
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Distance between points
 *
 * @remarks
 * @preserve Used by GestureRecognizer in Phase 3 for pinch scale
 *
 * @example
 * ```ts
 * const startDist = getPinchDistance(touch1Start, touch2Start)
 * const currentDist = getPinchDistance(touch1, touch2)
 * const scale = currentDist / startDist
 * ```
 */
export function getPinchDistance(p1: Point, p2: Point): number {
	return distance(p1.x, p1.y, p2.x, p2.y)
}

/**
 * Extract point from PointerEvent relative to element
 *
 * @param event - Pointer event
 * @param element - Reference element
 * @returns Point relative to element
 *
 * @remarks
 * @preserve Used by DrawingLayer and TextLayer for input handling
 *
 * @example
 * ```ts
 * canvas.addEventListener('pointerdown', (e) => {
 *   const point = getPointFromPointerEvent(e, canvas)
 * })
 * ```
 */
export function getPointFromPointerEvent(
	event: PointerEvent,
	element: HTMLElement,
): Point {
	const rect = element. getBoundingClientRect()
	return {
		x: event.clientX - rect.left,
		y: event.clientY - rect.top,
	}
}

/**
 * Check if a pointer event is from a touch device
 *
 * @param event - Pointer event
 * @returns True if from touch input
 *
 * @remarks
 * @preserve Used by GestureRecognizer in Phase 3 for input differentiation
 *
 * @example
 * ```ts
 * if (isTouchEvent(event)) {
 *   // Handle touch-specific behavior
 * }
 * ```
 */
export function isTouchEvent(event: PointerEvent): boolean {
	return event.pointerType === 'touch'
}

/**
 * Check if a pointer event is the primary pointer
 *
 * @param event - Pointer event
 * @returns True if primary pointer
 *
 * @remarks
 * @preserve Used by DrawingLayer in Phase 5 to filter multi-touch
 *
 * @example
 * ```ts
 * if (! isPrimaryPointer(event)) return  // Ignore secondary touches
 * ```
 */
export function isPrimaryPointer(event: PointerEvent): boolean {
	return event.isPrimary
}

// ============================================================================
// Debounce/Throttle Helpers
// ============================================================================

/**
 * Create a debounced version of a function
 *
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 *
 * @remarks
 * @preserve Used by resize handling and search input in Phase 2+
 *
 * @example
 * ```ts
 * const debouncedResize = debounce(() => {
 *   editor.renderPage(currentPage)
 * }, 150)
 * window.addEventListener('resize', debouncedResize)
 * ```
 */
export function debounce<T extends(... args: readonly unknown[]) => void>(
	fn:  T,
	delay: number,
): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout> | undefined

	return (...args: Parameters<T>): void => {
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId)
		}
		timeoutId = setTimeout(() => {
			fn(...args)
			timeoutId = undefined
		}, delay)
	}
}

/**
 * Create a throttled version of a function
 *
 * @param fn - Function to throttle
 * @param limit - Minimum time between calls in milliseconds
 * @returns Throttled function
 *
 * @remarks
 * @preserve Used by pointer move handlers in Phase 5 for performance
 *
 * @example
 * ```ts
 * const throttledMove = throttle((e:  PointerEvent) => {
 *   updateStroke(e)
 * }, 16)  // ~60fps
 * canvas.addEventListener('pointermove', throttledMove)
 * ```
 */
export function throttle<T extends(...args: readonly unknown[]) => void>(
	fn: T,
	limit: number,
): (...args: Parameters<T>) => void {
	let lastCall = 0
	let timeoutId: ReturnType<typeof setTimeout> | undefined

	return (...args: Parameters<T>): void => {
		const now = Date.now()
		const timeSinceLastCall = now - lastCall

		if (timeSinceLastCall >= limit) {
			lastCall = now
			fn(...args)
		} else {
			// Schedule a trailing call
			if (timeoutId !== undefined) {
				clearTimeout(timeoutId)
			}
			timeoutId = setTimeout(() => {
				lastCall = Date.now()
				fn(...args)
				timeoutId = undefined
			}, limit - timeSinceLastCall)
		}
	}
}
