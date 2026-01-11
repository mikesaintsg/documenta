/**
 * LayerStack - Layer coordinator
 * @module core/layers/LayerStack
 *
 * Manages layer registration, z-index ordering, and mode switching.
 */

import type {
	LayerStackInterface,
	LayerInterface,
	LayerName,
	EditorMode,
	ModeChangeCallback,
	Unsubscribe,
} from '../../types.js'

/**
 * Mode to layer mapping
 *
 * @remarks
 * Maps each editor mode to the layer that should be active.
 * 'pan' mode has no active layer.
 */
const MODE_TO_LAYER: Record<EditorMode, LayerName | undefined> = {
	pan: undefined,
	text: 'text',
	draw: 'drawing',
	form: 'form',
	annotate: 'annotation',
}

/**
 * LayerStack - Coordinates all interactive layers
 *
 * @remarks
 * - Manages layer registration and ordering by z-index
 * - Routes pointer events based on mode
 * - Switches active layer when mode changes
 * - Coordinates render calls across layers
 */
export class LayerStack implements LayerStackInterface {
	#layers = new Map<LayerName, LayerInterface>()
	#mode: EditorMode = 'pan'
	#modeChangeListeners = new Set<ModeChangeCallback>()

	registerLayer(name: LayerName, layer: LayerInterface): void {
		// Unregister existing layer with same name
		if (this.#layers.has(name)) {
			this.unregisterLayer(name)
		}

		this.#layers.set(name, layer)

		// Deactivate by default
		layer.deactivate()

		// If this layer should be active for current mode, activate it
		if (MODE_TO_LAYER[this.#mode] === name) {
			layer.activate()
		}
	}

	unregisterLayer(name: LayerName): void {
		const layer = this.#layers.get(name)
		if (layer) {
			layer.deactivate()
			this.#layers.delete(name)
		}
	}

	getLayer<T extends LayerInterface>(name: LayerName): T | undefined {
		return this.#layers.get(name) as T | undefined
	}

	setMode(mode: EditorMode): void {
		if (this.#mode === mode) return

		const previousLayerName = MODE_TO_LAYER[this.#mode]
		const newLayerName = MODE_TO_LAYER[mode]

		// Deactivate previous layer
		if (previousLayerName) {
			const previousLayer = this.#layers.get(previousLayerName)
			if (previousLayer) {
				previousLayer.deactivate()
			}
		}

		// Activate new layer
		if (newLayerName) {
			const newLayer = this.#layers.get(newLayerName)
			if (newLayer) {
				newLayer.activate()
			}
		}

		this.#mode = mode
		this.#notifyModeChange(mode)
	}

	getMode(): EditorMode {
		return this.#mode
	}

	onModeChange(callback: ModeChangeCallback): Unsubscribe {
		this.#modeChangeListeners.add(callback)
		return () => this.#modeChangeListeners.delete(callback)
	}

	render(pageNumber: number, scale: number): void {
		// Get layers sorted by z-index
		const sortedLayers = Array.from(this.#layers.values())
			.sort((a, b) => a.zIndex - b.zIndex)

		// Render all layers in order
		for (const layer of sortedLayers) {
			layer.render(pageNumber, scale)
		}
	}

	resize(width: number, height: number): void {
		for (const layer of this.#layers.values()) {
			layer.resize(width, height)
		}
	}

	destroy(): void {
		for (const layer of this.#layers.values()) {
			layer.destroy()
		}
		this.#layers.clear()
		this.#modeChangeListeners.clear()
	}

	#notifyModeChange(mode: EditorMode): void {
		for (const listener of this.#modeChangeListeners) {
			listener(mode)
		}
	}
}
