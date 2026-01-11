/**
 * CoordinateTransform - Coordinate system transformations
 * @module core/geometry/CoordinateTransform
 *
 * Converts between client (screen) and page (PDF) coordinates.
 */

import type {
	CoordinateTransformInterface,
	Point,
	PageRotation,
} from '../../types.js'
import { rotatePoint } from '../../helpers.js'

/**
 * CoordinateTransform - Handles coordinate system conversions
 *
 * @remarks
 * Converts between:
 * - Client coordinates (screen pixels relative to viewport)
 * - Page coordinates (PDF points relative to page origin)
 *
 * Handles zoom, devicePixelRatio, and page rotation.
 */
export class CoordinateTransform implements CoordinateTransformInterface {
	#scale = 1
	#rotation: PageRotation = 0
	#offsetX = 0
	#offsetY = 0
	#element: HTMLElement | undefined
	#pageWidth = 0
	#pageHeight = 0

	constructor(element?: HTMLElement) {
		this.#element = element
	}

	setScale(scale: number): void {
		this.#scale = scale
	}

	setRotation(rotation: PageRotation): void {
		this.#rotation = rotation
	}

	setOffset(offsetX: number, offsetY: number): void {
		this.#offsetX = offsetX
		this.#offsetY = offsetY
	}

	setContainerBounds(_bounds: DOMRect): void {
		// Store bounds for coordinate calculations
		// The element is typically set separately, but bounds can be used directly
	}

	setPageSize(width: number, height: number): void {
		this.#pageWidth = width
		this.#pageHeight = height
	}

	setElement(element: HTMLElement): void {
		this.#element = element
	}

	/**
	 * Convert client coordinates to page coordinates
	 *
	 * @param clientX - Client X coordinate
	 * @param clientY - Client Y coordinate
	 * @returns Point in page coordinate space (PDF points)
	 */
	clientToPage(clientX: number, clientY: number): Point {
		const rect = this.#element?.getBoundingClientRect()
		const elementX = rect?.left ?? 0
		const elementY = rect?.top ?? 0

		// Convert to element-relative coordinates
		let x = clientX - elementX - this.#offsetX
		let y = clientY - elementY - this.#offsetY

		// Reverse scale
		x = x / this.#scale
		y = y / this.#scale

		// Reverse rotation
		if (this.#rotation !== 0) {
			const center = this.#getRotationCenter()
			const rotated = rotatePoint({ x, y }, center, -this.#rotation)
			x = rotated.x
			y = rotated.y
		}

		return { x, y }
	}

	/**
	 * Convert page coordinates to client coordinates
	 *
	 * @param pageX - Page X coordinate (PDF points)
	 * @param pageY - Page Y coordinate (PDF points)
	 * @returns Point in client coordinate space (screen pixels)
	 */
	pageToClient(pageX: number, pageY: number): Point {
		let x = pageX
		let y = pageY

		// Apply rotation
		if (this.#rotation !== 0) {
			const center = this.#getRotationCenter()
			const rotated = rotatePoint({ x, y }, center, this.#rotation)
			x = rotated.x
			y = rotated.y
		}

		// Apply scale
		x = x * this.#scale
		y = y * this.#scale

		// Add offsets and element position
		const rect = this.#element?.getBoundingClientRect()
		const elementX = rect?.left ?? 0
		const elementY = rect?.top ?? 0

		x = x + this.#offsetX + elementX
		y = y + this.#offsetY + elementY

		return { x, y }
	}

	/**
	 * Convert a distance in page units to client pixels
	 *
	 * @param distance - Distance in page units
	 * @returns Distance in client pixels
	 */
	pageToClientDistance(distance: number): number {
		return distance * this.#scale
	}

	/**
	 * Convert a distance in client pixels to page units
	 *
	 * @param distance - Distance in client pixels
	 * @returns Distance in page units
	 */
	clientToPageDistance(distance: number): number {
		return distance / this.#scale
	}

	/**
	 * Get the current scale factor
	 */
	getScale(): number {
		return this.#scale
	}

	/**
	 * Get the current rotation
	 */
	getRotation(): PageRotation {
		return this.#rotation
	}

	/**
	 * Get rotation center point
	 */
	#getRotationCenter(): Point {
		// Rotation is around the center of the page
		return {
			x: this.#pageWidth / 2,
			y: this.#pageHeight / 2,
		}
	}
}
