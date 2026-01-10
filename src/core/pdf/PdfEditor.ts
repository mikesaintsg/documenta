/**
 * Documenta - PDF Editor Core Implementation
 * @module core/pdf/PdfEditor
 */

import * as mupdf from 'mupdf'
import type {
	AnyAnnotation,
	AnyCreateAnnotationData,
	Annotation,
	AnnotationAddCallback,
	AnnotationRemoveCallback,
	ErrorCallback,
	LoadCallback,
	PageChangeCallback,
	PageDimensions,
	PdfDocumentState,
	PdfEditorInterface,
	PdfEditorOptions,
	SaveCallback,
	Unsubscribe,
	ZoomChangeCallback,
} from '../../types.js'
import {
	clampPageNumber,
	clampZoom,
	colorToMupdfArray,
	computeFitScale,
	computeFitWidthScale,
	downloadBlob,
	generateAnnotationId,
	hasFileSystemAccess,
	isNonEmptyArrayBuffer,
	isValidPdfFile,
	mupdfRectToRectangle,
	readFileAsArrayBuffer,
	rectangleToMupdfRect,
} from '../../helpers.js'
import {
	DEFAULT_ANNOTATION_OPACITY,
	DEFAULT_FREETEXT_FONT_COLOR,
	DEFAULT_FREETEXT_FONT_SIZE,
	DEFAULT_HIGHLIGHT_COLOR,
	DEFAULT_HIGHLIGHT_OPACITY,
	DEFAULT_INK_COLOR,
	DEFAULT_INK_STROKE_WIDTH,
	DEFAULT_SHAPE_COLOR,
	DEFAULT_SHAPE_STROKE_WIDTH,
	DEFAULT_TEXT_ANNOTATION_COLOR,
	DEFAULT_ZOOM,
	MAX_ZOOM,
	MIN_ZOOM,
	PDF_EXTENSION,
	PDF_FILE_PICKER_ACCEPT,
	PDF_MIME_TYPE,
	ZOOM_STEP,
} from '../../constants.js'

type ListenerMap<T> = Set<T>

/**
 * PDF Editor implementation using mupdf
 */
export class PdfEditor implements PdfEditorInterface {
	#container: HTMLElement
	#document: mupdf.PDFDocument | null = null
	#fileHandle: FileSystemFileHandle | null = null
	#fileName: string | undefined = undefined
	#currentPage: number = 1
	#zoom: number = DEFAULT_ZOOM
	#hasUnsavedChanges = false
	#defaultAuthor: string

	// Annotation tracking
	#annotations: Map<string, AnyAnnotation> = new Map()
	#annotationsByPage: Map<number, Set<string>> = new Map()

	// Event listeners
	#loadListeners: ListenerMap<LoadCallback> = new Set()
	#pageChangeListeners: ListenerMap<PageChangeCallback> = new Set()
	#zoomChangeListeners: ListenerMap<ZoomChangeCallback> = new Set()
	#annotationAddListeners: ListenerMap<AnnotationAddCallback> = new Set()
	#annotationRemoveListeners: ListenerMap<AnnotationRemoveCallback> = new Set()
	#saveListeners: ListenerMap<SaveCallback> = new Set()
	#errorListeners: ListenerMap<ErrorCallback> = new Set()

	constructor(options: PdfEditorOptions) {
		this.#container = options.container
		this.#defaultAuthor = options.defaultAuthor ?? ''

		if (options.initialZoom !== undefined) {
			this.#zoom = clampZoom(options.initialZoom, MIN_ZOOM, MAX_ZOOM)
		}

		// Register initial hooks from options
		if (options.onLoad) {
			this.#loadListeners.add(options.onLoad)
		}
		if (options.onPageChange) {
			this.#pageChangeListeners.add(options.onPageChange)
		}
		if (options.onZoomChange) {
			this.#zoomChangeListeners.add(options.onZoomChange)
		}
		if (options.onAnnotationAdd) {
			this.#annotationAddListeners.add(options.onAnnotationAdd)
		}
		if (options.onAnnotationRemove) {
			this.#annotationRemoveListeners.add(options.onAnnotationRemove)
		}
		if (options.onSave) {
			this.#saveListeners.add(options.onSave)
		}
		if (options.onError) {
			this.#errorListeners.add(options.onError)
		}
	}

