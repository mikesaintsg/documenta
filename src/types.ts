/**
 * Documenta - Browser PDF Editor Types
 * @module types
 */

// ============================================================================
// Foundational Types
// ============================================================================

/** Cleanup function returned by event subscriptions */
export type Unsubscribe = () => void

/** Result type for operations that may fail */
export interface Result<T = void> {
	readonly ok: boolean
	readonly value?: T
	readonly error?: string
}

// ============================================================================
// PDF Document State
// ============================================================================

/** Readonly snapshot of the PDF editor state */
export interface PdfDocumentState {
	readonly isLoaded: boolean
	readonly fileName: string | undefined
	readonly pageCount: number
	readonly currentPage: number
	readonly zoom: number
	readonly hasUnsavedChanges: boolean
}

// ============================================================================
// Viewport and Rendering
// ============================================================================

/** Viewport configuration for rendering */
export interface Viewport {
	readonly width: number
	readonly height: number
	readonly scale: number
}

/** Page dimensions */
export interface PageDimensions {
	readonly width: number
	readonly height: number
}

/** Point in 2D space */
export interface Point {
	readonly x: number
	readonly y: number
}

/** Rectangle bounds */
export interface Rectangle {
	readonly x: number
	readonly y: number
	readonly width: number
	readonly height: number
}

// ============================================================================
// Annotation Types
// ============================================================================

/** Supported annotation types */
export type AnnotationType =
	| 'Text'
	| 'FreeText'
	| 'Highlight'
	| 'Underline'
	| 'StrikeOut'
	| 'Ink'
	| 'Square'
	| 'Circle'

/** RGB Color representation */
export interface AnnotationColor {
	readonly r: number
	readonly g: number
	readonly b: number
}

/** Base annotation interface */
export interface Annotation {
	readonly id: string
	readonly type: AnnotationType
	readonly pageNumber: number
	readonly bounds: Rectangle
	readonly color: AnnotationColor
	readonly opacity: number
	readonly contents: string
	readonly author: string
	readonly createdAt: Date
	readonly modifiedAt: Date
}

/** Text annotation (sticky note) */
export interface TextAnnotation extends Annotation {
	readonly type: 'Text'
	readonly isOpen: boolean
}

/** Free text annotation (text box) */
export interface FreeTextAnnotation extends Annotation {
	readonly type: 'FreeText'
	readonly fontSize: number
	readonly fontColor: AnnotationColor
}

/** Highlight annotation */
export interface HighlightAnnotation extends Annotation {
	readonly type: 'Highlight'
	readonly quadPoints: readonly Point[]
}

/** Ink annotation (freehand drawing) */
export interface InkAnnotation extends Annotation {
	readonly type: 'Ink'
	readonly inkList: readonly (readonly Point[])[]
	readonly strokeWidth: number
}

/** Shape annotation for Square and Circle */
export interface ShapeAnnotation extends Annotation {
	readonly type: 'Square' | 'Circle'
	readonly strokeWidth: number
	readonly fillColor: AnnotationColor | undefined
}

/** Union of all annotation types */
export type AnyAnnotation =
	| TextAnnotation
	| FreeTextAnnotation
	| HighlightAnnotation
	| InkAnnotation
	| ShapeAnnotation

// ============================================================================
// Annotation Creation Data
// ============================================================================

/** Data required to create a new annotation */
export interface CreateAnnotationData {
	readonly type: AnnotationType
	readonly pageNumber: number
	readonly bounds: Rectangle
	readonly color?: AnnotationColor
	readonly opacity?: number
	readonly contents?: string
	readonly author?: string
}

/** Data for creating text annotation */
export interface CreateTextAnnotationData extends CreateAnnotationData {
	readonly type: 'Text'
	readonly isOpen?: boolean
}

/** Data for creating free text annotation */
export interface CreateFreeTextAnnotationData extends CreateAnnotationData {
	readonly type: 'FreeText'
	readonly fontSize?: number
	readonly fontColor?: AnnotationColor
}

/** Data for creating highlight annotation */
export interface CreateHighlightAnnotationData extends CreateAnnotationData {
	readonly type: 'Highlight'
	readonly quadPoints: readonly Point[]
}

