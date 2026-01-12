/**
 * PdfEditor - Main editor facade
 * @module core/PdfEditor
 *
 * Coordinates document, file manager, and layers.
 * Primary API for interacting with the PDF editor.
 */

import type {
	EditorInterface,
	EditorOptions,
	DocumentState,
	EditorMode,
	PageDimensions,
	PageRotation,
	SearchMatch,
	LoadCallback,
	PageChangeCallback,
	ZoomChangeCallback,
	ModeChangeCallback,
	SaveCallback,
	ErrorCallback,
	Unsubscribe,
	TextLayerInterface,
	DrawingLayerInterface,
	FormLayerInterface,
	AnnotationLayerInterface,
	PdfDocumentInterface,
} from '../types.js'
import {
	DEFAULT_ZOOM,
	MIN_ZOOM,
	MAX_ZOOM,
	ZOOM_STEP,
	CSS_CLASSES,
	ERROR_MESSAGES,
	RESIZE_DEBOUNCE_DELAY,
} from '../constants.js'
import {
	clampZoom,
	clampPageNumber,
	computeFitScale,
	computeFitWidthScale,
	isValidPdfFile,
	debounce,
} from '../helpers.js'
import { FileManager } from './file/FileManager.js'
import { CanvasLayer } from './layers/CanvasLayer.js'
import { DrawingLayer } from './drawing/DrawingLayer.js'
import { TextLayer } from './text/TextLayer.js'
import { FormLayer } from './form/FormLayer.js'
import { AnnotationLayer } from './annotation/AnnotationLayer.js'
import { GestureRecognizer } from './input/GestureRecognizer.js'
import type { GestureEvent, Unsubscribe as GestureUnsubscribe } from '../types.js'

// Dynamic import for PdfDocument to avoid WASM loading at import time
let PdfDocumentClass: (new () => PdfDocumentInterface) | undefined

async function getPdfDocumentClass(): Promise<new () => PdfDocumentInterface> {
	if (!PdfDocumentClass) {
		const module = await import('./document/PdfDocument.js')
		PdfDocumentClass = module.PdfDocument as unknown as new () => PdfDocumentInterface
	}
	return PdfDocumentClass
}

/**
 * PdfEditor - Main PDF editor class
 *
 * @remarks
 * Coordinates all layers, document operations, and state management.
 * This is the primary API for interacting with the PDF editor.
 *
 * @example
 * ```ts
 * const editor = new PdfEditor({
 *   container: document.getElementById('editor'),
 *   onLoad: (fileName, pageCount) => {
 *     console.log(`Loaded ${fileName} with ${pageCount} pages`)
 *   }
 * })
 *
 * await editor.load(pdfFile)
 * editor.setMode('draw')
 * editor.setZoom(1.5)
 * ```
 */
export class PdfEditor implements EditorInterface {
	// Core components
	#container: HTMLElement
	#document: PdfDocumentInterface | undefined
	#documentFactory: (() => PdfDocumentInterface) | undefined
	#fileManager: FileManager
	#canvasLayer: CanvasLayer
	#textLayer: TextLayer | undefined
	#drawingLayer: DrawingLayer | undefined
	#formLayer: FormLayer | undefined
	#annotationLayer: AnnotationLayer | undefined
	#gestureRecognizer: GestureRecognizer
	#gestureUnsubscribe: GestureUnsubscribe | undefined

	// Pan/pinch gesture state
	#isPanActive = false
	#panStartScrollLeft = 0
	#panStartScrollTop = 0
	#isPinchActive = false
	#pinchStartZoom = 1

	// Layer enable flags
	#enableTextLayer: boolean
	#enableDrawingLayer: boolean
	#enableFormLayer: boolean
	#enableAnnotationLayer: boolean

	// State
	#mode: EditorMode
	#zoom: number
	#currentPage = 0
	#hasUnsavedChanges = false
	#fileHandle: FileSystemFileHandle | undefined

