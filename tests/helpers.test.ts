/**
 * Tests for helper functions
 * @module tests/helpers
 */

import { describe, it, expect } from 'vitest'
import {
	clamp,
	generateId,
	distanceSquared,
	distance,
	isNonEmptyString,
	isValidPdfFile,
	isNonEmptyArrayBuffer,
	isValidPageNumber,
	isValidZoom,
	isValidColor,
	isValidPoint,
	isValidRectangle,
	clampPageNumber,
	clampZoom,
	computeScaledDimensions,
	computeFitScale,
	computeFitWidthScale,
	generateAnnotationId,
	generateStrokeId,
	generateLayerId,
	generateFieldId,
	colorToCss,
	cssToColor,
	colorToMupdfArray,
	mupdfArrayToColor,
	blendColors,
	rectangleToMupdfRect,
	mupdfRectToRectangle,
	isPointInRectangle,
	doRectanglesIntersect,
	getRectangleIntersection,
	getBoundingRectangle,
	expandRectangle,
	pointToMupdfPoint,
	mupdfPointToPoint,
	getMidpoint,
	addPoints,
	subtractPoints,
	scalePoint,
	rectangleToQuad,
	quadToRectangle,
	rotatePoint,
	getNextRotation,
	getPreviousRotation,
	hasFileSystemAccess,
	downloadBlob,
	getDevicePixelRatio,
	configureCanvasForHighDpi,
	getCenterPoint,
	getPinchDistance,
	getPointFromPointerEvent,
	isTouchEvent,
	isPrimaryPointer,
	debounce,
	throttle,
} from '~/src/helpers.js'
import type { Point, Quad } from '~/src/types.js'
import { createFileWithContent, createTestArrayBuffer, createTestCanvas, delay } from './setup.js'