/** Data for creating ink annotation */
export interface CreateInkAnnotationData extends CreateAnnotationData {
	readonly type: 'Ink'
	readonly inkList: readonly (readonly Point[])[]
	readonly strokeWidth?: number
}

/** Data for creating shape annotation */
export interface CreateShapeAnnotationData extends CreateAnnotationData {
	readonly type: 'Square' | 'Circle'
	readonly strokeWidth?: number
	readonly fillColor?: AnnotationColor
}

/** Union of all annotation creation data types */
export type AnyCreateAnnotationData =
	| CreateTextAnnotationData
	| CreateFreeTextAnnotationData
	| CreateHighlightAnnotationData
	| CreateInkAnnotationData
	| CreateShapeAnnotationData

// ============================================================================
// Event Callbacks
// ============================================================================

/** Callback for document load events */
export type LoadCallback = (fileName: string, pageCount: number) => void

/** Callback for page change events */
export type PageChangeCallback = (pageNumber: number) => void

/** Callback for zoom change events */
export type ZoomChangeCallback = (zoom: number) => void

/** Callback for annotation add events */
export type AnnotationAddCallback = (annotation: AnyAnnotation) => void

/** Callback for annotation remove events */
export type AnnotationRemoveCallback = (annotationId: string) => void

/** Callback for save events */
export type SaveCallback = (success: boolean) => void

/** Callback for error events */
export type ErrorCallback = (error: Error) => void

// ============================================================================
// PDF Editor Hooks (Event Subscriptions)
// ============================================================================

/** Event subscription methods for the PDF editor */
export interface PdfEditorHooksInterface {
	/** Subscribe to document load events */
	onLoad(callback: LoadCallback): Unsubscribe

	/** Subscribe to page change events */
	onPageChange(callback: PageChangeCallback): Unsubscribe

	/** Subscribe to zoom change events */
	onZoomChange(callback: ZoomChangeCallback): Unsubscribe

	/** Subscribe to annotation add events */
	onAnnotationAdd(callback: AnnotationAddCallback): Unsubscribe

	/** Subscribe to annotation remove events */
	onAnnotationRemove(callback: AnnotationRemoveCallback): Unsubscribe

	/** Subscribe to save events */
	onSave(callback: SaveCallback): Unsubscribe

	/** Subscribe to error events */
	onError(callback: ErrorCallback): Unsubscribe
}

// ============================================================================
// PDF Editor Options
// ============================================================================

/** Options for creating a PDF editor instance */
export interface PdfEditorOptions {
	/** Container element for the PDF editor */
	readonly container: HTMLElement

	/** Initial zoom level (default: 1.0) */
	readonly initialZoom?: number

	/** Default author for annotations */
	readonly defaultAuthor?: string

	/** Initial callback for document load events */
	readonly onLoad?: LoadCallback

	/** Initial callback for page change events */
	readonly onPageChange?: PageChangeCallback

	/** Initial callback for zoom change events */
	readonly onZoomChange?: ZoomChangeCallback

	/** Initial callback for annotation add events */
	readonly onAnnotationAdd?: AnnotationAddCallback

	/** Initial callback for annotation remove events */
	readonly onAnnotationRemove?: AnnotationRemoveCallback

	/** Initial callback for save events */
	readonly onSave?: SaveCallback

	/** Initial callback for error events */
	readonly onError?: ErrorCallback
}

// ============================================================================
// PDF Editor Interface
// ============================================================================

/**
 * Main PDF editor interface
 *
 * @remarks
 * This interface defines the complete API for the browser PDF editor.
 * Use the `createPdfEditor` factory function to create instances.
 */
export interface PdfEditorInterface extends PdfEditorHooksInterface {
	// -------------------------------------------------------------------------
	// Property Accessors
	// -------------------------------------------------------------------------

	/** Get the current state snapshot */
	getState(): PdfDocumentState

	/** Check if a document is loaded */
	isLoaded(): boolean

	/** Get the current page number (1-indexed) */
	getCurrentPage(): number

	/** Get the total page count */
	getPageCount(): number