	// Event listeners
	#loadListeners = new Set<LoadCallback>()
	#pageChangeListeners = new Set<PageChangeCallback>()
	#zoomChangeListeners = new Set<ZoomChangeCallback>()
	#modeChangeListeners = new Set<ModeChangeCallback>()
	#saveListeners = new Set<SaveCallback>()
	#errorListeners = new Set<ErrorCallback>()

	// Resize observer
	#resizeObserver: ResizeObserver
	#debouncedResize: () => void

	constructor(options: EditorOptions) {
		if (!options.container) {
			throw new Error(ERROR_MESSAGES.NO_CONTAINER)
		}

		this.#container = options.container
		this.#container.classList.add(CSS_CLASSES.CONTAINER)
		this.#container.style.position = 'relative'
		this.#container.style.overflow = 'hidden'

		// Store layer enable flags
		this.#enableTextLayer = options.enableTextLayer ?? true
		this.#enableDrawingLayer = options.enableDrawingLayer ?? true
		this.#enableFormLayer = options.enableFormLayer ?? true
		this.#enableAnnotationLayer = options.enableAnnotationLayer ?? true

		// Initialize core components
		this.#document = options.document
		this.#documentFactory = options.documentFactory
		this.#fileManager = new FileManager()
		this.#canvasLayer = new CanvasLayer(this.#container)

		// Initialize optional layers (in z-order: text, drawing, form, annotation)
		if (this.#enableTextLayer) {
			this.#textLayer = new TextLayer(this.#container)
		}
		if (this.#enableDrawingLayer) {
			this.#drawingLayer = new DrawingLayer(this.#container)
		}
		if (this.#enableFormLayer) {
			this.#formLayer = new FormLayer(this.#container)
		}
		if (this.#enableAnnotationLayer) {
			this.#annotationLayer = new AnnotationLayer(this.#container)
		}

		// Set initial state
		this.#mode = options.initialMode ?? 'pan'
		this.#zoom = clampZoom(options.initialZoom ?? DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM)

		// Register option callbacks
		if (options.onLoad) {
			this.#loadListeners.add(options.onLoad)
		}
		if (options.onPageChange) {
			this.#pageChangeListeners.add(options.onPageChange)
		}
		if (options.onZoomChange) {
			this.#zoomChangeListeners.add(options.onZoomChange)
		}
		if (options.onModeChange) {
			this.#modeChangeListeners.add(options.onModeChange)
		}
		if (options.onSave) {
			this.#saveListeners.add(options.onSave)
		}
		if (options.onError) {
			this.#errorListeners.add(options.onError)
		}

		// Set up resize handling
		this.#debouncedResize = debounce(() => {
			this.#handleResize()
		}, RESIZE_DEBOUNCE_DELAY)

		this.#resizeObserver = new ResizeObserver(() => {
			this.#debouncedResize()
		})
		this.#resizeObserver.observe(this.#container)

		// Set up gesture recognition for pan mode
		this.#gestureRecognizer = new GestureRecognizer()
		this.#gestureRecognizer.attach(this.#container)
		this.#gestureUnsubscribe = this.#gestureRecognizer.onGesture(this.#handleGesture.bind(this))
	}

	// =========================================================================
	// State Accessors
	// =========================================================================

	getState(): DocumentState {
		return {
			isLoaded: this.#document?.isLoaded() ?? false,
			fileName: this.#document?.getFileName(),
			pageCount: this.#document?.getPageCount() ?? 0,
			currentPage: this.#currentPage,
			zoom: this.#zoom,
			mode: this.#mode,
			hasUnsavedChanges: this.#hasUnsavedChanges,
		}
	}

	isLoaded(): boolean {
		return this.#document?.isLoaded() ?? false
	}

	getCurrentPage(): number {
		return this.#currentPage
	}

	getPageCount(): number {
		return this.#document?.getPageCount() ?? 0
	}

	getZoom(): number {
		return this.#zoom
	}

	getMode(): EditorMode {
		return this.#mode
	}

	hasUnsavedChanges(): boolean {
		return this.#hasUnsavedChanges
	}

	getFileName(): string | undefined {
		return this.#document?.getFileName()
	}

	// =========================================================================
	// Mode Control
	// =========================================================================

	setMode(mode: EditorMode): void {
		if (this.#mode === mode) return

		this.#mode = mode
		this.#updateLayersForMode(mode)
		this.#notifyModeChange(mode)
	}

	// =========================================================================
	// Document Operations
	// =========================================================================

	async #ensureDocument(): Promise<PdfDocumentInterface> {
		if (this.#document) {
			return this.#document
		}

		// Use factory if provided
		if (this.#documentFactory) {
			this.#document = this.#documentFactory()
		} else {
			// Dynamically import PdfDocument
			const PdfDocumentClass = await getPdfDocumentClass()
			this.#document = new PdfDocumentClass()
		}

		// Wire up canvas layer
		this.#canvasLayer.setDocument(this.#document)

		return this.#document
	}

	async load(file: File): Promise<void> {
		if (!isValidPdfFile(file)) {
			const error = new Error(ERROR_MESSAGES.INVALID_FILE)
			this.#notifyError(error)
			throw error
		}

		try {
			const doc = await this.#ensureDocument()
			const buffer = await this.#fileManager.loadFile(file)
			await doc.loadFromBuffer(buffer, file.name)
			this.#onDocumentLoaded()
		} catch (error) {
			const err = error instanceof Error ? error : new Error(ERROR_MESSAGES.LOAD_FAILED)
			this.#notifyError(err)
			throw err
		}
	}

	async loadFromBuffer(buffer: ArrayBuffer, fileName?: string): Promise<void> {
		try {
			const doc = await this.#ensureDocument()
			await doc.loadFromBuffer(buffer, fileName)
			this.#onDocumentLoaded()
		} catch (error) {
			const err = error instanceof Error ? error : new Error(ERROR_MESSAGES.LOAD_FAILED)
			this.#notifyError(err)
			throw err
		}
	}

	async loadFromUrl(url: string, fileName?: string): Promise<void> {
		try {
			const doc = await this.#ensureDocument()
			const buffer = await this.#fileManager.loadUrl(url)
			const name = fileName ?? url.split('/').pop() ?? 'document.pdf'
			await doc.loadFromBuffer(buffer, name)
			this.#onDocumentLoaded()
		} catch (error) {
			const err = error instanceof Error ? error : new Error(ERROR_MESSAGES.LOAD_FAILED)
			this.#notifyError(err)
			throw err
		}
	}

	#onDocumentLoaded(): void {
		this.#currentPage = 1
		this.#hasUnsavedChanges = false

		// Set document on all layers
		const doc = this.#document
		if (doc) {
			this.#textLayer?.setDocument(doc)
			this.#drawingLayer?.setDocument(doc)
			this.#formLayer?.setDocument(doc)
			this.#annotationLayer?.setDocument(doc)
		}

		// Set initial mode to activate correct layers
		this.#updateLayersForMode(this.#mode)

		// Render first page
		this.renderPage(1)

		// Notify listeners
		const fileName = this.#document?.getFileName() ?? 'document.pdf'
		const pageCount = this.#document?.getPageCount() ?? 0
		this.#notifyLoad(fileName, pageCount)
		this.#notifyPageChange(1)
	}

	#updateLayersForMode(mode: EditorMode): void {
		// Deactivate all interactive layers first
		this.#textLayer?.deactivate()
		this.#drawingLayer?.deactivate()
		this.#formLayer?.deactivate()
		this.#annotationLayer?.deactivate()

		// Activate the layer corresponding to the mode
		switch (mode) {
			case 'text':
				this.#textLayer?.activate()
				break
			case 'draw':
				this.#drawingLayer?.activate()
				break
			case 'form':
				this.#formLayer?.activate()
				break
			case 'annotate':
				this.#annotationLayer?.activate()
				break
			case 'pan':
			default:
				// All layers deactivated for pan mode
				break
		}
	}

	// =========================================================================
	// Rendering
	// =========================================================================

	renderPage(pageNumber: number): void {
		const doc = this.#document
		if (!doc?.isLoaded()) return

		const clampedPage = clampPageNumber(pageNumber, doc.getPageCount())

		// Render all layers
		this.#canvasLayer.render(clampedPage, this.#zoom)
		this.#textLayer?.render(clampedPage, this.#zoom)
		this.#drawingLayer?.render(clampedPage, this.#zoom)
		this.#formLayer?.render(clampedPage, this.#zoom)
		this.#annotationLayer?.render(clampedPage, this.#zoom)
	}

	getPageDimensions(pageNumber: number): PageDimensions {
		const doc = this.#document
		if (!doc?.isLoaded()) {
			return { width: 0, height: 0 }
		}
		return doc.getPageDimensions(pageNumber)
	}

	// =========================================================================
	// Navigation
	// =========================================================================

	goToPage(pageNumber: number): void {
		const doc = this.#document
		if (!doc?.isLoaded()) return

		const clampedPage = clampPageNumber(pageNumber, doc.getPageCount())
		if (clampedPage === this.#currentPage) return

		this.#currentPage = clampedPage
		this.renderPage(clampedPage)
		this.#notifyPageChange(clampedPage)
	}

	goToPreviousPage(): void {
		this.goToPage(this.#currentPage - 1)
	}

	goToNextPage(): void {
		this.goToPage(this.#currentPage + 1)
	}

	// =========================================================================
	// Zoom
	// =========================================================================

	setZoom(zoom: number): void {
		const clampedZoom = clampZoom(zoom, MIN_ZOOM, MAX_ZOOM)
		if (clampedZoom === this.#zoom) return

		this.#zoom = clampedZoom
		this.renderPage(this.#currentPage)
		this.#notifyZoomChange(clampedZoom)
	}

	zoomIn(): void {
		this.setZoom(this.#zoom + ZOOM_STEP)
	}

	zoomOut(): void {
		this.setZoom(this.#zoom - ZOOM_STEP)
	}

	resetZoom(): void {
		this.setZoom(DEFAULT_ZOOM)
	}

	fitToWidth(): void {
		if (!this.#document?.isLoaded()) return

		const dims = this.getPageDimensions(this.#currentPage)
		const containerWidth = this.#container.clientWidth
		const scale = computeFitWidthScale(dims.width, containerWidth)
		this.setZoom(scale)
	}

	fitToPage(): void {
		if (!this.#document?.isLoaded()) return

		const dims = this.getPageDimensions(this.#currentPage)
		const containerWidth = this.#container.clientWidth
		const containerHeight = this.#container.clientHeight
		const scale = computeFitScale(dims.width, dims.height, containerWidth, containerHeight)
		this.setZoom(scale)
	}

	// =========================================================================
	// Page Management
	// =========================================================================

	addBlankPage(_afterPage?: number, _width?: number, _height?: number): number {
		// TODO: Implement in Phase 6
		throw new Error('Not implemented')
	}

	deletePage(_pageNumber: number): void {
		// TODO: Implement in Phase 6
		throw new Error('Not implemented')
	}

	rotatePage(_pageNumber: number, _rotation: PageRotation): void {
		// TODO: Implement in Phase 6
		throw new Error('Not implemented')
	}

	getPageRotation(pageNumber: number): PageRotation {
		const doc = this.#document
		if (!doc?.isLoaded()) return 0
		return doc.getPageRotation(pageNumber)
	}

	movePage(_fromPage: number, _toPage: number): void {
		// TODO: Implement in Phase 6
		throw new Error('Not implemented')
	}

	// =========================================================================
	// Save/Export
	// =========================================================================

	async save(): Promise<void> {
		if (!this.#document?.isLoaded()) {
			throw new Error(ERROR_MESSAGES.NO_DOCUMENT)
		}

		try {
			const data = this.toArrayBuffer()
			const handle = await this.#fileManager.save(data, this.#fileHandle)
			if (handle) {
				this.#fileHandle = handle
				this.#hasUnsavedChanges = false
				this.#notifySave(true)
			} else {
				// No file handle, fall through to saveAs
				await this.saveAs()
			}
		} catch (error) {
			this.#notifySave(false)
			const err = error instanceof Error ? error : new Error(ERROR_MESSAGES.SAVE_FAILED)
			this.#notifyError(err)
			throw err
		}
	}

	async saveAs(): Promise<void> {
		const doc = this.#document
		if (!doc?.isLoaded()) {
			throw new Error(ERROR_MESSAGES.NO_DOCUMENT)
		}

		try {
			const data = this.toArrayBuffer()
			const fileName = doc.getFileName() ?? 'document.pdf'
			const handle = await this.#fileManager.saveAs(data, fileName)
			if (handle) {
				this.#fileHandle = handle
			}
			this.#hasUnsavedChanges = false
			this.#notifySave(true)
		} catch (error) {
			this.#notifySave(false)
			const err = error instanceof Error ? error : new Error(ERROR_MESSAGES.SAVE_FAILED)
			this.#notifyError(err)
			throw err
		}
	}

	download(fileName?: string): void {
		const doc = this.#document
		if (!doc?.isLoaded()) {
			throw new Error(ERROR_MESSAGES.NO_DOCUMENT)
		}

		const data = this.toArrayBuffer()
		const name = fileName ?? doc.getFileName() ?? 'document.pdf'
		this.#fileManager.download(data, name)
	}

	toArrayBuffer(): ArrayBuffer {
		const doc = this.#document
		if (!doc?.isLoaded()) {
			throw new Error(ERROR_MESSAGES.NO_DOCUMENT)
		}
		return doc.toArrayBuffer()
	}

	// =========================================================================
	// Layer Access
	// =========================================================================

	getTextLayer(): TextLayerInterface | undefined {
		return this.#textLayer
	}

	getDrawingLayer(): DrawingLayerInterface | undefined {
		return this.#drawingLayer
	}

	getFormLayer(): FormLayerInterface | undefined {
		return this.#formLayer
	}

	getAnnotationLayer(): AnnotationLayerInterface | undefined {
		return this.#annotationLayer
	}

	// =========================================================================
	// Text Operations
	// =========================================================================

	getPageText(pageNumber: number): string {
		const doc = this.#document
		if (!doc?.isLoaded()) return ''
		const page = doc.getPage(pageNumber)
		return page.getText()
	}

	searchText(_query: string): readonly SearchMatch[] {
		// TODO: Implement in Phase 4
		return []
	}

	// =========================================================================
	// Form Operations
	// =========================================================================

	hasFormFields(): boolean {
		// TODO: Implement in Phase 6
		return false
	}

	// =========================================================================
	// Event Subscriptions
	// =========================================================================

	onLoad(callback: LoadCallback): Unsubscribe {
		this.#loadListeners.add(callback)
		return () => this.#loadListeners.delete(callback)
	}

	onPageChange(callback: PageChangeCallback): Unsubscribe {
		this.#pageChangeListeners.add(callback)
		return () => this.#pageChangeListeners.delete(callback)
	}

	onZoomChange(callback: ZoomChangeCallback): Unsubscribe {
		this.#zoomChangeListeners.add(callback)
		return () => this.#zoomChangeListeners.delete(callback)
	}

	onModeChange(callback: ModeChangeCallback): Unsubscribe {
		this.#modeChangeListeners.add(callback)
		return () => this.#modeChangeListeners.delete(callback)
	}

	onSave(callback: SaveCallback): Unsubscribe {
		this.#saveListeners.add(callback)
		return () => this.#saveListeners.delete(callback)
	}

	onError(callback: ErrorCallback): Unsubscribe {
		this.#errorListeners.add(callback)
		return () => this.#errorListeners.delete(callback)
	}

	// =========================================================================
	// Private Event Notification
	// =========================================================================

	#notifyLoad(fileName: string, pageCount: number): void {
		for (const listener of this.#loadListeners) {
			listener(fileName, pageCount)
		}
	}

	#notifyPageChange(pageNumber: number): void {
		for (const listener of this.#pageChangeListeners) {
			listener(pageNumber)
		}
	}

	#notifyZoomChange(zoom: number): void {
		for (const listener of this.#zoomChangeListeners) {
			listener(zoom)
		}
	}

	#notifyModeChange(mode: EditorMode): void {
		for (const listener of this.#modeChangeListeners) {
			listener(mode)
		}
	}

	#notifySave(success: boolean): void {
		for (const listener of this.#saveListeners) {
			listener(success)
		}
	}

	#notifyError(error: Error): void {
		for (const listener of this.#errorListeners) {
			listener(error)
		}
	}

	// =========================================================================
	// Private Helpers
	// =========================================================================

	#handleResize(): void {
		if (this.#document?.isLoaded() && this.#currentPage > 0) {
			const { width, height } = this.#container.getBoundingClientRect()
			this.#canvasLayer.resize(width, height)
		}
	}

	#handleGesture(event: GestureEvent): void {
		// Only handle gestures in pan mode
		if (this.#mode !== 'pan') return
		if (!this.#document?.isLoaded()) return

		switch (event.type) {
			case 'pan':
				this.#handlePanGesture(event)
				break
			case 'twofingerpan':
				this.#handleTwoFingerPan(event)
				break
			case 'pinch':
				this.#handlePinchGesture(event)
				break
			case 'doubletap':
				this.#handleDoubleTap(event)
				break
			case 'tap':
				// Single tap - no action in pan mode
				break
			case 'longpress':
				// Long press - could be used for context menu in future
				break
		}
	}

	#handlePanGesture(event: GestureEvent): void {
		// Pan (scroll) the viewer container
		const parent = this.#container.parentElement
		if (!parent) return

		if (!event.isFinal && event.deltaX !== undefined && event.deltaY !== undefined) {
			// Start of pan - store initial scroll position
			if (!this.#isPanActive) {
				this.#isPanActive = true
				this.#panStartScrollLeft = parent.scrollLeft
				this.#panStartScrollTop = parent.scrollTop
			}

			// Apply delta to scroll position
			parent.scrollLeft = this.#panStartScrollLeft - event.deltaX
			parent.scrollTop = this.#panStartScrollTop - event.deltaY
		}

		if (event.isFinal) {
			// Reset pan state
			this.#isPanActive = false
			this.#panStartScrollLeft = 0
			this.#panStartScrollTop = 0
		}
	}

	#handleTwoFingerPan(event: GestureEvent): void {
		// Two-finger pan works same as single-finger pan
		this.#handlePanGesture(event)
	}

	#handlePinchGesture(event: GestureEvent): void {
		if (event.scale === undefined) return

		if (!event.isFinal) {
			// Start of pinch - store initial zoom
			if (!this.#isPinchActive) {
				this.#isPinchActive = true
				this.#pinchStartZoom = this.#zoom
			}

			// Apply scale to zoom
			const newZoom = clampZoom(this.#pinchStartZoom * event.scale, MIN_ZOOM, MAX_ZOOM)
			if (newZoom !== this.#zoom) {
				this.#zoom = newZoom
				this.renderPage(this.#currentPage)
				this.#notifyZoomChange(newZoom)
			}
		}

		if (event.isFinal) {
			// Reset pinch state
			this.#isPinchActive = false
			this.#pinchStartZoom = this.#zoom
		}
	}

	#handleDoubleTap(_event: GestureEvent): void {
		// Double-tap to toggle between 100% and fit-to-width
		if (this.#zoom === DEFAULT_ZOOM) {
			this.fitToWidth()
		} else {
			this.resetZoom()
		}
	}

	// =========================================================================
	// Lifecycle
	// =========================================================================

	destroy(): void {
		this.#resizeObserver.disconnect()
		this.#gestureUnsubscribe?.()
		this.#gestureRecognizer.destroy()

		// Destroy all layers
		this.#canvasLayer.destroy()
		this.#textLayer?.destroy()
		this.#drawingLayer?.destroy()
		this.#formLayer?.destroy()
		this.#annotationLayer?.destroy()

		this.#document?.destroy()

		this.#loadListeners.clear()
		this.#pageChangeListeners.clear()
		this.#zoomChangeListeners.clear()
		this.#modeChangeListeners.clear()
		this.#saveListeners.clear()
		this.#errorListeners.clear()
	}
}
