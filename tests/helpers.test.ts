/**
 * Documenta - Helpers Unit Tests
 * @module tests/helpers.test
 */

import { describe, it, expect } from 'vitest'
import {
	isNonEmptyString,
	isValidPdfFile,
	isNonEmptyArrayBuffer,
	isValidPageNumber,
	isValidZoom,
	clampPageNumber,
	clampZoom,
	computeScaledDimensions,
	computeFitScale,
	computeFitWidthScale,
	generateAnnotationId,
	colorToCss,
	cssToColor,
	colorToMupdfArray,
	rectangleToMupdfRect,
	mupdfRectToRectangle,
	pointToMupdfPoint,
	mupdfPointToPoint,
	hasFileSystemAccess,
} from '../src/helpers.js'
import type { AnnotationColor, Rectangle, Point } from '../src/types.js'

describe('helpers', () => {
	describe('isNonEmptyString', () => {
		it('returns true for non-empty string', () => {
			expect(isNonEmptyString('hello')).toBe(true)
		})

		it('returns false for empty string', () => {
			expect(isNonEmptyString('')).toBe(false)
		})

		it('returns false for non-string values', () => {
			expect(isNonEmptyString(123)).toBe(false)
			expect(isNonEmptyString(null)).toBe(false)
			expect(isNonEmptyString(undefined)).toBe(false)
			expect(isNonEmptyString({})).toBe(false)
		})
	})

	describe('isValidPdfFile', () => {
		it('returns true for PDF file with correct type', () => {
			const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
			expect(isValidPdfFile(file)).toBe(true)
		})

		it('returns true for PDF file with correct extension', () => {
			const file = new File(['test'], 'document.pdf', { type: '' })
			expect(isValidPdfFile(file)).toBe(true)
		})

		it('returns false for non-PDF file', () => {
			const file = new File(['test'], 'image.png', { type: 'image/png' })
			expect(isValidPdfFile(file)).toBe(false)
		})
	})

	describe('isNonEmptyArrayBuffer', () => {
		it('returns true for non-empty buffer', () => {
			const buffer = new ArrayBuffer(10)
			expect(isNonEmptyArrayBuffer(buffer)).toBe(true)
		})

		it('returns false for empty buffer', () => {
			const buffer = new ArrayBuffer(0)
			expect(isNonEmptyArrayBuffer(buffer)).toBe(false)
		})
	})

	describe('isValidPageNumber', () => {
		it('returns true for valid page numbers', () => {
			expect(isValidPageNumber(1, 10)).toBe(true)
			expect(isValidPageNumber(5, 10)).toBe(true)
			expect(isValidPageNumber(10, 10)).toBe(true)
		})

		it('returns false for invalid page numbers', () => {
			expect(isValidPageNumber(0, 10)).toBe(false)
			expect(isValidPageNumber(11, 10)).toBe(false)
			expect(isValidPageNumber(-1, 10)).toBe(false)
			expect(isValidPageNumber(1.5, 10)).toBe(false)
		})

		it('returns false for non-number values', () => {
			expect(isValidPageNumber('1', 10)).toBe(false)
			expect(isValidPageNumber(null, 10)).toBe(false)
		})
	})

	describe('isValidZoom', () => {
		it('returns true for valid zoom levels', () => {
			expect(isValidZoom(0.5, 0.25, 5)).toBe(true)
			expect(isValidZoom(1, 0.25, 5)).toBe(true)
			expect(isValidZoom(3.5, 0.25, 5)).toBe(true)
		})

		it('returns false for zoom outside range', () => {
			expect(isValidZoom(0.1, 0.25, 5)).toBe(false)
			expect(isValidZoom(6, 0.25, 5)).toBe(false)
		})

		it('returns false for non-number values', () => {
			expect(isValidZoom('1', 0.25, 5)).toBe(false)
			expect(isValidZoom(Infinity, 0.25, 5)).toBe(false)
		})
	})

	describe('clampPageNumber', () => {
		it('clamps page to valid range', () => {
			expect(clampPageNumber(0, 10)).toBe(1)
			expect(clampPageNumber(5, 10)).toBe(5)
			expect(clampPageNumber(15, 10)).toBe(10)
		})

		it('handles edge case of maxPage < 1', () => {
			expect(clampPageNumber(5, 0)).toBe(1)
		})

		it('floors decimal page numbers', () => {
			expect(clampPageNumber(3.7, 10)).toBe(3)
		})
	})

	describe('clampZoom', () => {
		it('clamps zoom to valid range', () => {
			expect(clampZoom(0.1, 0.25, 5)).toBe(0.25)
			expect(clampZoom(1, 0.25, 5)).toBe(1)
			expect(clampZoom(10, 0.25, 5)).toBe(5)
		})
	})

	describe('computeScaledDimensions', () => {
		it('scales dimensions correctly', () => {
			const result = computeScaledDimensions(100, 200, 2)
			expect(result.width).toBe(200)
			expect(result.height).toBe(400)
		})

		it('rounds dimensions', () => {
			const result = computeScaledDimensions(100, 100, 1.5)
			expect(result.width).toBe(150)
			expect(result.height).toBe(150)
		})
	})

	describe('computeFitScale', () => {
		it('computes scale to fit in container', () => {
			const scale = computeFitScale(100, 100, 200, 200)
			expect(scale).toBe(2)
		})

		it('constrains by width when wider', () => {
			const scale = computeFitScale(200, 100, 100, 100)
			expect(scale).toBe(0.5)
		})

		it('constrains by height when taller', () => {
			const scale = computeFitScale(100, 200, 100, 100)
			expect(scale).toBe(0.5)
		})
	})

	describe('computeFitWidthScale', () => {
		it('computes scale to fit width', () => {
			const scale = computeFitWidthScale(100, 200)
			expect(scale).toBe(2)
		})
	})

	describe('generateAnnotationId', () => {
		it('generates unique IDs', () => {
			const id1 = generateAnnotationId()
			const id2 = generateAnnotationId()
			expect(id1).not.toBe(id2)
		})

		it('generates IDs with correct prefix', () => {
			const id = generateAnnotationId()
			expect(id.startsWith('annot-')).toBe(true)
		})
	})

	describe('colorToCss', () => {
		it('converts color to CSS rgb', () => {
			const color: AnnotationColor = { r: 1, g: 0, b: 0 }
			expect(colorToCss(color)).toBe('rgb(255, 0, 0)')
		})

		it('converts color with opacity to rgba', () => {
			const color: AnnotationColor = { r: 1, g: 0, b: 0 }
			expect(colorToCss(color, 0.5)).toBe('rgba(255, 0, 0, 0.5)')
		})

		it('clamps values to valid range', () => {
			const color: AnnotationColor = { r: 1.5, g: -0.5, b: 0.5 }
			expect(colorToCss(color)).toBe('rgb(255, 0, 128)')
		})
	})

	describe('cssToColor', () => {
		it('parses hex color', () => {
			const color = cssToColor('#ff0000')
			expect(color).toEqual({ r: 1, g: 0, b: 0 })
		})

		it('parses short hex color', () => {
			const color = cssToColor('#f00')
			expect(color).toEqual({ r: 1, g: 0, b: 0 })
		})

		it('parses rgb color', () => {
			const color = cssToColor('rgb(255, 0, 0)')
			expect(color).toEqual({ r: 1, g: 0, b: 0 })
		})

		it('parses rgba color', () => {
			const color = cssToColor('rgba(255, 0, 0, 0.5)')
			expect(color).toEqual({ r: 1, g: 0, b: 0 })
		})

		it('returns undefined for invalid color', () => {
			const color = cssToColor('invalid')
			expect(color).toBeUndefined()
		})
	})

	describe('colorToMupdfArray', () => {
		it('converts color to array', () => {
			const color: AnnotationColor = { r: 1, g: 0.5, b: 0 }
			expect(colorToMupdfArray(color)).toEqual([1, 0.5, 0])
		})
	})

	describe('rectangleToMupdfRect', () => {
		it('converts rectangle to mupdf rect', () => {
			const rect: Rectangle = { x: 10, y: 20, width: 100, height: 50 }
			expect(rectangleToMupdfRect(rect)).toEqual([10, 20, 110, 70])
		})
	})

	describe('mupdfRectToRectangle', () => {
		it('converts mupdf rect to rectangle', () => {
			const mupdfRect: [number, number, number, number] = [10, 20, 110, 70]
			expect(mupdfRectToRectangle(mupdfRect)).toEqual({
				x: 10,
				y: 20,
				width: 100,
				height: 50,
			})
		})
	})

	describe('pointToMupdfPoint', () => {
		it('converts point to mupdf point', () => {
			const point: Point = { x: 10, y: 20 }
			expect(pointToMupdfPoint(point)).toEqual([10, 20])
		})
	})

	describe('mupdfPointToPoint', () => {
		it('converts mupdf point to point', () => {
			const mupdfPoint: readonly [number, number] = [10, 20]
			expect(mupdfPointToPoint(mupdfPoint)).toEqual({ x: 10, y: 20 })
		})
	})

	describe('hasFileSystemAccess', () => {
		it('returns a boolean', () => {
			const result = hasFileSystemAccess()
			expect(typeof result).toBe('boolean')
		})
	})
})