	/** Get the current zoom level */
	getZoom(): number

	/** Check if there are unsaved changes */
	hasUnsavedChanges(): boolean

	/** Get the file name of the loaded document */
	getFileName(): string | undefined

	/** Get all annotations on a specific page */
	getAnnotations(pageNumber: number): readonly AnyAnnotation[]

	/** Get annotation by ID */
	getAnnotationById(id: string): AnyAnnotation | undefined

	// -------------------------------------------------------------------------
	// Property Mutators
	// -------------------------------------------------------------------------

	/** Set the zoom level */
	setZoom(zoom: number): void

	// -------------------------------------------------------------------------
	// Document Operations
	// -------------------------------------------------------------------------

	/**
	 * Load a PDF from a File object
	 *
	 * @param file - The PDF file to load
	 * @returns Promise that resolves when loading is complete
	 */
	load(file: File): Promise<void>

	/**
	 * Load a PDF from an ArrayBuffer
	 *
	 * @param buffer - The PDF data as ArrayBuffer
	 * @param fileName - Optional file name for the document
	 * @returns Promise that resolves when loading is complete
	 */
	loadFromBuffer(buffer: ArrayBuffer, fileName?: string): Promise<void>

	/**
	 * Render a specific page to a canvas element
	 *
	 * @param pageNumber - The page number to render (1-indexed)
	 * @param canvas - The canvas element to render to
	 */
	renderPage(pageNumber: number, canvas: HTMLCanvasElement): void

	/**
	 * Get the dimensions of a specific page
	 *
	 * @param pageNumber - The page number (1-indexed)
	 * @returns The page dimensions
	 */
	getPageDimensions(pageNumber: number): PageDimensions

	// -------------------------------------------------------------------------
	// Navigation
	// -------------------------------------------------------------------------

	/**
	 * Navigate to a specific page
	 *
	 * @param pageNumber - The page number to navigate to (1-indexed)
	 */
	goToPage(pageNumber: number): void

	/** Navigate to the previous page */
	goToPreviousPage(): void

	/** Navigate to the next page */
	goToNextPage(): void

	// -------------------------------------------------------------------------
	// Zoom Controls
	// -------------------------------------------------------------------------

	/** Zoom in by one step */
	zoomIn(): void

	/** Zoom out by one step */
	zoomOut(): void

	/** Reset zoom to default (1.0) */
	resetZoom(): void

	/** Fit the page to the container width */
	fitToWidth(): void

	/** Fit the entire page in the container */
	fitToPage(): void

	// -------------------------------------------------------------------------
	// Annotation Management
	// -------------------------------------------------------------------------

	/**
	 * Add an annotation to the document
	 *
	 * @param data - The annotation creation data
	 * @returns The created annotation
	 */
	addAnnotation(data: AnyCreateAnnotationData): AnyAnnotation

	/**
	 * Update an existing annotation
	 *
	 * @param id - The annotation ID
	 * @param updates - Partial annotation data to update
	 */
	updateAnnotation(id: string, updates: Partial<Annotation>): void

	/**
	 * Remove an annotation from the document
	 *
	 * @param id - The annotation ID to remove
	 */
	removeAnnotation(id: string): void

	// -------------------------------------------------------------------------
	// Save Operations
	// -------------------------------------------------------------------------

	/**
	 * Save the document to a file using File System Access API
	 *
	 * @returns Promise that resolves when save is complete
	 */
	save(): Promise<void>

	/**
	 * Save the document to a new file using File System Access API
	 *
	 * @returns Promise that resolves when save is complete
	 */
	saveAs(): Promise<void>

	/**
	 * Download the document as a file
	 *
	 * @param fileName - Optional custom file name
	 */
	download(fileName?: string): void

	/**
	 * Get the document as an ArrayBuffer
	 *
	 * @returns The PDF data as ArrayBuffer
	 */
	toArrayBuffer(): ArrayBuffer

	// -------------------------------------------------------------------------
	// Text Layer (OCR and Inline Editing)
	// -------------------------------------------------------------------------

	/**
	 * Get the text layer interface for OCR and inline editing
	 *
	 * @returns The text layer interface, or null if no document is loaded
	 */
	getTextLayer(): TextLayerInterface | null

