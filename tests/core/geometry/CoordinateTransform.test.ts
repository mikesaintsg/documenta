/**
 * Tests for CoordinateTransform
 * @module tests/core/geometry/CoordinateTransform
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CoordinateTransform } from '~/src/core/geometry/CoordinateTransform.js'
import { createTestElement } from '../../setup.js'

describe('CoordinateTransform', () => {
	let transform: CoordinateTransform
	let element: HTMLElement

	beforeEach(() => {
		element = createTestElement()
		element.style.position = 'absolute'
		element.style.left = '0px'
		element.style.top = '0px'
		element.style.width = '800px'
		element.style.height = '600px'
		document.body.appendChild(element)
		transform = new CoordinateTransform(element)
	})

	describe('constructor', () => {
		it('creates instance without element', () => {
			const t = new CoordinateTransform()
			expect(t).toBeInstanceOf(CoordinateTransform)
		})

		it('creates instance with element', () => {
			const t = new CoordinateTransform(element)
			expect(t).toBeInstanceOf(CoordinateTransform)
		})
	})

	describe('setScale', () => {
		it('sets scale factor', () => {
			transform.setScale(2)
			expect(transform.getScale()).toBe(2)
		})

		it('handles fractional scales', () => {
			transform.setScale(0.5)
			expect(transform.getScale()).toBe(0.5)
		})

		it('handles very small scales', () => {
			transform.setScale(0.01)
			expect(transform.getScale()).toBe(0.01)
		})

		it('handles large scales', () => {
			transform.setScale(10)
			expect(transform.getScale()).toBe(10)
		})
	})

	describe('setRotation', () => {
		it('sets rotation to 0', () => {
			transform.setRotation(0)
			expect(transform.getRotation()).toBe(0)
		})

		it('sets rotation to 90', () => {
			transform.setRotation(90)
			expect(transform.getRotation()).toBe(90)
		})

		it('sets rotation to 180', () => {
			transform.setRotation(180)
			expect(transform.getRotation()).toBe(180)
		})

		it('sets rotation to 270', () => {
			transform.setRotation(270)
			expect(transform.getRotation()).toBe(270)
		})
	})

	describe('setOffset', () => {
		it('sets offset values', () => {
			transform.setOffset(100, 200)
			// Verify by checking coordinate transformation
			transform.setScale(1)
			const result = transform.clientToPage(100, 200)
			expect(result.x).toBe(0)
			expect(result.y).toBe(0)
		})
	})

	describe('setPageSize', () => {
		it('sets page dimensions', () => {
			transform.setPageSize(612, 792)
			// Page size is used for rotation center calculation
			expect(transform).toBeInstanceOf(CoordinateTransform)
		})
	})

	describe('setElement', () => {
		it('sets element after construction', () => {
			const newTransform = new CoordinateTransform()
			newTransform.setElement(element)
			expect(newTransform).toBeInstanceOf(CoordinateTransform)
		})
	})

	describe('clientToPage', () => {
		it('converts client coordinates to page coordinates at scale 1', () => {
			transform.setScale(1)
			transform.setOffset(0, 0)
			const result = transform.clientToPage(100, 200)
			expect(result.x).toBeCloseTo(100, 1)
			expect(result.y).toBeCloseTo(200, 1)
		})

		it('converts with scale factor 2', () => {
			transform.setScale(2)
			transform.setOffset(0, 0)
			const result = transform.clientToPage(200, 400)
			expect(result.x).toBeCloseTo(100, 1)
			expect(result.y).toBeCloseTo(200, 1)
		})

		it('converts with scale factor 0.5', () => {
			transform.setScale(0.5)
			transform.setOffset(0, 0)
			const result = transform.clientToPage(50, 100)
			expect(result.x).toBeCloseTo(100, 1)
			expect(result.y).toBeCloseTo(200, 1)
		})

		it('handles negative coordinates', () => {
			transform.setScale(1)
			transform.setOffset(0, 0)
			const result = transform.clientToPage(-100, -50)
			expect(result.x).toBeCloseTo(-100, 1)
			expect(result.y).toBeCloseTo(-50, 1)
		})

		it('handles zero coordinates', () => {
			transform.setScale(1)
			transform.setOffset(0, 0)
			const result = transform.clientToPage(0, 0)
			expect(result.x).toBeCloseTo(0, 1)
			expect(result.y).toBeCloseTo(0, 1)
		})
	})

	describe('pageToClient', () => {
		it('converts page coordinates to client coordinates at scale 1', () => {
			transform.setScale(1)
			transform.setOffset(0, 0)
			const result = transform.pageToClient(100, 200)
			expect(result.x).toBeCloseTo(100, 1)
			expect(result.y).toBeCloseTo(200, 1)
		})

		it('converts with scale factor 2', () => {
			transform.setScale(2)
			transform.setOffset(0, 0)
			const result = transform.pageToClient(100, 200)
			expect(result.x).toBeCloseTo(200, 1)
			expect(result.y).toBeCloseTo(400, 1)
		})

		it('converts with scale factor 0.5', () => {
			transform.setScale(0.5)
			transform.setOffset(0, 0)
			const result = transform.pageToClient(100, 200)
			expect(result.x).toBeCloseTo(50, 1)
			expect(result.y).toBeCloseTo(100, 1)
		})

		it('handles negative coordinates', () => {
			transform.setScale(1)
			transform.setOffset(0, 0)
			const result = transform.pageToClient(-100, -50)
			expect(result.x).toBeCloseTo(-100, 1)
			expect(result.y).toBeCloseTo(-50, 1)
		})
	})

	describe('pageToClientDistance', () => {
		it('converts distance at scale 1', () => {
			transform.setScale(1)
			expect(transform.pageToClientDistance(100)).toBe(100)
		})

		it('converts distance at scale 2', () => {
			transform.setScale(2)
			expect(transform.pageToClientDistance(100)).toBe(200)
		})

		it('converts distance at scale 0.5', () => {
			transform.setScale(0.5)
			expect(transform.pageToClientDistance(100)).toBe(50)
		})

		it('handles zero distance', () => {
			transform.setScale(2)
			expect(transform.pageToClientDistance(0)).toBe(0)
		})

		it('handles negative distance', () => {
			transform.setScale(2)
			expect(transform.pageToClientDistance(-50)).toBe(-100)
		})
	})

	describe('clientToPageDistance', () => {
		it('converts distance at scale 1', () => {
			transform.setScale(1)
			expect(transform.clientToPageDistance(100)).toBe(100)
		})

		it('converts distance at scale 2', () => {
			transform.setScale(2)
			expect(transform.clientToPageDistance(200)).toBe(100)
		})

		it('converts distance at scale 0.5', () => {
			transform.setScale(0.5)
			expect(transform.clientToPageDistance(50)).toBe(100)
		})

		it('handles zero distance', () => {
			transform.setScale(2)
			expect(transform.clientToPageDistance(0)).toBe(0)
		})
	})

	describe('getScale', () => {
		it('returns default scale of 1', () => {
			expect(transform.getScale()).toBe(1)
		})

		it('returns set scale', () => {
			transform.setScale(2.5)
			expect(transform.getScale()).toBe(2.5)
		})
	})

	describe('getRotation', () => {
		it('returns default rotation of 0', () => {
			expect(transform.getRotation()).toBe(0)
		})

		it('returns set rotation', () => {
			transform.setRotation(90)
			expect(transform.getRotation()).toBe(90)
		})
	})

	describe('round-trip conversions', () => {
		it('clientToPage then pageToClient returns original', () => {
			transform.setScale(1.5)
			transform.setOffset(10, 20)

			const original = { x: 150, y: 250 }
			const page = transform.clientToPage(original.x, original.y)
			const client = transform.pageToClient(page.x, page.y)

			expect(client.x).toBeCloseTo(original.x, 1)
			expect(client.y).toBeCloseTo(original.y, 1)
		})

		it('pageToClient then clientToPage returns original', () => {
			transform.setScale(2)
			transform.setOffset(5, 10)

			const original = { x: 100, y: 200 }
			const client = transform.pageToClient(original.x, original.y)
			const page = transform.clientToPage(client.x, client.y)

			expect(page.x).toBeCloseTo(original.x, 1)
			expect(page.y).toBeCloseTo(original.y, 1)
		})
	})

	describe('edge cases', () => {
		it('handles very large coordinates', () => {
			transform.setScale(1)
			const result = transform.clientToPage(1000000, 1000000)
			expect(result.x).toBeCloseTo(1000000, 1)
			expect(result.y).toBeCloseTo(1000000, 1)
		})

		it('handles very small scale', () => {
			transform.setScale(0.001)
			const result = transform.pageToClientDistance(1000)
			expect(result).toBeCloseTo(1, 1)
		})

		it('works without element set', () => {
			const t = new CoordinateTransform()
			t.setScale(2)
			const result = t.clientToPage(100, 100)
			expect(result.x).toBeCloseTo(50, 1)
			expect(result.y).toBeCloseTo(50, 1)
		})
	})
})
