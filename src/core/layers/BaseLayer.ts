/**
 * BaseLayer - Abstract base class for all layers
 * @module core/layers/BaseLayer
 *
 * Provides common functionality for all interactive layers.
 */

import type { LayerInterface } from '../../types.js'

/**
 * BaseLayer - Abstract base class for all layers
 *
 * @remarks
 * Provides common z-index management, pointer-events toggling,
 * and container element creation.
 */
export abstract class BaseLayer implements LayerInterface {
	readonly zIndex: number

	#container: HTMLElement
	#isActive = false

	constructor(parent: HTMLElement, zIndex: number, className: string) {
		this.zIndex = zIndex

		// Create container element
		this.#container = document.createElement('div')
		this.#container.className = className
		this.#container.style.position = 'absolute'
		this.#container.style.left = '0'
		this.#container.style.top = '0'
		this.#container.style.zIndex = String(zIndex)
		this.#container.style.pointerEvents = 'none'

		parent.appendChild(this.#container)
	}

	isActive(): boolean {
		return this.#isActive
	}

	activate(): void {
		if (this.#isActive) return
		this.#isActive = true
		this.#container.style.pointerEvents = 'auto'
		this.onActivate()
	}

	deactivate(): void {
		if (!this.#isActive) return
		this.#isActive = false
		this.#container.style.pointerEvents = 'none'
		this.onDeactivate()
	}

	render(pageNumber: number, scale: number): void {
		this.onRender(pageNumber, scale)
	}

	resize(width: number, height: number): void {
		this.#container.style.width = `${width}px`
		this.#container.style.height = `${height}px`
		this.onResize(width, height)
	}

	destroy(): void {
		this.onDestroy()
		this.#container.remove()
	}

	/**
	 * Get the container element for subclasses
	 */
	protected getContainer(): HTMLElement {
		return this.#container
	}

	/**
	 * Called when the layer needs to render for a page
	 *
	 * @param pageNumber - Page number (1-indexed)
	 * @param scale - Current zoom scale
	 */
	protected abstract onRender(pageNumber: number, scale: number): void

	/**
	 * Called when the layer needs to resize
	 *
	 * @param width - New width in pixels
	 * @param height - New height in pixels
	 */
	protected abstract onResize(width: number, height: number): void

	/**
	 * Called when the layer is activated (receives pointer events)
	 */
	protected abstract onActivate(): void

	/**
	 * Called when the layer is deactivated (no pointer events)
	 */
	protected abstract onDeactivate(): void

	/**
	 * Called when the layer is destroyed
	 */
	protected abstract onDestroy(): void
}