	/**
	 * Enable or disable the text layer overlay
	 *
	 * @param enabled - Whether to enable the text layer
	 */
	setTextLayerEnabled(enabled: boolean): void

	/**
	 * Check if the text layer is enabled
	 *
	 * @returns Whether the text layer is enabled
	 */
	isTextLayerEnabled(): boolean

	/**
	 * Extract text from a specific page
	 *
	 * @param pageNumber - The page number (1-indexed)
	 * @returns Plain text content of the page
	 */
	getPageText(pageNumber: number): string

	/**
	 * Search for text across all pages
	 *
	 * @param query - The search query
	 * @returns Array of search results with page and bounds
	 */
	searchText(query: string): readonly { pageNumber: number; bounds: Rectangle }[]

	// -------------------------------------------------------------------------
	// Page Management (Tier 3)
	// -------------------------------------------------------------------------

	/**
	 * Add a blank page to the document
	 *
	 * @param afterPage - Insert after this page number (0 = insert at beginning)
	 * @param width - Page width in points (default: 612 for letter)
	 * @param height - Page height in points (default: 792 for letter)
	 * @returns The new page number
	 */
	addBlankPage(afterPage?: number, width?: number, height?: number): number

	/**
	 * Delete a page from the document
	 *
	 * @param pageNumber - The page number to delete (1-indexed)
	 */
	deletePage(pageNumber: number): void

	/**
	 * Rotate a page
	 *
	 * @param pageNumber - The page number to rotate (1-indexed)
	 * @param rotation - Rotation in degrees (0, 90, 180, 270)
	 */
	rotatePage(pageNumber: number, rotation: PageRotation): void

	/**
	 * Get the rotation of a page
	 *
	 * @param pageNumber - The page number (1-indexed)
	 * @returns Current rotation in degrees
	 */
	getPageRotation(pageNumber: number): PageRotation

	/**
	 * Move a page to a new position
	 *
	 * @param fromPage - The page number to move
	 * @param toPage - The destination position
	 */
	movePage(fromPage: number, toPage: number): void

	// -------------------------------------------------------------------------
	// Drawing Layer (Tier 3)
	// -------------------------------------------------------------------------

	/**
	 * Get the drawing layer interface
	 *
	 * @returns The drawing layer interface, or null if not available
	 */
	getDrawingLayer(): DrawingLayerInterface | null

	/**
	 * Enable or disable drawing mode
	 *
	 * @param enabled - Whether to enable drawing
	 */
	setDrawingEnabled(enabled: boolean): void

	/**
	 * Check if drawing mode is enabled
	 *
	 * @returns Whether drawing is enabled
	 */
	isDrawingEnabled(): boolean

	// -------------------------------------------------------------------------
	// Form Filling (Tier 3)
	// -------------------------------------------------------------------------

	/**
	 * Get the form layer interface
	 *
	 * @returns The form layer interface, or null if not available
	 */
	getFormLayer(): FormLayerInterface | null

	/**
	 * Check if document has fillable form fields
	 *
	 * @returns Whether the document has form fields
	 */
	hasFormFields(): boolean

	// -------------------------------------------------------------------------
	// Lifecycle
	// -------------------------------------------------------------------------

	/** Destroy the editor and release resources */
	destroy(): void
}

// ============================================================================
// File System Access API Types (for browsers that support it)
// ============================================================================

/** File picker options for opening PDFs */
export interface OpenFilePickerOptions {
	readonly types?: readonly FilePickerAcceptType[]
	readonly multiple?: boolean
}

/** File picker accept type */
export interface FilePickerAcceptType {
	readonly description: string
	readonly accept: Record<string, readonly string[]>
}

/** File save picker options */
export interface SaveFilePickerOptions {
	readonly suggestedName?: string
	readonly types?: readonly FilePickerAcceptType[]
}

// ============================================================================
// Text Layer and OCR Types
// ============================================================================