	// =========================================================================
	// Property Accessors
	// =========================================================================

	getState(): PdfDocumentState {
		return {
			isLoaded: this.#document !== null,
			fileName: this.#fileName,
			pageCount: this.getPageCount(),
			currentPage: this.#currentPage,
			zoom: this.#zoom,
			hasUnsavedChanges: this.#hasUnsavedChanges,
		}
	}

	isLoaded(): boolean {
		return this.#document !== null
	}

	getCurrentPage(): number {
		return this.#currentPage
	}

	getPageCount(): number {
		if (!this.#document) return 0
		return this.#document.countPages()
	}

	getZoom(): number {
		return this.#zoom
	}

	hasUnsavedChanges(): boolean {
		return this.#hasUnsavedChanges
	}

	getFileName(): string | undefined {
		return this.#fileName
	}

	getAnnotations(pageNumber: number): readonly AnyAnnotation[] {
		const pageAnnotIds = this.#annotationsByPage.get(pageNumber)
		if (!pageAnnotIds) return []

		const result: AnyAnnotation[] = []
		for (const id of pageAnnotIds) {
			const annot = this.#annotations.get(id)
			if (annot) {
				result.push(annot)
			}
		}
		return result
	}

	getAnnotationById(id: string): AnyAnnotation | undefined {
		return this.#annotations.get(id)
	}

	// =========================================================================
	// Property Mutators
	// =========================================================================

	setZoom(zoom: number): void {
		const clampedZoom = clampZoom(zoom, MIN_ZOOM, MAX_ZOOM)
		if (clampedZoom !== this.#zoom) {
			this.#zoom = clampedZoom
			this.#emitZoomChange(clampedZoom)
		}
	}

	// =========================================================================
	// Document Operations
	// =========================================================================

	async load(file: File): Promise<void> {
		if (!isValidPdfFile(file)) {
			this.#emitError(new Error('Invalid PDF file'))
			return
		}

		try {
			const buffer = await readFileAsArrayBuffer(file)
			await this.loadFromBuffer(buffer, file.name)
		} catch (error) {
			this.#emitError(error instanceof Error ? error : new Error(String(error)))
		}
	}

	async loadFromBuffer(buffer: ArrayBuffer, fileName?: string): Promise<void> {
		if (!isNonEmptyArrayBuffer(buffer)) {
			this.#emitError(new Error('Empty buffer provided'))
			return
		}

		try {
			// Close existing document if any
			if (this.#document) {
				this.#document.destroy()
				this.#document = null
			}

			// Clear annotation tracking
			this.#annotations.clear()
			this.#annotationsByPage.clear()

			// Open the document
			const doc = mupdf.Document.openDocument(buffer, PDF_MIME_TYPE)
			const pdfDoc = doc.asPDF()
			if (!pdfDoc) {
				throw new Error('Could not open as PDF document')
			}

			this.#document = pdfDoc
			this.#fileName = fileName ?? 'document.pdf'
			this.#currentPage = 1
			this.#hasUnsavedChanges = false
			this.#fileHandle = null

			// Load existing annotations
			this.#loadExistingAnnotations()

			const pageCount = this.getPageCount()
			this.#emitLoad(this.#fileName, pageCount)
		} catch (error) {
			this.#emitError(error instanceof Error ? error : new Error(String(error)))
		}
	}

	renderPage(pageNumber: number, canvas: HTMLCanvasElement): void {
		if (!this.#document) {
			this.#emitError(new Error('No document loaded'))
			return
		}

		const pageCount = this.getPageCount()
		const clampedPage = clampPageNumber(pageNumber, pageCount)

		try {
			const page = this.#document.loadPage(clampedPage - 1)

			const scale = this.#zoom * window.devicePixelRatio
			const matrix = mupdf.Matrix.scale(scale, scale)

			const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, true, true)
			const width = pixmap.getWidth()
			const height = pixmap.getHeight()

			canvas.width = width
			canvas.height = height
			canvas.style.width = `${Math.round(width / window.devicePixelRatio)}px`
			canvas.style.height = `${Math.round(height / window.devicePixelRatio)}px`

			const ctx = canvas.getContext('2d')
			if (!ctx) {
				throw new Error('Could not get canvas 2D context')
			}

			const pixels = pixmap.getPixels()
			// Create a new ArrayBuffer to avoid SharedArrayBuffer issues
			const pixelBuffer = new ArrayBuffer(pixels.byteLength)
			new Uint8Array(pixelBuffer).set(new Uint8Array(pixels.buffer, pixels.byteOffset, pixels.byteLength))
			const imageData = new ImageData(
				new Uint8ClampedArray(pixelBuffer),
				width,
				height,
			)

			ctx.putImageData(imageData, 0, 0)

			// Cleanup
			pixmap.destroy()
			page.destroy()
		} catch (error) {
			this.#emitError(error instanceof Error ? error : new Error(String(error)))
		}
	}