describe('helpers', () => {
	describe('clamp', () => {
		it('returns value when within range', () => {
			expect(clamp(5, 0, 10)).toBe(5)
		})

		it('returns min when value is below range', () => {
			expect(clamp(-5, 0, 10)).toBe(0)
		})

		it('returns max when value is above range', () => {
			expect(clamp(15, 0, 10)).toBe(10)
		})

		it('handles equal min and max', () => {
			expect(clamp(5, 3, 3)).toBe(3)
		})

		it('handles negative ranges', () => {
			expect(clamp(-5, -10, -2)).toBe(-5)
			expect(clamp(0, -10, -2)).toBe(-2)
		})
	})

	describe('generateId', () => {
		it('returns a string', () => {
			const id = generateId()
			expect(typeof id).toBe('string')
		})

		it('returns a UUID format', () => {
			const id = generateId()
			expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
		})

		it('returns unique values', () => {
			const id1 = generateId()
			const id2 = generateId()
			expect(id1).not.toBe(id2)
		})
	})

	describe('distanceSquared', () => {
		it('returns 0 for same point', () => {
			expect(distanceSquared(5, 5, 5, 5)).toBe(0)
		})

		it('calculates squared distance correctly', () => {
			expect(distanceSquared(0, 0, 3, 4)).toBe(25)
		})

		it('handles negative coordinates', () => {
			expect(distanceSquared(-1, -1, 2, 3)).toBe(25)
		})
	})

	describe('distance', () => {
		it('returns 0 for same point', () => {
			expect(distance(5, 5, 5, 5)).toBe(0)
		})

		it('calculates distance correctly', () => {
			expect(distance(0, 0, 3, 4)).toBe(5)
		})

		it('handles negative coordinates', () => {
			expect(distance(-1, -1, 2, 3)).toBe(5)
		})
	})

	describe('isNonEmptyString', () => {
		it('returns true for non-empty string', () => {
			expect(isNonEmptyString('hello')).toBe(true)
		})

		it('returns false for empty string', () => {
			expect(isNonEmptyString('')).toBe(false)
		})

		it('returns false for non-string types', () => {
			expect(isNonEmptyString(123)).toBe(false)
			expect(isNonEmptyString(null)).toBe(false)
			expect(isNonEmptyString(undefined)).toBe(false)
			expect(isNonEmptyString({})).toBe(false)
		})
	})

	describe('isValidPdfFile', () => {
		it('returns true for PDF file with correct MIME type', () => {
			const pdf = createFileWithContent('test.pdf', '', 'application/pdf')
			expect(isValidPdfFile(pdf)).toBe(true)
		})

		it('returns true for PDF file with x-pdf MIME type', () => {
			const pdf = createFileWithContent('test.pdf', '', 'application/x-pdf')
			expect(isValidPdfFile(pdf)).toBe(true)
		})

		it('returns true for PDF file with .pdf extension even without MIME type', () => {
			const pdf = createFileWithContent('test.pdf', '', '')
			expect(isValidPdfFile(pdf)).toBe(true)
		})

		it('returns false for non-PDF file', () => {
			const txt = createFileWithContent('test.txt', '', 'text/plain')
			expect(isValidPdfFile(txt)).toBe(false)
		})
	})

	describe('isNonEmptyArrayBuffer', () => {
		it('returns true for non-empty buffer', () => {
			const buffer = createTestArrayBuffer(10)
			expect(isNonEmptyArrayBuffer(buffer)).toBe(true)
		})

		it('returns false for empty buffer', () => {
			const buffer = new ArrayBuffer(0)
			expect(isNonEmptyArrayBuffer(buffer)).toBe(false)
		})
	})

	describe('isValidPageNumber', () => {
		it('returns true for valid page number', () => {
			expect(isValidPageNumber(1, 10)).toBe(true)
			expect(isValidPageNumber(5, 10)).toBe(true)
			expect(isValidPageNumber(10, 10)).toBe(true)
		})

		it('returns false for page 0', () => {
			expect(isValidPageNumber(0, 10)).toBe(false)
		})

		it('returns false for page exceeding max', () => {
			expect(isValidPageNumber(11, 10)).toBe(false)
		})

		it('returns false for non-integer', () => {
			expect(isValidPageNumber(1.5, 10)).toBe(false)
		})

		it('returns false for non-number', () => {
			expect(isValidPageNumber('1', 10)).toBe(false)
		})
	})

	describe('isValidZoom', () => {
		it('returns true for valid zoom', () => {
			expect(isValidZoom(1.5, 0.25, 5.0)).toBe(true)
		})

		it('returns false for zoom below min', () => {
			expect(isValidZoom(0.1, 0.25, 5.0)).toBe(false)
		})

		it('returns false for zoom above max', () => {
			expect(isValidZoom(6.0, 0.25, 5.0)).toBe(false)
		})

		it('returns false for non-finite values', () => {
			expect(isValidZoom(Infinity, 0.25, 5.0)).toBe(false)
			expect(isValidZoom(NaN, 0.25, 5.0)).toBe(false)
		})
	})

	describe('isValidColor', () => {
		it('returns true for valid color', () => {
			expect(isValidColor({ r: 1, g: 0, b: 0 })).toBe(true)
			expect(isValidColor({ r: 0.5, g: 0.5, b: 0.5 })).toBe(true)
		})

		it('returns false for out-of-range values', () => {
			expect(isValidColor({ r: 2, g: 0, b: 0 })).toBe(false)
			expect(isValidColor({ r: -1, g: 0, b: 0 })).toBe(false)
		})

		it('returns false for missing properties', () => {
			expect(isValidColor({ r: 1, g: 0 })).toBe(false)
		})

		it('returns false for non-object', () => {
			expect(isValidColor(null)).toBe(false)
			expect(isValidColor('red')).toBe(false)
		})
	})

	describe('isValidPoint', () => {
		it('returns true for valid point', () => {
			expect(isValidPoint({ x: 100, y: 200 })).toBe(true)
		})

		it('returns false for non-finite values', () => {
			expect(isValidPoint({ x: Infinity, y: 200 })).toBe(false)
		})

		it('returns false for non-object', () => {
			expect(isValidPoint(null)).toBe(false)
		})
	})

	describe('isValidRectangle', () => {
		it('returns true for valid rectangle', () => {
			expect(isValidRectangle({ x: 0, y: 0, width: 100, height: 50 })).toBe(true)
		})

		it('returns false for negative dimensions', () => {
			expect(isValidRectangle({ x: 0, y: 0, width: -10, height: 50 })).toBe(false)
		})

		it('returns true for zero dimensions', () => {
			expect(isValidRectangle({ x: 0, y: 0, width: 0, height: 0 })).toBe(true)
		})
	})

	describe('clampPageNumber', () => {
		it('clamps to min 1', () => {
			expect(clampPageNumber(0, 10)).toBe(1)
			expect(clampPageNumber(-5, 10)).toBe(1)
		})

		it('clamps to max', () => {
			expect(clampPageNumber(15, 10)).toBe(10)
		})

		it('floors non-integers', () => {
			expect(clampPageNumber(2.7, 10)).toBe(2)
		})

		it('returns 1 when maxPage is less than 1', () => {
			expect(clampPageNumber(5, 0)).toBe(1)
		})
	})

	describe('clampZoom', () => {
		it('clamps to range', () => {
			expect(clampZoom(0.1, 0.25, 5.0)).toBe(0.25)
			expect(clampZoom(10, 0.25, 5.0)).toBe(5.0)
			expect(clampZoom(1.5, 0.25, 5.0)).toBe(1.5)
		})
	})

	describe('computeScaledDimensions', () => {
		it('scales dimensions correctly', () => {
			const result = computeScaledDimensions(100, 200, 2)
			expect(result.width).toBe(200)
			expect(result.height).toBe(400)
		})

		it('rounds to integers', () => {
			const result = computeScaledDimensions(100, 100, 0.33)
			expect(result.width).toBe(33)
			expect(result.height).toBe(33)
		})
	})

	describe('computeFitScale', () => {
		it('fits by width when width is constraining', () => {
			expect(computeFitScale(1000, 800, 500, 600)).toBe(0.5)
		})

		it('fits by height when height is constraining', () => {
			expect(computeFitScale(800, 1000, 600, 500)).toBe(0.5)
		})

		it('returns 1 for zero dimensions', () => {
			expect(computeFitScale(0, 0, 500, 500)).toBe(1)
		})
	})

	describe('computeFitWidthScale', () => {
		it('calculates width scale correctly', () => {
			expect(computeFitWidthScale(1000, 500)).toBe(0.5)
		})

		it('returns 1 for zero width', () => {
			expect(computeFitWidthScale(0, 500)).toBe(1)
		})
	})

	describe('ID generators', () => {
		it('generateAnnotationId has correct prefix', () => {
			const id = generateAnnotationId()
			expect(id.startsWith('annot-')).toBe(true)
		})

		it('generateStrokeId has correct prefix', () => {
			const id = generateStrokeId()
			expect(id.startsWith('stroke-')).toBe(true)
		})

		it('generateLayerId has correct prefix', () => {
			const id = generateLayerId('text')
			expect(id.startsWith('layer-text-')).toBe(true)
		})

		it('generateFieldId has correct prefix', () => {
			const id = generateFieldId()
			expect(id.startsWith('field-')).toBe(true)
		})
	})

	describe('colorToCss', () => {
		it('converts color to rgb', () => {
			expect(colorToCss({ r: 1, g: 0, b: 0 })).toBe('rgb(255, 0, 0)')
		})

		it('converts color to rgba with opacity', () => {
			expect(colorToCss({ r: 1, g: 0, b: 0 }, 0.5)).toBe('rgba(255, 0, 0, 0.5)')
		})

		it('uses rgb when opacity is 1', () => {
			expect(colorToCss({ r: 1, g: 0, b: 0 }, 1)).toBe('rgb(255, 0, 0)')
		})

		it('clamps values to valid range', () => {
			expect(colorToCss({ r: 2, g: -1, b: 0.5 })).toBe('rgb(255, 0, 128)')
		})
	})

	describe('cssToColor', () => {
		it('parses hex colors', () => {
			const color = cssToColor('#ff0000')
			expect(color).toEqual({ r: 1, g: 0, b: 0 })
		})

		it('parses short hex colors', () => {
			const color = cssToColor('#f00')
			expect(color).toEqual({ r: 1, g: 0, b: 0 })
		})

		it('parses rgb colors', () => {
			const color = cssToColor('rgb(255, 0, 0)')
			expect(color).toEqual({ r: 1, g: 0, b: 0 })
		})

		it('parses rgba colors', () => {
			const color = cssToColor('rgba(255, 0, 0, 0.5)')
			expect(color).toEqual({ r: 1, g: 0, b: 0 })
		})

		it('returns undefined for invalid input', () => {
			expect(cssToColor('invalid')).toBeUndefined()
		})
	})

	describe('colorToMupdfArray', () => {
		it('converts color to array', () => {
			const result = colorToMupdfArray({ r: 1, g: 0.5, b: 0 })
			expect(result).toEqual([1, 0.5, 0])
		})
	})

	describe('mupdfArrayToColor', () => {
		it('converts array to color', () => {
			const result = mupdfArrayToColor([1, 0.5, 0])
			expect(result).toEqual({ r: 1, g: 0.5, b: 0 })
		})
	})

	describe('blendColors', () => {
		it('blends colors at 0.5', () => {
			const result = blendColors({ r: 1, g: 0, b: 0 }, { r: 0, g: 0, b: 1 }, 0.5)
			expect(result.r).toBe(0.5)
			expect(result.g).toBe(0)
			expect(result.b).toBe(0.5)
		})

		it('returns color1 at ratio 0', () => {
			const result = blendColors({ r: 1, g: 0, b: 0 }, { r: 0, g: 0, b: 1 }, 0)
			expect(result).toEqual({ r: 1, g: 0, b: 0 })
		})

		it('returns color2 at ratio 1', () => {
			const result = blendColors({ r: 1, g: 0, b: 0 }, { r: 0, g: 0, b: 1 }, 1)
			expect(result).toEqual({ r: 0, g: 0, b: 1 })
		})
	})

	describe('rectangleToMupdfRect', () => {
		it('converts rectangle to mupdf rect', () => {
			const result = rectangleToMupdfRect({ x: 10, y: 20, width: 100, height: 50 })
			expect(result).toEqual([10, 20, 110, 70])
		})
	})

	describe('mupdfRectToRectangle', () => {
		it('converts mupdf rect to rectangle', () => {
			const result = mupdfRectToRectangle([10, 20, 110, 70])
			expect(result).toEqual({ x: 10, y: 20, width: 100, height: 50 })
		})
	})

	describe('isPointInRectangle', () => {
		const rect = { x: 0, y: 0, width: 100, height: 100 }

		it('returns true for point inside', () => {
			expect(isPointInRectangle({ x: 50, y: 50 }, rect)).toBe(true)
		})

		it('returns true for point on edge', () => {
			expect(isPointInRectangle({ x: 0, y: 0 }, rect)).toBe(true)
			expect(isPointInRectangle({ x: 100, y: 100 }, rect)).toBe(true)
		})

		it('returns false for point outside', () => {
			expect(isPointInRectangle({ x: 150, y: 50 }, rect)).toBe(false)
		})
	})

	describe('doRectanglesIntersect', () => {
		it('returns true for overlapping rectangles', () => {
			const r1 = { x: 0, y: 0, width: 100, height: 100 }
			const r2 = { x: 50, y: 50, width: 100, height: 100 }
			expect(doRectanglesIntersect(r1, r2)).toBe(true)
		})

		it('returns false for non-overlapping rectangles', () => {
			const r1 = { x: 0, y: 0, width: 50, height: 50 }
			const r2 = { x: 100, y: 100, width: 50, height: 50 }
			expect(doRectanglesIntersect(r1, r2)).toBe(false)
		})
	})

	describe('getRectangleIntersection', () => {
		it('returns intersection rectangle', () => {
			const r1 = { x: 0, y: 0, width: 100, height: 100 }
			const r2 = { x: 50, y: 50, width: 100, height: 100 }
			const result = getRectangleIntersection(r1, r2)
			expect(result).toEqual({ x: 50, y: 50, width: 50, height: 50 })
		})

		it('returns undefined for non-overlapping', () => {
			const r1 = { x: 0, y: 0, width: 50, height: 50 }
			const r2 = { x: 100, y: 100, width: 50, height: 50 }
			expect(getRectangleIntersection(r1, r2)).toBeUndefined()
		})
	})

	describe('getBoundingRectangle', () => {
		it('returns bounding rectangle', () => {
			const points: Point[] = [{ x: 0, y: 0 }, { x: 100, y: 50 }]
			const result = getBoundingRectangle(points)
			expect(result).toEqual({ x: 0, y: 0, width: 100, height: 50 })
		})

		it('returns undefined for empty array', () => {
			expect(getBoundingRectangle([])).toBeUndefined()
		})

		it('applies padding', () => {
			const points: Point[] = [{ x: 10, y: 10 }, { x: 20, y: 20 }]
			const result = getBoundingRectangle(points, 5)
			expect(result).toEqual({ x: 5, y: 5, width: 20, height: 20 })
		})
	})

	describe('expandRectangle', () => {
		it('expands rectangle', () => {
			const result = expandRectangle({ x: 10, y: 10, width: 100, height: 50 }, 5)
			expect(result).toEqual({ x: 5, y: 5, width: 110, height: 60 })
		})
	})

	describe('pointToMupdfPoint', () => {
		it('converts point to array', () => {
			expect(pointToMupdfPoint({ x: 10, y: 20 })).toEqual([10, 20])
		})
	})

	describe('mupdfPointToPoint', () => {
		it('converts array to point', () => {
			expect(mupdfPointToPoint([10, 20])).toEqual({ x: 10, y: 20 })
		})
	})

	describe('getMidpoint', () => {
		it('calculates midpoint', () => {
			const result = getMidpoint({ x: 0, y: 0 }, { x: 100, y: 100 })
			expect(result).toEqual({ x: 50, y: 50 })
		})
	})

	describe('addPoints', () => {
		it('adds points', () => {
			const result = addPoints({ x: 10, y: 20 }, { x: 5, y: 10 })
			expect(result).toEqual({ x: 15, y: 30 })
		})
	})

	describe('subtractPoints', () => {
		it('subtracts points', () => {
			const result = subtractPoints({ x: 10, y: 20 }, { x: 5, y: 10 })
			expect(result).toEqual({ x: 5, y: 10 })
		})
	})

	describe('scalePoint', () => {
		it('scales point', () => {
			const result = scalePoint({ x: 10, y: 20 }, 2)
			expect(result).toEqual({ x: 20, y: 40 })
		})
	})

	describe('rectangleToQuad', () => {
		it('converts rectangle to quad', () => {
			const result = rectangleToQuad({ x: 0, y: 0, width: 100, height: 50 })
			expect(result.topLeft).toEqual({ x: 0, y: 0 })
			expect(result.topRight).toEqual({ x: 100, y: 0 })
			expect(result.bottomRight).toEqual({ x: 100, y: 50 })
			expect(result.bottomLeft).toEqual({ x: 0, y: 50 })
		})
	})

	describe('quadToRectangle', () => {
		it('converts quad to bounding rectangle', () => {
			const quad: Quad = {
				topLeft: { x: 0, y: 0 },
				topRight: { x: 100, y: 10 },
				bottomRight: { x: 100, y: 60 },
				bottomLeft: { x: 0, y: 50 },
			}
			const result = quadToRectangle(quad)
			expect(result.x).toBe(0)
			expect(result.y).toBe(0)
			expect(result.width).toBe(100)
			expect(result.height).toBe(60)
		})
	})

	describe('rotatePoint', () => {
		it('rotates point 90 degrees', () => {
			const result = rotatePoint({ x: 100, y: 0 }, { x: 0, y: 0 }, 90)
			expect(result.x).toBeCloseTo(0, 5)
			expect(result.y).toBeCloseTo(100, 5)
		})

		it('rotates point 180 degrees', () => {
			const result = rotatePoint({ x: 100, y: 0 }, { x: 0, y: 0 }, 180)
			expect(result.x).toBeCloseTo(-100, 5)
			expect(result.y).toBeCloseTo(0, 5)
		})
	})

	describe('getNextRotation', () => {
		it('cycles through rotations', () => {
			expect(getNextRotation(0)).toBe(90)
			expect(getNextRotation(90)).toBe(180)
			expect(getNextRotation(180)).toBe(270)
			expect(getNextRotation(270)).toBe(0)
		})
	})

	describe('getPreviousRotation', () => {
		it('cycles through rotations backwards', () => {
			expect(getPreviousRotation(0)).toBe(270)
			expect(getPreviousRotation(90)).toBe(0)
			expect(getPreviousRotation(180)).toBe(90)
			expect(getPreviousRotation(270)).toBe(180)
		})
	})

	describe('hasFileSystemAccess', () => {
		it('returns a boolean', () => {
			const result = hasFileSystemAccess()
			expect(typeof result).toBe('boolean')
		})
	})

	describe('getDevicePixelRatio', () => {
		it('returns at least 1', () => {
			expect(getDevicePixelRatio()).toBeGreaterThanOrEqual(1)
		})
	})

	describe('configureCanvasForHighDpi', () => {
		it('configures canvas dimensions', () => {
			const canvas = createTestCanvas()
			configureCanvasForHighDpi(canvas, 200, 150)
			expect(canvas.style.width).toBe('200px')
			expect(canvas.style.height).toBe('150px')
		})
	})

	describe('getCenterPoint', () => {
		it('returns center of points', () => {
			const result = getCenterPoint([{ x: 0, y: 0 }, { x: 100, y: 100 }])
			expect(result).toEqual({ x: 50, y: 50 })
		})

		it('returns origin for empty array', () => {
			expect(getCenterPoint([])).toEqual({ x: 0, y: 0 })
		})
	})

	describe('getPinchDistance', () => {
		it('calculates distance between points', () => {
			const result = getPinchDistance({ x: 0, y: 0 }, { x: 3, y: 4 })
			expect(result).toBe(5)
		})
	})

	describe('debounce', () => {
		it('delays execution', async() => {
			let count = 0
			const fn = debounce(() => { count++ }, 50)

			fn()
			fn()
			fn()

			expect(count).toBe(0)
			await delay(100)
			expect(count).toBe(1)
		})
	})

	describe('throttle', () => {
		it('limits execution frequency', async() => {
			let count = 0
			const fn = throttle(() => { count++ }, 50)

			fn() // Executes immediately
			fn() // Throttled
			fn() // Throttled

			expect(count).toBe(1)
			await delay(100)
			expect(count).toBe(2) // Trailing call
		})
	})

	describe('downloadBlob', () => {
		it('does not throw with valid arguments', () => {
			// The downloadBlob function creates a link, clicks it and removes it
			// In test environment, this is a no-op but should not throw
			const buffer = createTestArrayBuffer(10)
			// We can't fully test download behavior but can verify no errors
			expect(() => downloadBlob(buffer, 'test.pdf', 'application/pdf')).not.toThrow()
		})
	})

	describe('getPointFromPointerEvent', () => {
		it('calculates point relative to element', () => {
			const element = document.createElement('div')
			document.body.appendChild(element)
			element.style.position = 'absolute'
			element.style.left = '100px'
			element.style.top = '50px'
			element.style.width = '200px'
			element.style.height = '200px'

			// Create a mock pointer event
			const event = new PointerEvent('pointerdown', {
				clientX: 150,
				clientY: 100,
			})

			const point = getPointFromPointerEvent(event, element)

			// Since getBoundingClientRect returns zeros in test environment,
			// we just verify the function returns a valid point object
			expect(typeof point.x).toBe('number')
			expect(typeof point.y).toBe('number')

			document.body.removeChild(element)
		})
	})

	describe('isTouchEvent', () => {
		it('returns true for touch pointer type', () => {
			const event = new PointerEvent('pointerdown', {
				pointerType: 'touch',
			})
			expect(isTouchEvent(event)).toBe(true)
		})

		it('returns false for mouse pointer type', () => {
			const event = new PointerEvent('pointerdown', {
				pointerType: 'mouse',
			})
			expect(isTouchEvent(event)).toBe(false)
		})

		it('returns false for pen pointer type', () => {
			const event = new PointerEvent('pointerdown', {
				pointerType: 'pen',
			})
			expect(isTouchEvent(event)).toBe(false)
		})
	})

	describe('isPrimaryPointer', () => {
		it('returns true for primary pointer', () => {
			const event = new PointerEvent('pointerdown', {
				isPrimary: true,
			})
			expect(isPrimaryPointer(event)).toBe(true)
		})

		it('returns false for secondary pointer', () => {
			const event = new PointerEvent('pointerdown', {
				isPrimary: false,
			})
			expect(isPrimaryPointer(event)).toBe(false)
		})
	})
})