/** Text character with position and font information */
export interface TextCharacter {
	readonly char: string
	readonly x: number
	readonly y: number
	readonly width: number
	readonly height: number
	readonly fontSize: number
	readonly fontName: string
	readonly color: AnnotationColor
	readonly quad: readonly [number, number, number, number, number, number, number, number]
}

/** Text line containing multiple characters */
export interface TextLine {
	readonly id: string
	readonly chars: readonly TextCharacter[]
	readonly bounds: Rectangle
	readonly baseline: number
	readonly direction: Point
	readonly wmode: number
}

/** Text block containing multiple lines */
export interface TextBlock {
	readonly id: string
	readonly lines: readonly TextLine[]
	readonly bounds: Rectangle
}

/** Text layer for a page containing all text blocks */
export interface TextLayer {
	readonly pageNumber: number
	readonly blocks: readonly TextBlock[]
	readonly width: number
	readonly height: number
}

/** Text selection range */
export interface TextSelection {
	readonly startBlockId: string
	readonly startLineId: string
	readonly startCharIndex: number
	readonly endBlockId: string
	readonly endLineId: string
	readonly endCharIndex: number
	readonly selectedText: string
	readonly bounds: readonly Rectangle[]
}

/** Text edit operation */
export interface TextEdit {
	readonly id: string
	readonly pageNumber: number
	readonly originalText: string
	readonly newText: string
	readonly bounds: Rectangle
	readonly fontSize: number
	readonly fontName: string
	readonly color: AnnotationColor
	readonly timestamp: Date
}

/** Text editing mode */
export type TextEditMode = 'select' | 'edit' | 'none'

/** Callback for text selection events */
export type TextSelectionCallback = (selection: TextSelection | null) => void

/** Callback for text edit events */
export type TextEditCallback = (edit: TextEdit) => void

// ============================================================================
// Text Layer Hooks (Event Subscriptions)
// ============================================================================

/** Event subscription methods for the text layer */
export interface TextLayerHooksInterface {
	/** Subscribe to text selection events */
	onTextSelect(callback: TextSelectionCallback): Unsubscribe

	/** Subscribe to text edit events */
	onTextEdit(callback: TextEditCallback): Unsubscribe
}

// ============================================================================
// Text Layer Options
// ============================================================================

/** Options for the text layer overlay */
export interface TextLayerOptions {
	/** Enable text selection (default: true) */
	readonly enableSelection?: boolean

	/** Enable inline text editing (default: true) */
	readonly enableEditing?: boolean

	/** Highlight color for selection */
	readonly selectionColor?: AnnotationColor

	/** Initial callback for text selection */
	readonly onTextSelect?: TextSelectionCallback

	/** Initial callback for text edit */
	readonly onTextEdit?: TextEditCallback
}

// ============================================================================
// Text Layer Interface
// ============================================================================

/**
 * Text layer interface for OCR and inline editing
 *
 * @remarks
 * This interface provides text extraction, selection, and inline editing
 * capabilities using an overlay strategy on top of the PDF canvas.
 */
export interface TextLayerInterface extends TextLayerHooksInterface {
	// -------------------------------------------------------------------------
	// Property Accessors
	// -------------------------------------------------------------------------

	/** Get the current edit mode */
	getEditMode(): TextEditMode

	/** Get the current text selection */
	getSelection(): TextSelection | null

	/** Get all text edits for a page */
	getEdits(pageNumber: number): readonly TextEdit[]

	/** Check if text layer is visible */
	isVisible(): boolean

	// -------------------------------------------------------------------------
	// Property Mutators
	// -------------------------------------------------------------------------

	/** Set the edit mode */
	setEditMode(mode: TextEditMode): void

	/** Show or hide the text layer */
	setVisible(visible: boolean): void

	// -------------------------------------------------------------------------
	// Text Extraction
	// -------------------------------------------------------------------------

	/**
	 * Extract text layer from a page
	 *
	 * @param pageNumber - The page number (1-indexed)
	 * @returns The extracted text layer
	 */
	extractTextLayer(pageNumber: number): TextLayer

	/**
	 * Get plain text content of a page
	 *
	 * @param pageNumber - The page number (1-indexed)
	 * @returns Plain text content
	 */
	getPageText(pageNumber: number): string