	getPageDimensions(pageNumber: number): PageDimensions {
		if (!this.#document) {
			return { width: 0, height: 0 }
		}

		const pageCount = this.getPageCount()
		const clampedPage = clampPageNumber(pageNumber, pageCount)

		try {
			const page = this.#document.loadPage(clampedPage - 1)
			const bounds = page.getBounds()
			const width = bounds[2] - bounds[0]
			const height = bounds[3] - bounds[1]
			page.destroy()

			return {
				width: Math.round(width * this.#zoom),
				height: Math.round(height * this.#zoom),
			}
		} catch {
			return { width: 0, height: 0 }
		}
	}

	// =========================================================================
	// Navigation
	// =========================================================================

	goToPage(pageNumber: number): void {
		if (!this.#document) return

		const pageCount = this.getPageCount()
		const clampedPage = clampPageNumber(pageNumber, pageCount)

		if (clampedPage !== this.#currentPage) {
			this.#currentPage = clampedPage
			this.#emitPageChange(clampedPage)
		}
	}

	goToPreviousPage(): void {
		this.goToPage(this.#currentPage - 1)
	}

	goToNextPage(): void {
		this.goToPage(this.#currentPage + 1)
	}

	// =========================================================================
	// Zoom Controls
	// =========================================================================

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
		if (!this.#document) return

		const dims = this.getPageDimensions(this.#currentPage)
		if (dims.width === 0) return

		const containerWidth = this.#container.clientWidth
		const currentPageWidth = dims.width / this.#zoom

		const newZoom = computeFitWidthScale(currentPageWidth, containerWidth)
		this.setZoom(newZoom)
	}

	fitToPage(): void {
		if (!this.#document) return

		const dims = this.getPageDimensions(this.#currentPage)
		if (dims.width === 0 || dims.height === 0) return

		const containerWidth = this.#container.clientWidth
		const containerHeight = this.#container.clientHeight
		const currentPageWidth = dims.width / this.#zoom
		const currentPageHeight = dims.height / this.#zoom

		const newZoom = computeFitScale(
			currentPageWidth,
			currentPageHeight,
			containerWidth,
			containerHeight,
		)
		this.setZoom(newZoom)
	}

	// =========================================================================
	// Annotation Management
	// =========================================================================

	addAnnotation(data: AnyCreateAnnotationData): AnyAnnotation {
		if (!this.#document) {
			throw new Error('No document loaded')
		}

		const pageCount = this.getPageCount()
		const clampedPage = clampPageNumber(data.pageNumber, pageCount)

		try {
			const page = this.#document.loadPage(clampedPage - 1)
			const mupdfAnnot = page.createAnnotation(data.type)

			// Set common properties
			const rect = rectangleToMupdfRect(data.bounds)
			mupdfAnnot.setRect(rect)

			const color = data.color ?? this.#getDefaultColor(data.type)
			mupdfAnnot.setColor(colorToMupdfArray(color))

			const opacity = data.opacity ?? this.#getDefaultOpacity(data.type)
			mupdfAnnot.setOpacity(opacity)

			if (data.contents) {
				mupdfAnnot.setContents(data.contents)
			}

			const author = data.author ?? this.#defaultAuthor
			if (author) {
				mupdfAnnot.setAuthor(author)
			}

			const now = new Date()
			mupdfAnnot.setCreationDate(now)
			mupdfAnnot.setModificationDate(now)

			// Handle type-specific properties
			this.#setTypeSpecificProperties(mupdfAnnot, data)

			// Update the annotation
			mupdfAnnot.update()

			// Create tracked annotation
			const id = generateAnnotationId()
			const annotation = this.#createAnnotationFromMupdf(id, clampedPage, mupdfAnnot, data)

			// Track the annotation
			this.#annotations.set(id, annotation)
			let pageSet = this.#annotationsByPage.get(clampedPage)
			if (!pageSet) {
				pageSet = new Set()
				this.#annotationsByPage.set(clampedPage, pageSet)
			}
			pageSet.add(id)

			this.#hasUnsavedChanges = true
			this.#emitAnnotationAdd(annotation)

			page.destroy()
			return annotation
		} catch (error) {
			throw error instanceof Error ? error : new Error(String(error))
		}
	}

	updateAnnotation(id: string, updates: Partial<Annotation>): void {
		const annotation = this.#annotations.get(id)
		if (!annotation || !this.#document) return

		// For now, we just update our tracked annotation
		// A full implementation would update the mupdf annotation as well
		const updated = { ...annotation, ...updates, modifiedAt: new Date() } as AnyAnnotation
		this.#annotations.set(id, updated)
		this.#hasUnsavedChanges = true
	}

	removeAnnotation(id: string): void {
		const annotation = this.#annotations.get(id)
		if (!annotation || !this.#document) return

		try {
			// Remove from mupdf document
			const page = this.#document.loadPage(annotation.pageNumber - 1)
			const mupdfAnnots = page.getAnnotations()

			// Find and delete the matching annotation
			for (const mupdfAnnot of mupdfAnnots) {
				const bounds = mupdfAnnot.getBounds()
				const rect = mupdfRectToRectangle(bounds)

				// Match by bounds (simple matching for now)
				if (
					Math.abs(rect.x - annotation.bounds.x) < 1 &&
					Math.abs(rect.y - annotation.bounds.y) < 1
				) {
					page.deleteAnnotation(mupdfAnnot)
					break
				}
			}

			page.destroy()

			// Remove from tracking
			this.#annotations.delete(id)
			const pageSet = this.#annotationsByPage.get(annotation.pageNumber)
			if (pageSet) {
				pageSet.delete(id)
			}

			this.#hasUnsavedChanges = true
			this.#emitAnnotationRemove(id)
		} catch (error) {
			this.#emitError(error instanceof Error ? error : new Error(String(error)))
		}
	}

	// =========================================================================
	// Save Operations
	// =========================================================================

	async save(): Promise<void> {
		if (!this.#document) {
			this.#emitError(new Error('No document loaded'))
			return
		}

		try {
			if (hasFileSystemAccess() && this.#fileHandle) {
				// Use existing file handle
				const buffer = this.#document.saveToBuffer()
				const data = buffer.asUint8Array()
				const arrayBuffer = new ArrayBuffer(data.length)
				new Uint8Array(arrayBuffer).set(data)
				const writable = await this.#fileHandle.createWritable()
				await writable.write(arrayBuffer)
				await writable.close()
				buffer.destroy()

				this.#hasUnsavedChanges = false
				this.#emitSave(true)
			} else {
				// Fall back to saveAs
				await this.saveAs()
			}
		} catch (error) {
			this.#emitError(error instanceof Error ? error : new Error(String(error)))
			this.#emitSave(false)
		}
	}

	async saveAs(): Promise<void> {
		if (!this.#document) {
			this.#emitError(new Error('No document loaded'))
			return
		}

		try {
			if (hasFileSystemAccess()) {
				// Use File System Access API
				const handle = await (window as { showSaveFilePicker?: (options: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker?.({
					suggestedName: this.#fileName ?? 'document.pdf',
					types: [PDF_FILE_PICKER_ACCEPT],
				})

				if (handle) {
					const buffer = this.#document.saveToBuffer()
					const data = buffer.asUint8Array()
					const arrayBuffer = new ArrayBuffer(data.length)
					new Uint8Array(arrayBuffer).set(data)
					const writable = await handle.createWritable()
					await writable.write(arrayBuffer)
					await writable.close()
					buffer.destroy()

					this.#fileHandle = handle
					this.#fileName = handle.name
					this.#hasUnsavedChanges = false
					this.#emitSave(true)
				}
			} else {
				// Fall back to download
				this.download()
			}
		} catch (error) {
			// User cancelled is not an error
			if (error instanceof Error && error.name === 'AbortError') {
				return
			}
			this.#emitError(error instanceof Error ? error : new Error(String(error)))
			this.#emitSave(false)
		}
	}

	download(fileName?: string): void {
		if (!this.#document) {
			this.#emitError(new Error('No document loaded'))
			return
		}

		try {
			const buffer = this.#document.saveToBuffer()
			const data = buffer.asUint8Array()
			const name = fileName ?? this.#fileName ?? 'document.pdf'

			downloadBlob(data, name.endsWith(PDF_EXTENSION) ? name : name + PDF_EXTENSION, PDF_MIME_TYPE)
			buffer.destroy()

			this.#hasUnsavedChanges = false
			this.#emitSave(true)
		} catch (error) {
			this.#emitError(error instanceof Error ? error : new Error(String(error)))
			this.#emitSave(false)
		}
	}

	toArrayBuffer(): ArrayBuffer {
		if (!this.#document) {
			throw new Error('No document loaded')
		}

		const buffer = this.#document.saveToBuffer()
		const data = buffer.asUint8Array()
		const result = new ArrayBuffer(data.length)
		new Uint8Array(result).set(data)
		buffer.destroy()

		return result
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

	onAnnotationAdd(callback: AnnotationAddCallback): Unsubscribe {
		this.#annotationAddListeners.add(callback)
		return () => this.#annotationAddListeners.delete(callback)
	}

	onAnnotationRemove(callback: AnnotationRemoveCallback): Unsubscribe {
		this.#annotationRemoveListeners.add(callback)
		return () => this.#annotationRemoveListeners.delete(callback)
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
	// Lifecycle
	// =========================================================================

	destroy(): void {
		if (this.#document) {
			this.#document.destroy()
			this.#document = null
		}

		this.#annotations.clear()
		this.#annotationsByPage.clear()
		this.#loadListeners.clear()
		this.#pageChangeListeners.clear()
		this.#zoomChangeListeners.clear()
		this.#annotationAddListeners.clear()
		this.#annotationRemoveListeners.clear()
		this.#saveListeners.clear()
		this.#errorListeners.clear()

		this.#fileHandle = null
		this.#fileName = undefined
		this.#currentPage = 1
		this.#zoom = DEFAULT_ZOOM
		this.#hasUnsavedChanges = false
	}

	// =========================================================================
	// Private Helpers
	// =========================================================================

	#loadExistingAnnotations(): void {
		if (!this.#document) return

		const pageCount = this.getPageCount()
		for (let i = 0; i < pageCount; i++) {
			const page = this.#document.loadPage(i)
			const annotations = page.getAnnotations()

			for (const mupdfAnnot of annotations) {
				const id = generateAnnotationId()
				const type = mupdfAnnot.getType()

				// Only track supported annotation types
				if (this.#isSupportedAnnotationType(type)) {
					const annotation = this.#createAnnotationFromExisting(id, i + 1, mupdfAnnot)
					if (annotation) {
						this.#annotations.set(id, annotation)
						let pageSet = this.#annotationsByPage.get(i + 1)
						if (!pageSet) {
							pageSet = new Set()
							this.#annotationsByPage.set(i + 1, pageSet)
						}
						pageSet.add(id)
					}
				}
			}

			page.destroy()
		}
	}

	#isSupportedAnnotationType(type: string): boolean {
		const supported = ['Text', 'FreeText', 'Highlight', 'Underline', 'StrikeOut', 'Ink', 'Square', 'Circle']
		return supported.includes(type)
	}

	#createAnnotationFromExisting(
		id: string,
		pageNumber: number,
		mupdfAnnot: mupdf.PDFAnnotation,
	): AnyAnnotation | undefined {
		const type = mupdfAnnot.getType()
		const bounds = mupdfRectToRectangle(mupdfAnnot.getBounds())
		const colorArray = mupdfAnnot.getColor()
		const color = colorArray.length >= 3
			? { r: colorArray[0] ?? 0, g: colorArray[1] ?? 0, b: colorArray[2] ?? 0 }
			: DEFAULT_TEXT_ANNOTATION_COLOR
		const opacity = mupdfAnnot.getOpacity()
		const contents = mupdfAnnot.getContents()
		const author = mupdfAnnot.getAuthor()
		const createdAt = mupdfAnnot.getCreationDate()
		const modifiedAt = mupdfAnnot.getModificationDate()

		const base = {
			id,
			pageNumber,
			bounds,
			color,
			opacity,
			contents,
			author,
			createdAt,
			modifiedAt,
		}

		switch (type) {
			case 'Text':
				return {
					...base,
					type: 'Text',
					isOpen: mupdfAnnot.getIsOpen(),
				}
			case 'FreeText':
				return {
					...base,
					type: 'FreeText',
					fontSize: DEFAULT_FREETEXT_FONT_SIZE,
					fontColor: DEFAULT_FREETEXT_FONT_COLOR,
				}
			case 'Highlight':
			case 'Underline':
			case 'StrikeOut':
				return {
					...base,
					type: 'Highlight',
					quadPoints: [],
				}
			case 'Ink':
				return {
					...base,
					type: 'Ink',
					inkList: [],
					strokeWidth: DEFAULT_INK_STROKE_WIDTH,
				}
			case 'Square':
			case 'Circle':
				return {
					...base,
					type: type as 'Square' | 'Circle',
					strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH,
					fillColor: undefined,
				}
			default:
				return undefined
		}
	}

	#createAnnotationFromMupdf(
		id: string,
		pageNumber: number,
		mupdfAnnot: mupdf.PDFAnnotation,
		data: AnyCreateAnnotationData,
	): AnyAnnotation {
		const bounds = mupdfRectToRectangle(mupdfAnnot.getBounds())
		const colorArray = mupdfAnnot.getColor()
		const color = colorArray.length >= 3
			? { r: colorArray[0] ?? 0, g: colorArray[1] ?? 0, b: colorArray[2] ?? 0 }
			: this.#getDefaultColor(data.type)
		const opacity = mupdfAnnot.getOpacity()
		const contents = mupdfAnnot.getContents()
		const author = mupdfAnnot.getAuthor()
		const createdAt = mupdfAnnot.getCreationDate()
		const modifiedAt = mupdfAnnot.getModificationDate()

		const base = {
			id,
			pageNumber,
			bounds,
			color,
			opacity,
			contents,
			author,
			createdAt,
			modifiedAt,
		}

		switch (data.type) {
			case 'Text':
				return {
					...base,
					type: 'Text',
					isOpen: 'isOpen' in data ? Boolean(data.isOpen) : false,
				}
			case 'FreeText': {
				const fontSize = 'fontSize' in data && typeof data.fontSize === 'number' ? data.fontSize : DEFAULT_FREETEXT_FONT_SIZE
				const fontColor = 'fontColor' in data && data.fontColor ? data.fontColor : DEFAULT_FREETEXT_FONT_COLOR
				return {
					...base,
					type: 'FreeText',
					fontSize,
					fontColor,
				}
			}
			case 'Highlight':
				return {
					...base,
					type: 'Highlight',
					quadPoints: 'quadPoints' in data && Array.isArray(data.quadPoints) ? data.quadPoints : [],
				}
			case 'Ink': {
				const inkList = 'inkList' in data && Array.isArray(data.inkList) ? data.inkList : []
				const strokeWidth = 'strokeWidth' in data && typeof data.strokeWidth === 'number' ? data.strokeWidth : DEFAULT_INK_STROKE_WIDTH
				return {
					...base,
					type: 'Ink',
					inkList,
					strokeWidth,
				}
			}
			case 'Square':
			case 'Circle': {
				const shapeStrokeWidth = 'strokeWidth' in data && typeof data.strokeWidth === 'number' ? data.strokeWidth : DEFAULT_SHAPE_STROKE_WIDTH
				const fillColor = 'fillColor' in data ? data.fillColor : undefined
				return {
					...base,
					type: data.type,
					strokeWidth: shapeStrokeWidth,
					fillColor,
				}
			}
		}
	}

	#setTypeSpecificProperties(mupdfAnnot: mupdf.PDFAnnotation, data: AnyCreateAnnotationData): void {
		switch (data.type) {
			case 'Text':
				if ('isOpen' in data && data.isOpen !== undefined) {
					mupdfAnnot.setIsOpen(data.isOpen)
				}
				break
			case 'FreeText': {
				// Set default appearance for FreeText
				const fontSize = 'fontSize' in data && typeof data.fontSize === 'number' ? data.fontSize : DEFAULT_FREETEXT_FONT_SIZE
				const fontColor = 'fontColor' in data && data.fontColor ? data.fontColor : DEFAULT_FREETEXT_FONT_COLOR
				mupdfAnnot.setDefaultAppearance('Helv', fontSize, colorToMupdfArray(fontColor))
				break
			}
			case 'Highlight':
				if ('quadPoints' in data && Array.isArray(data.quadPoints) && data.quadPoints.length > 0) {
					const quads: mupdf.Quad[] = []
					// Convert points to quads (4 points per quad)
					for (let i = 0; i + 3 < data.quadPoints.length; i += 4) {
						const p0 = data.quadPoints[i]
						const p1 = data.quadPoints[i + 1]
						const p2 = data.quadPoints[i + 2]
						const p3 = data.quadPoints[i + 3]
						if (p0 && p1 && p2 && p3) {
							quads.push([p0.x, p0.y, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y])
						}
					}
					if (quads.length > 0) {
						mupdfAnnot.setQuadPoints(quads)
					}
				}
				break
			case 'Ink':
				if ('inkList' in data && Array.isArray(data.inkList) && data.inkList.length > 0) {
					const mupdfInkList: mupdf.Point[][] = data.inkList.map((stroke: readonly { readonly x: number; readonly y: number }[]) =>
						stroke.map((pt): mupdf.Point => [pt.x, pt.y]),
					)
					mupdfAnnot.setInkList(mupdfInkList)
				}
				if ('strokeWidth' in data && typeof data.strokeWidth === 'number') {
					mupdfAnnot.setBorderWidth(data.strokeWidth)
				}
				break
			case 'Square':
			case 'Circle':
				if ('strokeWidth' in data && typeof data.strokeWidth === 'number') {
					mupdfAnnot.setBorderWidth(data.strokeWidth)
				}
				if ('fillColor' in data && data.fillColor) {
					mupdfAnnot.setInteriorColor(colorToMupdfArray(data.fillColor))
				}
				break
		}
	}

	#getDefaultColor(type: string): { r: number; g: number; b: number } {
		switch (type) {
			case 'Text':
				return DEFAULT_TEXT_ANNOTATION_COLOR
			case 'Highlight':
			case 'Underline':
			case 'StrikeOut':
				return DEFAULT_HIGHLIGHT_COLOR
			case 'Ink':
				return DEFAULT_INK_COLOR
			case 'Square':
			case 'Circle':
				return DEFAULT_SHAPE_COLOR
			default:
				return DEFAULT_TEXT_ANNOTATION_COLOR
		}
	}

	#getDefaultOpacity(type: string): number {
		switch (type) {
			case 'Highlight':
			case 'Underline':
			case 'StrikeOut':
				return DEFAULT_HIGHLIGHT_OPACITY
			default:
				return DEFAULT_ANNOTATION_OPACITY
		}
	}

	// =========================================================================
	// Event Emitters
	// =========================================================================

	#emitLoad(fileName: string, pageCount: number): void {
		for (const callback of this.#loadListeners) {
			callback(fileName, pageCount)
		}
	}

	#emitPageChange(pageNumber: number): void {
		for (const callback of this.#pageChangeListeners) {
			callback(pageNumber)
		}
	}

	#emitZoomChange(zoom: number): void {
		for (const callback of this.#zoomChangeListeners) {
			callback(zoom)
		}
	}

	#emitAnnotationAdd(annotation: AnyAnnotation): void {
		for (const callback of this.#annotationAddListeners) {
			callback(annotation)
		}
	}

	#emitAnnotationRemove(annotationId: string): void {
		for (const callback of this.#annotationRemoveListeners) {
			callback(annotationId)
		}
	}

	#emitSave(success: boolean): void {
		for (const callback of this.#saveListeners) {
			callback(success)
		}
	}

	#emitError(error: Error): void {
		for (const callback of this.#errorListeners) {
			callback(error)
		}
	}
}