	/**
	 * Search for text on a page
	 *
	 * @param pageNumber - The page number (1-indexed)
	 * @param query - The search query
	 * @returns Array of matching bounds
	 */
	searchText(pageNumber: number, query: string): readonly Rectangle[]

	// -------------------------------------------------------------------------
	// Text Selection
	// -------------------------------------------------------------------------

	/**
	 * Select text at a point
	 *
	 * @param pageNumber - The page number
	 * @param point - The point to start selection
	 */
	startSelection(pageNumber: number, point: Point): void

	/**
	 * Extend selection to a point
	 *
	 * @param point - The point to extend selection to
	 */
	extendSelection(point: Point): void

	/**
	 * End the current selection
	 */
	endSelection(): void

	/**
	 * Clear the current selection
	 */
	clearSelection(): void

	/**
	 * Copy selected text to clipboard
	 */
	copySelection(): Promise<void>

	// -------------------------------------------------------------------------
	// Inline Editing
	// -------------------------------------------------------------------------

	/**
	 * Start editing text at a point
	 *
	 * @param pageNumber - The page number
	 * @param point - The point to start editing
	 */
	startEditing(pageNumber: number, point: Point): void

	/**
	 * Apply the current edit
	 */
	applyEdit(): void

	/**
	 * Cancel the current edit
	 */
	cancelEdit(): void

	/**
	 * Undo the last edit
	 */
	undoEdit(): void

	/**
	 * Redo the last undone edit
	 */
	redoEdit(): void

	// -------------------------------------------------------------------------
	// Rendering
	// -------------------------------------------------------------------------

	/**
	 * Render the text layer overlay
	 *
	 * @param pageNumber - The page number
	 * @param container - The container element
	 * @param scale - The current zoom scale
	 */
	render(pageNumber: number, container: HTMLElement, scale: number): void

	/**
	 * Update the text layer for zoom/scroll changes
	 *
	 * @param scale - The new scale
	 */
	update(scale: number): void

	// -------------------------------------------------------------------------
	// Lifecycle
	// -------------------------------------------------------------------------

	/** Destroy the text layer and release resources */
	destroy(): void
}

// ============================================================================
// Page Management Types (Tier 3)
// ============================================================================

/** Page rotation in degrees (clockwise) */
export type PageRotation = 0 | 90 | 180 | 270

/** Page size preset */
export type PageSizePreset = 'letter' | 'a4' | 'legal' | 'custom'

/** Page size dimensions */
export interface PageSize {
	readonly width: number
	readonly height: number
}

/** Standard page sizes in points (1/72 inch) */
export interface StandardPageSizes {
	readonly letter: PageSize
	readonly a4: PageSize
	readonly legal: PageSize
}

// ============================================================================
// Drawing Types (Tier 3)
// ============================================================================

/** Drawing tool type */
export type DrawingTool = 'pen' | 'highlighter' | 'eraser'

/** Drawing stroke data */
export interface DrawingStroke {
	readonly id: string
	readonly pageNumber: number
	readonly tool: DrawingTool
	readonly points: readonly Point[]
	readonly color: AnnotationColor
	readonly width: number
	readonly opacity: number
	readonly timestamp: Date
}

/** Drawing layer state */
export interface DrawingState {
	readonly isActive: boolean
	readonly currentTool: DrawingTool
	readonly strokeColor: AnnotationColor
	readonly strokeWidth: number
	readonly opacity: number
}

/** Callback for drawing stroke events */
export type DrawingStrokeCallback = (stroke: DrawingStroke) => void

/** Drawing layer hooks */
export interface DrawingLayerHooksInterface {
	/** Subscribe to stroke complete events */
	onStrokeComplete(callback: DrawingStrokeCallback): Unsubscribe
	/** Subscribe to stroke erase events */
	onStrokeErase(callback: (strokeId: string) => void): Unsubscribe
}

/** Drawing layer options */
export interface DrawingLayerOptions {
	readonly defaultTool?: DrawingTool
	readonly defaultColor?: AnnotationColor
	readonly defaultWidth?: number
	readonly defaultOpacity?: number
	readonly onStrokeComplete?: DrawingStrokeCallback
	readonly onStrokeErase?: (strokeId: string) => void
}

/** Drawing layer interface */
export interface DrawingLayerInterface extends DrawingLayerHooksInterface {
	/** Get current drawing state */
	getState(): DrawingState

	/** Check if drawing is active */
	isActive(): boolean

	/** Set drawing tool */
	setTool(tool: DrawingTool): void

	/** Set stroke color */
	setColor(color: AnnotationColor): void

	/** Set stroke width */
	setWidth(width: number): void

	/** Set stroke opacity */
	setOpacity(opacity: number): void

	/** Start drawing mode */
	activate(): void

	/** Stop drawing mode */
	deactivate(): void

	/** Clear all strokes on a page */
	clearPage(pageNumber: number): void

	/** Get all strokes on a page */
	getStrokes(pageNumber: number): readonly DrawingStroke[]

	/** Undo last stroke */
	undo(): void

	/** Redo last undone stroke */
	redo(): void

	/** Render drawing layer */
	render(pageNumber: number, canvas: HTMLCanvasElement, scale: number): void

	/** Destroy and cleanup */
	destroy(): void
}

// ============================================================================
// Form Field Types (Tier 3)
// ============================================================================

/** Form field type */
export type FormFieldType = 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature' | 'button'

/** Base form field interface */
export interface FormField {
	readonly id: string
	readonly pageNumber: number
	readonly name: string
	readonly type: FormFieldType
	readonly bounds: Rectangle
	readonly value: string
	readonly isReadOnly: boolean
	readonly isRequired: boolean
}

/** Text form field */
export interface TextFormField extends FormField {
	readonly type: 'text'
	readonly maxLength: number | undefined
	readonly isMultiline: boolean
	readonly isPassword: boolean
}

/** Checkbox form field */
export interface CheckboxFormField extends FormField {
	readonly type: 'checkbox'
	readonly isChecked: boolean
}

/** Radio button form field */
export interface RadioFormField extends FormField {
	readonly type: 'radio'
	readonly groupName: string
	readonly isSelected: boolean
}

/** Dropdown form field */
export interface DropdownFormField extends FormField {
	readonly type: 'dropdown'
	readonly options: readonly string[]
	readonly selectedIndex: number
}

/** Union of all form field types */
export type AnyFormField = TextFormField | CheckboxFormField | RadioFormField | DropdownFormField

/** Callback for form field change events */
export type FormFieldChangeCallback = (field: AnyFormField, newValue: string | boolean) => void

/** Form layer hooks */
export interface FormLayerHooksInterface {
	/** Subscribe to field change events */
	onFieldChange(callback: FormFieldChangeCallback): Unsubscribe
	/** Subscribe to form submit events */
	onFormSubmit(callback: () => void): Unsubscribe
}

/** Form layer options */
export interface FormLayerOptions {
	readonly highlightFields?: boolean
	readonly highlightColor?: AnnotationColor
	readonly onFieldChange?: FormFieldChangeCallback
	readonly onFormSubmit?: () => void
}

/** Form layer interface */
export interface FormLayerInterface extends FormLayerHooksInterface {
	/** Check if document has form fields */
	hasFormFields(): boolean

	/** Get all form fields in the document */
	getAllFields(): readonly AnyFormField[]

	/** Get form fields on a specific page */
	getFieldsOnPage(pageNumber: number): readonly AnyFormField[]

	/** Get form field by name */
	getFieldByName(name: string): AnyFormField | undefined

	/** Set text field value */
	setFieldValue(fieldId: string, value: string): void

	/** Set checkbox/radio checked state */
	setFieldChecked(fieldId: string, checked: boolean): void

	/** Set dropdown selection */
	setFieldSelection(fieldId: string, optionIndex: number): void

	/** Highlight form fields */
	setHighlightFields(enabled: boolean): void

	/** Flatten form (make fields non-editable) */
	flattenForm(): void

	/** Reset all fields to default values */
	resetForm(): void

	/** Render form field overlays */
	render(pageNumber: number, container: HTMLElement, scale: number): void

	/** Destroy and cleanup */
	destroy(): void
}
