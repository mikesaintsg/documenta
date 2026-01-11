/**
 * Documenta - Type Definitions
 * @module types
 *
 * Centralized type definitions for the Documenta PDF editor library.
 * All interfaces are defined before implementation (types-first development).
 */

// ============================================================================
// Core Utility Types
// ============================================================================

/**
 * Cleanup function returned by event subscriptions
 *
 * @example
 * ```ts
 * const unsubscribe = editor.onLoad((fileName) => {
 *   console.log(`Loaded: ${fileName}`)
 * })
 *
 * // Later, to stop listening:
 * unsubscribe()
 * ```
 */
export type Unsubscribe = () => void

/**
 * Result type for operations that may fail
 *
 * @typeParam T - The success value type
 */
export interface Result<T = void> {
	readonly ok: boolean
	readonly value?: T
	readonly error?: Error
}

// ============================================================================
// Geometry Types
// ============================================================================

/**
 * Point in 2D space
 *
 * @remarks
 * Coordinates are in PDF user space units (1/72 inch).
 * Origin is typically bottom-left for PDF coordinates,
 * but top-left for screen/canvas coordinates.
 */
export interface Point {
	readonly x: number
	readonly y: number
}

/**
 * Rectangle bounds
 *
 * @remarks
 * Uses top-left origin with width/height for consistency
 * with DOM/Canvas coordinate systems.
 */
export interface Rectangle {
	readonly x: number
	readonly y: number
	readonly width: number
	readonly height: number
}

/**
 * Quad (four-point polygon) for precise text bounds
 *
 * @remarks
 * Used for rotated or skewed text where a rectangle is insufficient.
 * Points are in clockwise order starting from top-left.
 */
export interface Quad {
	readonly topLeft: Point
	readonly topRight: Point
	readonly bottomRight: Point
	readonly bottomLeft: Point
}

// ============================================================================
// Color Types
// ============================================================================

/**
 * RGB color with components in 0-1 range
 *
 * @remarks
 * Uses 0-1 range for mupdf compatibility.
 * Convert to 0-255 for CSS using colorToCss helper.
 */
export interface Color {
	readonly r: number
	readonly g: number
	readonly b: number
}

// ============================================================================
// Page Types
// ============================================================================

/**
 * Page dimensions in PDF user space units
 */
export interface PageDimensions {
	readonly width: number
	readonly height: number
}

/**
 * Page rotation in degrees clockwise
 *
 * @remarks
 * Only 90-degree increments are supported. 
 */
export type PageRotation = 0 | 90 | 180 | 270

/**
 * Standard page size presets
 */
export type PageSizePreset = 'letter' | 'a4' | 'legal' | 'custom'

/**
 * Page size configuration
 */
export interface PageSize {
	readonly width: number
	readonly height:  number
}

// ============================================================================
// Viewport Types
// ============================================================================

/**
 * Viewport configuration for rendering
 *
 * @remarks
 * Combines scale, rotation, and offset for a complete
 * view transformation.
 */
export interface Viewport {
	readonly scale: number
	readonly rotation: PageRotation
	readonly offsetX: number
	readonly offsetY: number
}

// ============================================================================
// Editor Mode Types
// ============================================================================

/**
 * Editor interaction mode
 *
 * @remarks
 * Only one layer receives pointer events at a time based on mode: 
 * - `pan` - No layer active, viewport panning enabled
 * - `text` - Text layer active for selection/editing
 * - `draw` - Drawing layer active for pen/highlighter/eraser
 * - `form` - Form layer active for field interaction
 * - `annotate` - Annotation layer active for notes/shapes
 */
export type EditorMode = 'pan' | 'text' | 'draw' | 'form' | 'annotate'

// ============================================================================
// Document State Types
// ============================================================================

/**
 * Immutable snapshot of document state
 *
 * @remarks
 * Use getState() to retrieve current state.
 * State is readonly and should not be mutated directly.
 */
export interface DocumentState {
	readonly isLoaded: boolean
	readonly fileName: string | undefined
	readonly pageCount: number
	readonly currentPage: number
	readonly zoom: number
	readonly mode: EditorMode
	readonly hasUnsavedChanges: boolean
}

// ============================================================================
// Event Callback Types
// ============================================================================

/** Callback for document load events */
export type LoadCallback = (fileName:  string, pageCount: number) => void

/** Callback for page change events */
export type PageChangeCallback = (pageNumber: number) => void

/** Callback for zoom change events */
export type ZoomChangeCallback = (zoom:  number) => void

/** Callback for mode change events */
export type ModeChangeCallback = (mode: EditorMode) => void

/** Callback for save events */
export type SaveCallback = (success: boolean) => void

/** Callback for error events */
export type ErrorCallback = (error: Error) => void

// ============================================================================
// Layer Types
// ============================================================================

/**
 * Z-index constants for layer ordering
 *
 * @remarks
 * Higher values render on top.  Gaps allow insertion of custom layers.
 */
export interface LayerZIndex {
	readonly canvas: 0
	readonly text: 10
	readonly drawing:  20
	readonly form: 30
	readonly annotation: 40
}

/**
 * Layer names for registration
 */
export type LayerName = 'canvas' | 'text' | 'drawing' | 'form' | 'annotation'

/**
 * Base layer interface
 *
 * @remarks
 * All interactive layers implement this interface.
 * Only one layer is active at a time based on EditorMode.
 */
export interface LayerInterface {
	/** Layer z-index for stacking order */
	readonly zIndex: number

	/** Check if layer is currently active (receiving pointer events) */
	isActive(): boolean

	/** Activate the layer (enable pointer events) */
	activate(): void

	/** Deactivate the layer (disable pointer events) */
	deactivate(): void

	/**
	 * Render the layer for the specified page
	 *
	 * @param pageNumber - Page number (1-indexed)
	 * @param scale - Current zoom scale
	 */
	render(pageNumber: number, scale: number): void

	/**
	 * Resize the layer to match container
	 *
	 * @param width - New width in pixels
	 * @param height - New height in pixels
	 */
	resize(width: number, height: number): void

	/** Clean up resources */
	destroy(): void
}

/**
 * Layer stack coordinator interface
 *
 * @remarks
 * Manages layer registration, z-index ordering, and mode switching.
 * Ensures only one layer receives pointer events at a time.
 */
export interface LayerStackInterface {
	/**
	 * Register a layer with the stack
	 *
	 * @param name - Unique layer identifier
	 * @param layer - Layer instance
	 */
	registerLayer(name: LayerName, layer:  LayerInterface): void

	/**
	 * Unregister a layer from the stack
	 *
	 * @param name - Layer identifier to remove
	 */
	unregisterLayer(name: LayerName): void

	/**
	 * Get a registered layer by name
	 *
	 * @typeParam T - Expected layer type
	 * @param name - Layer identifier
	 * @returns Layer instance or undefined if not found
	 */
	getLayer<T extends LayerInterface>(name: LayerName): T | undefined

	/**
	 * Set the active editor mode
	 *
	 * @param mode - New editor mode
	 */
	setMode(mode: EditorMode): void

	/** Get the current editor mode */
	getMode(): EditorMode

	/**
	 * Subscribe to mode change events
	 *
	 * @param callback - Function called when mode changes
	 * @returns Cleanup function to unsubscribe
	 */
	onModeChange(callback: ModeChangeCallback): Unsubscribe

	/**
	 * Render all layers for the specified page
	 *
	 * @param pageNumber - Page number (1-indexed)
	 * @param scale - Current zoom scale
	 */
	render(pageNumber: number, scale: number): void

	/**
	 * Resize all layers to match container
	 *
	 * @param width - New width in pixels
	 * @param height - New height in pixels
	 */
	resize(width: number, height: number): void

	/** Clean up all layers */
	destroy(): void
}

// ============================================================================
// Gesture Types
// ============================================================================

/**
 * Recognized gesture types
 *
 * @remarks
 * - `tap` - Single quick touch/click
 * - `doubletap` - Two taps in quick succession
 * - `longpress` - Touch held for extended duration
 * - `pan` - Single-finger drag (mode-dependent behavior)
 * - `pinch` - Two-finger pinch for zoom (always available)
 * - `twofingerpan` - Two-finger drag for scroll (always available)
 */
export type GestureType =
	| 'tap'
	| 'doubletap'
	| 'longpress'
	| 'pan'
	| 'pinch'
	| 'twofingerpan'

/**
 * Gesture event data
 */
export interface GestureEvent {
	/** Type of gesture recognized */
	readonly type: GestureType

	/** Center point of the gesture */
	readonly center:  Point

	/** Scale factor for pinch gestures */
	readonly scale?:  number

	/** Horizontal movement delta */
	readonly deltaX?: number

	/** Vertical movement delta */
	readonly deltaY?: number

	/** Number of active pointers */
	readonly pointerCount: number

	/** Whether the gesture is complete */
	readonly isFinal: boolean
}

/** Callback for gesture events */
export type GestureCallback = (event:  GestureEvent) => void

/**
 * Gesture recognizer interface
 *
 * @remarks
 * Handles touch and mouse input, recognizing common gestures.
 * Pinch and two-finger pan are always available regardless of mode.
 */
export interface GestureRecognizerInterface {
	/**
	 * Attach to a DOM element to receive input
	 *
	 * @param element - Element to attach listeners to
	 */
	attach(element: HTMLElement): void

	/** Detach from the current element */
	detach(): void

	/**
	 * Subscribe to gesture events
	 *
	 * @param callback - Function called when gesture is recognized
	 * @returns Cleanup function to unsubscribe
	 */
	onGesture(callback: GestureCallback): Unsubscribe

	/** Clean up resources */
	destroy(): void
}

// ============================================================================
// Coordinate Transform Types
// ============================================================================

/**
 * Coordinate transformation interface
 *
 * @remarks
 * Converts between client (screen) coordinates and page (PDF) coordinates.
 * Handles zoom, devicePixelRatio, and rotation.
 */
export interface CoordinateTransformInterface {
	/**
	 * Convert client coordinates to page coordinates
	 *
	 * @param clientX - X position relative to viewport
	 * @param clientY - Y position relative to viewport
	 * @returns Point in page coordinate space
	 */
	clientToPage(clientX: number, clientY: number): Point

	/**
	 * Convert page coordinates to client coordinates
	 *
	 * @param pageX - X position in page space
	 * @param pageY - Y position in page space
	 * @returns Point in client coordinate space
	 */
	pageToClient(pageX: number, pageY: number): Point

	/**
	 * Update the current scale factor
	 *
	 * @param scale - New scale (zoom level)
	 */
	setScale(scale: number): void

	/**
	 * Update the current rotation
	 *
	 * @param rotation - New rotation in degrees
	 */
	setRotation(rotation:  PageRotation): void

	/**
	 * Update the viewport offset
	 *
	 * @param offsetX - Horizontal offset
	 * @param offsetY - Vertical offset
	 */
	setOffset(offsetX: number, offsetY: number): void

	/**
	 * Update the container bounds
	 *
	 * @param bounds - Container bounding rectangle
	 */
	setContainerBounds(bounds: DOMRect): void
}

// ============================================================================
// PDF Document Types
// ============================================================================

/**
 * PDF page interface
 *
 * @remarks
 * Provides access to page content and rendering. 
 */
export interface PdfPageInterface {
	/** Page number (1-indexed) */
	readonly pageNumber: number

	/** Page width in PDF units */
	readonly width: number

	/** Page height in PDF units */
	readonly height: number

	/** Page rotation */
	readonly rotation:  PageRotation

	/**
	 * Render page to a canvas context
	 *
	 * @param ctx - Canvas 2D rendering context
	 * @param scale - Render scale factor
	 */
	render(ctx: CanvasRenderingContext2D, scale: number): void

	/**
	 * Get plain text content of the page
	 *
	 * @returns Page text as string
	 */
	getText(): string

	/**
	 * Get structured text blocks with positioning
	 *
	 * @returns Array of text blocks
	 */
	getTextBlocks(): readonly TextBlock[]

	/** Release page resources */
	destroy(): void
}

/**
 * PDF document interface
 *
 * @remarks
 * Wraps mupdf.PDFDocument with type-safe methods. 
 */
export interface PdfDocumentInterface {
	/** Check if a document is loaded */
	isLoaded(): boolean

	/** Get total page count */
	getPageCount(): number

	/** Get the document file name */
	getFileName(): string | undefined

	/**
	 * Load document from ArrayBuffer
	 *
	 * @param buffer - PDF file data
	 * @param fileName - Optional file name
	 */
	loadFromBuffer(buffer:  ArrayBuffer, fileName?:  string): Promise<void>

	/**
	 * Get a specific page
	 *
	 * @param pageNumber - Page number (1-indexed)
	 * @returns Page interface
	 */
	getPage(pageNumber: number): PdfPageInterface

	/**
	 * Get page dimensions
	 *
	 * @param pageNumber - Page number (1-indexed)
	 * @returns Page dimensions
	 */
	getPageDimensions(pageNumber: number): PageDimensions

	/**
	 * Get page rotation
	 *
	 * @param pageNumber - Page number (1-indexed)
	 * @returns Rotation in degrees
	 */
	getPageRotation(pageNumber:  number): PageRotation

	/**
	 * Export document to ArrayBuffer
	 *
	 * @returns PDF data as ArrayBuffer
	 */
	toArrayBuffer(): ArrayBuffer

	/** Release document resources */
	destroy(): void
}

// ============================================================================
// File Manager Types
// ============================================================================

/**
 * File picker accept type configuration
 */
export interface FilePickerAcceptType {
	readonly description: string
	readonly accept: Record<string, readonly string[]>
}

/**
 * File manager interface for load/save operations
 *
 * @remarks
 * Uses File System Access API when available, with fallbacks.
 */
export interface FileManagerInterface {
	/**
	 * Load a File object as ArrayBuffer
	 *
	 * @param file - File to load
	 * @returns File data as ArrayBuffer
	 */
	loadFile(file: File): Promise<ArrayBuffer>

	/**
	 * Load a file from URL
	 *
	 * @param url - URL to fetch
	 * @returns File data as ArrayBuffer
	 */
	loadUrl(url: string): Promise<ArrayBuffer>

	/**
	 * Save data to an existing file handle
	 *
	 * @param data - Data to save
	 * @param handle - Existing file handle (optional)
	 * @returns File handle if saved successfully
	 */
	save(data: ArrayBuffer, handle?: FileSystemFileHandle): Promise<FileSystemFileHandle | undefined>

	/**
	 * Save data to a new file with picker
	 *
	 * @param data - Data to save
	 * @param suggestedName - Suggested file name
	 * @returns File handle if saved successfully
	 */
	saveAs(data: ArrayBuffer, suggestedName:  string): Promise<FileSystemFileHandle | undefined>

	/**
	 * Download data as file (fallback)
	 *
	 * @param data - Data to download
	 * @param fileName - File name for download
	 */
	download(data: ArrayBuffer, fileName:  string): void
}

// ============================================================================
// Canvas Layer Types
// ============================================================================

/**
 * Canvas layer interface for PDF rendering
 *
 * @remarks
 * Renders PDF pages to an HTML canvas element. 
 */
export interface CanvasLayerInterface extends LayerInterface {
	/** Get the canvas element */
	getCanvas(): HTMLCanvasElement

	/**
	 * Set the document to render
	 *
	 * @param doc - PDF document
	 */
	setDocument(doc: PdfDocumentInterface): void
}

// ============================================================================
// Text Layer Types
// ============================================================================

/**
 * Text character with positioning
 */
export interface TextCharacter {
	readonly char:  string
	readonly bounds: Rectangle
	readonly fontSize: number
	readonly fontName: string
	readonly color: Color
}

/**
 * Text line containing characters
 */
export interface TextLine {
	readonly id: string
	readonly bounds: Rectangle
	readonly characters: readonly TextCharacter[]
}

/**
 * Text block containing lines
 */
export interface TextBlock {
	readonly id:  string
	readonly bounds: Rectangle
	readonly lines: readonly TextLine[]
}

/**
 * Extracted text layer data for a page
 */
export interface TextLayerData {
	readonly pageNumber: number
	readonly blocks: readonly TextBlock[]
}

/**
 * Text selection range
 */
export interface TextSelection {
	readonly pageNumber: number
	readonly startIndex: number
	readonly endIndex: number
	readonly text: string
	readonly bounds: readonly Rectangle[]
}

/**
 * Text edit operation
 */
export interface TextEdit {
	readonly id: string
	readonly pageNumber: number
	readonly bounds: Rectangle
	readonly originalText: string
	readonly newText: string
	readonly timestamp: Date
}

/** Callback for text selection changes */
export type TextSelectionCallback = (selection: TextSelection | null) => void

/** Callback for text edit operations */
export type TextEditCallback = (edit: TextEdit) => void

/**
 * Text search match result
 */
export interface SearchMatch {
	readonly pageNumber: number
	readonly bounds: Rectangle
	readonly text: string
}

/**
 * Text layer interface
 *
 * @remarks
 * Provides text selection, search, and inline editing via HTML overlay.
 */
export interface TextLayerInterface extends LayerInterface {
	/**
	 * Get plain text for a page
	 *
	 * @param pageNumber - Page number (1-indexed)
	 * @returns Plain text content
	 */
	getPlainText(pageNumber: number): string

	/**
	 * Get structured text blocks for a page
	 *
	 * @param pageNumber - Page number (1-indexed)
	 * @returns Array of text blocks
	 */
	getTextBlocks(pageNumber: number): readonly TextBlock[]

	/** Get current text selection */
	getSelection(): TextSelection | null

	/** Clear current text selection */
	clearSelection(): void

	/** Copy current selection to clipboard */
	copySelection(): Promise<void>

	/**
	 * Search for text across pages
	 *
	 * @param query - Search query
	 * @returns Array of matches
	 */
	search(query:  string): readonly SearchMatch[]

	/**
	 * Search for text on a specific page
	 *
	 * @param pageNumber - Page number (1-indexed)
	 * @param query - Search query
	 * @returns Array of matches on the page
	 */
	searchPage(pageNumber: number, query: string): readonly SearchMatch[]

	/**
	 * Start editing text at a point
	 *
	 * @param pageNumber - Page number (1-indexed)
	 * @param point - Click/tap location
	 */
	startEditing(pageNumber: number, point: Point): void

	/** Apply the current edit */
	applyEdit(): void

	/** Cancel the current edit */
	cancelEdit(): void

	/** Undo the last edit */
	undoEdit(): void

	/** Redo the last undone edit */
	redoEdit(): void

	/**
	 * Subscribe to selection changes
	 *
	 * @param callback - Function called when selection changes
	 * @returns Cleanup function
	 */
	onSelectionChange(callback: TextSelectionCallback): Unsubscribe

	/**
	 * Subscribe to edit operations
	 *
	 * @param callback - Function called when edit is applied
	 * @returns Cleanup function
	 */
	onEdit(callback: TextEditCallback): Unsubscribe

	/**
	 * Set the document for text extraction
	 *
	 * @param doc - PDF document
	 */
	setDocument(doc:  PdfDocumentInterface): void
}

// ============================================================================
// Drawing Layer Types
// ============================================================================

/**
 * Drawing tool types
 */
export type DrawingTool = 'pen' | 'highlighter' | 'eraser'

/**
 * Drawing stroke data
 */
export interface DrawingStroke {
	readonly id: string
	readonly pageNumber: number
	readonly tool: DrawingTool
	readonly points: readonly Point[]
	readonly color: Color
	readonly width: number
	readonly opacity: number
	readonly timestamp: Date
}

/**
 * Drawing layer state
 */
export interface DrawingState {
	readonly isActive: boolean
	readonly currentTool: DrawingTool
	readonly strokeColor: Color
	readonly strokeWidth: number
	readonly opacity: number
}

/** Callback for stroke completion */
export type StrokeCompleteCallback = (stroke: DrawingStroke) => void

/** Callback for stroke erasure */
export type StrokeEraseCallback = (strokeId: string) => void

/**
 * Drawing layer interface
 *
 * @remarks
 * Provides freehand drawing with pen, highlighter, and eraser tools.
 * Uses a separate overlay canvas for drawing. 
 */
export interface DrawingLayerInterface extends LayerInterface {
	/** Get current drawing state */
	getState(): DrawingState

	/**
	 * Set the current drawing tool
	 *
	 * @param tool - Tool to use
	 */
	setTool(tool: DrawingTool): void

	/** Get the current drawing tool */
	getTool(): DrawingTool

	/**
	 * Set the stroke color
	 *
	 * @param color - Color for new strokes
	 */
	setColor(color: Color): void

	/** Get the current stroke color */
	getColor(): Color

	/**
	 * Set the stroke width
	 *
	 * @param width - Width in pixels
	 */
	setWidth(width: number): void

	/** Get the current stroke width */
	getWidth(): number

	/**
	 * Set the stroke opacity
	 *
	 * @param opacity - Opacity (0-1)
	 */
	setOpacity(opacity: number): void

	/** Get the current stroke opacity */
	getOpacity(): number

	/**
	 * Get all strokes on a page
	 *
	 * @param pageNumber - Page number (1-indexed)
	 * @returns Array of strokes
	 */
	getStrokes(pageNumber: number): readonly DrawingStroke[]

	/**
	 * Clear all strokes on a page
	 *
	 * @param pageNumber - Page number (1-indexed)
	 */
	clearPage(pageNumber: number): void

	/** Undo the last stroke */
	undo(): void

	/** Redo the last undone stroke */
	redo(): void

	/** Check if undo is available */
	canUndo(): boolean

	/** Check if redo is available */
	canRedo(): boolean

	/**
	 * Subscribe to stroke completion events
	 *
	 * @param callback - Function called when stroke is completed
	 * @returns Cleanup function
	 */
	onStrokeComplete(callback: StrokeCompleteCallback): Unsubscribe

	/**
	 * Subscribe to stroke erase events
	 *
	 * @param callback - Function called when stroke is erased
	 * @returns Cleanup function
	 */
	onStrokeErase(callback:  StrokeEraseCallback): Unsubscribe

	/**
	 * Set the document for annotation persistence
	 *
	 * @param doc - PDF document
	 */
	setDocument(doc:  PdfDocumentInterface): void
}

// ============================================================================
// Form Layer Types
// ============================================================================

/**
 * Form field types
 */
export type FormFieldType = 'text' | 'checkbox' | 'radio' | 'dropdown'

/**
 * Base form field interface
 */
export interface FormField {
	readonly id: string
	readonly pageNumber: number
	readonly type: FormFieldType
	readonly name: string
	readonly bounds: Rectangle
	readonly value: string
	readonly isReadOnly: boolean
	readonly isRequired: boolean
}

/**
 * Text input form field
 */
export interface TextFormField extends FormField {
	readonly type: 'text'
	readonly maxLength:  number | undefined
	readonly isMultiline: boolean
	readonly isPassword: boolean
}

/**
 * Checkbox form field
 */
export interface CheckboxFormField extends FormField {
	readonly type: 'checkbox'
	readonly isChecked: boolean
}

/**
 * Radio button form field
 */
export interface RadioFormField extends FormField {
	readonly type: 'radio'
	readonly groupName: string
	readonly isSelected: boolean
}

/**
 * Dropdown/select form field
 */
export interface DropdownFormField extends FormField {
	readonly type: 'dropdown'
	readonly options: readonly string[]
	readonly selectedIndex: number
}

/**
 * Union of all form field types
 */
export type AnyFormField =
	| TextFormField
	| CheckboxFormField
	| RadioFormField
	| DropdownFormField

/** Callback for form field changes */
export type FormFieldChangeCallback = (field: AnyFormField, newValue: string | boolean) => void

/**
 * Form layer interface
 *
 * @remarks
 * Detects and renders interactive form fields in PDFs.
 */
export interface FormLayerInterface extends LayerInterface {
	/** Check if document has form fields */
	hasFormFields(): boolean

	/** Get all form fields in the document */
	getAllFields(): readonly AnyFormField[]

	/**
	 * Get form fields on a specific page
	 *
	 * @param pageNumber - Page number (1-indexed)
	 * @returns Array of form fields
	 */
	getFieldsOnPage(pageNumber: number): readonly AnyFormField[]

	/**
	 * Get a form field by name
	 *
	 * @param name - Field name
	 * @returns Field or undefined
	 */
	getFieldByName(name:  string): AnyFormField | undefined

	/**
	 * Set text field value
	 *
	 * @param fieldId - Field identifier
	 * @param value - New value
	 */
	setFieldValue(fieldId:  string, value: string): void

	/**
	 * Set checkbox/radio checked state
	 *
	 * @param fieldId - Field identifier
	 * @param checked - New checked state
	 */
	setFieldChecked(fieldId: string, checked: boolean): void

	/**
	 * Set dropdown selection
	 *
	 * @param fieldId - Field identifier
	 * @param optionIndex - Selected option index
	 */
	setFieldSelection(fieldId: string, optionIndex:  number): void

	/**
	 * Enable/disable field highlighting
	 *
	 * @param enabled - Whether to highlight fields
	 */
	setHighlightFields(enabled: boolean): void

	/** Flatten form fields into page content */
	flattenForm(): void

	/** Reset all fields to default values */
	resetForm(): void

	/**
	 * Subscribe to field change events
	 *
	 * @param callback - Function called when field changes
	 * @returns Cleanup function
	 */
	onFieldChange(callback: FormFieldChangeCallback): Unsubscribe

	/**
	 * Set the document for form field detection
	 *
	 * @param doc - PDF document
	 */
	setDocument(doc:  PdfDocumentInterface): void
}

// ============================================================================
// Annotation Types
// ============================================================================

/**
 * Annotation types
 */
export type AnnotationType =
	| 'Text'
	| 'FreeText'
	| 'Highlight'
	| 'Underline'
	| 'StrikeOut'
	| 'Ink'
	| 'Square'
	| 'Circle'

/**
 * Base annotation interface
 */
export interface Annotation {
	readonly id: string
	readonly pageNumber: number
	readonly type: AnnotationType
	readonly bounds: Rectangle
	readonly color: Color
	readonly opacity: number
	readonly contents: string
	readonly author: string | undefined
	readonly createdAt: Date
	readonly modifiedAt: Date
}

/**
 * Text annotation (sticky note)
 */
export interface TextAnnotation extends Annotation {
	readonly type:  'Text'
	readonly isOpen: boolean
}

/**
 * Free text annotation (text box)
 */
export interface FreeTextAnnotation extends Annotation {
	readonly type: 'FreeText'
	readonly fontSize: number
	readonly fontColor: Color
}

/**
 * Highlight annotation
 */
export interface HighlightAnnotation extends Annotation {
	readonly type: 'Highlight'
	readonly quadPoints: readonly Quad[]
}

/**
 * Underline annotation
 */
export interface UnderlineAnnotation extends Annotation {
	readonly type: 'Underline'
	readonly quadPoints: readonly Quad[]
}

/**
 * Strikeout annotation
 */
export interface StrikeOutAnnotation extends Annotation {
	readonly type:  'StrikeOut'
	readonly quadPoints: readonly Quad[]
}

/**
 * Ink annotation (freehand drawing)
 */
export interface InkAnnotation extends Annotation {
	readonly type:  'Ink'
	readonly inkList: readonly (readonly Point[])[]
	readonly strokeWidth: number
}

/**
 * Square annotation
 */
export interface SquareAnnotation extends Annotation {
	readonly type: 'Square'
	readonly strokeWidth: number
}

/**
 * Circle annotation
 */
export interface CircleAnnotation extends Annotation {
	readonly type: 'Circle'
	readonly strokeWidth: number
}

/**
 * Union of all annotation types
 */
export type AnyAnnotation =
	| TextAnnotation
	| FreeTextAnnotation
	| HighlightAnnotation
	| UnderlineAnnotation
	| StrikeOutAnnotation
	| InkAnnotation
	| SquareAnnotation
	| CircleAnnotation

/**
 * Data for creating a new annotation
 */
export interface CreateAnnotationData {
	readonly type: AnnotationType
	readonly pageNumber: number
	readonly bounds: Rectangle
	readonly color?:  Color
	readonly opacity?: number
	readonly contents?: string
}

/** Callback for annotation add events */
export type AnnotationAddCallback = (annotation: AnyAnnotation) => void

/** Callback for annotation remove events */
export type AnnotationRemoveCallback = (annotationId: string) => void

/** Callback for annotation select events */
export type AnnotationSelectCallback = (annotation: AnyAnnotation | undefined) => void

/**
 * Annotation layer interface
 *
 * @remarks
 * Manages annotations (notes, shapes, highlights) on PDF pages. 
 */
export interface AnnotationLayerInterface extends LayerInterface {
	/**
	 * Get all annotations on a page
	 *
	 * @param pageNumber - Page number (1-indexed)
	 * @returns Array of annotations
	 */
	getAnnotations(pageNumber: number): readonly AnyAnnotation[]

	/**
	 * Get annotation by ID
	 *
	 * @param id - Annotation identifier
	 * @returns Annotation or undefined
	 */
	getAnnotationById(id: string): AnyAnnotation | undefined

	/**
	 * Add a new annotation
	 *
	 * @param data - Annotation data
	 * @returns Created annotation
	 */
	addAnnotation(data: CreateAnnotationData): AnyAnnotation

	/**
	 * Update an existing annotation
	 *
	 * @param id - Annotation identifier
	 * @param updates - Partial annotation data
	 */
	updateAnnotation(id: string, updates: Partial<Annotation>): void

	/**
	 * Remove an annotation
	 *
	 * @param id - Annotation identifier
	 */
	removeAnnotation(id: string): void

	/**
	 * Select an annotation for editing
	 *
	 * @param id - Annotation identifier
	 */
	selectAnnotation(id: string): void

	/** Deselect the current annotation */
	deselectAnnotation(): void

	/** Get the currently selected annotation */
	getSelectedAnnotation(): AnyAnnotation | undefined

	/**
	 * Subscribe to annotation add events
	 *
	 * @param callback - Function called when annotation is added
	 * @returns Cleanup function
	 */
	onAnnotationAdd(callback: AnnotationAddCallback): Unsubscribe

	/**
	 * Subscribe to annotation remove events
	 *
	 * @param callback - Function called when annotation is removed
	 * @returns Cleanup function
	 */
	onAnnotationRemove(callback: AnnotationRemoveCallback): Unsubscribe

	/**
	 * Subscribe to annotation select events
	 *
	 * @param callback - Function called when selection changes
	 * @returns Cleanup function
	 */
	onAnnotationSelect(callback: AnnotationSelectCallback): Unsubscribe

	/**
	 * Set the document for annotation storage
	 *
	 * @param doc - PDF document
	 */
	setDocument(doc:  PdfDocumentInterface): void
}

// ============================================================================
// Editor Hooks Interface
// ============================================================================

/**
 * Editor event subscription interface
 *
 * @remarks
 * All event subscriptions return an Unsubscribe function for cleanup.
 */
export interface EditorHooksInterface {
	/**
	 * Subscribe to document load events
	 *
	 * @param callback - Function called when document loads
	 * @returns Cleanup function
	 */
	onLoad(callback: LoadCallback): Unsubscribe

	/**
	 * Subscribe to page change events
	 *
	 * @param callback - Function called when page changes
	 * @returns Cleanup function
	 */
	onPageChange(callback:  PageChangeCallback): Unsubscribe

	/**
	 * Subscribe to zoom change events
	 *
	 * @param callback - Function called when zoom changes
	 * @returns Cleanup function
	 */
	onZoomChange(callback:  ZoomChangeCallback): Unsubscribe

	/**
	 * Subscribe to mode change events
	 *
	 * @param callback - Function called when mode changes
	 * @returns Cleanup function
	 */
	onModeChange(callback: ModeChangeCallback): Unsubscribe

	/**
	 * Subscribe to save events
	 *
	 * @param callback - Function called when save completes
	 * @returns Cleanup function
	 */
	onSave(callback: SaveCallback): Unsubscribe

	/**
	 * Subscribe to error events
	 *
	 * @param callback - Function called on error
	 * @returns Cleanup function
	 */
	onError(callback:  ErrorCallback): Unsubscribe
}

// ============================================================================
// Editor Options Interface
// ============================================================================

/**
 * Editor configuration options
 *
 * @remarks
 * All options except `container` are optional with sensible defaults.
 */
export interface EditorOptions {
	/** Container element for the editor */
	readonly container:  HTMLElement

	/** Initial zoom level (default: 1.0) */
	readonly initialZoom?:  number

	/** Initial editor mode (default: 'pan') */
	readonly initialMode?: EditorMode

	/** Enable text layer (default: true) */
	readonly enableTextLayer?: boolean

	/** Enable drawing layer (default: true) */
	readonly enableDrawingLayer?:  boolean

	/** Enable form layer (default: true) */
	readonly enableFormLayer?: boolean

	/** Enable annotation layer (default: true) */
	readonly enableAnnotationLayer?:  boolean

	/** Default author for annotations */
	readonly defaultAuthor?: string

	/** Callback for document load events */
	readonly onLoad?: LoadCallback

	/** Callback for page change events */
	readonly onPageChange?: PageChangeCallback

	/** Callback for zoom change events */
	readonly onZoomChange?: ZoomChangeCallback

	/** Callback for mode change events */
	readonly onModeChange?: ModeChangeCallback

	/** Callback for save events */
	readonly onSave?: SaveCallback

	/** Callback for error events */
	readonly onError?: ErrorCallback
}

// ============================================================================
// Main Editor Interface
// ============================================================================

/**
 * Main PDF editor interface
 *
 * @remarks
 * Coordinates all layers, document operations, and state management.
 * This is the primary API for interacting with the PDF editor.
 *
 * @example
 * ```ts
 * const editor = createPdfEditor({
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
export interface EditorInterface extends EditorHooksInterface {
	// =========================================================================
	// State Accessors
	// =========================================================================

	/** Get immutable state snapshot */
	getState(): DocumentState

	/** Check if a document is loaded */
	isLoaded(): boolean

	/** Get current page number (1-indexed) */
	getCurrentPage(): number

	/** Get total page count */
	getPageCount(): number

	/** Get current zoom level */
	getZoom(): number

	/** Get current editor mode */
	getMode(): EditorMode

	/** Check for unsaved changes */
	hasUnsavedChanges(): boolean

	/** Get loaded file name */
	getFileName(): string | undefined

	// =========================================================================
	// Mode Control
	// =========================================================================

	/**
	 * Set the editor mode
	 *
	 * @param mode - New editor mode
	 */
	setMode(mode: EditorMode): void

	// =========================================================================
	// Document Operations
	// =========================================================================

	/**
	 * Load a PDF from a File object
	 *
	 * @param file - PDF file to load
	 */
	load(file: File): Promise<void>

	/**
	 * Load a PDF from an ArrayBuffer
	 *
	 * @param buffer - PDF data
	 * @param fileName - Optional file name
	 */
	loadFromBuffer(buffer: ArrayBuffer, fileName?: string): Promise<void>

	/**
	 * Load a PDF from a URL
	 *
	 * @param url - URL to fetch
	 * @param fileName - Optional file name
	 */
	loadFromUrl(url: string, fileName?: string): Promise<void>

	// =========================================================================
	// Rendering
	// =========================================================================

	/**
	 * Render the specified page
	 *
	 * @param pageNumber - Page number (1-indexed)
	 */
	renderPage(pageNumber:  number): void

	/**
	 * Get page dimensions
	 *
	 * @param pageNumber - Page number (1-indexed)
	 * @returns Page dimensions
	 */
	getPageDimensions(pageNumber: number): PageDimensions

	// =========================================================================
	// Navigation
	// =========================================================================

	/**
	 * Go to a specific page
	 *
	 * @param pageNumber - Target page (1-indexed)
	 */
	goToPage(pageNumber: number): void

	/** Go to previous page */
	goToPreviousPage(): void

	/** Go to next page */
	goToNextPage(): void

	// =========================================================================
	// Zoom
	// =========================================================================

	/**
	 * Set zoom level
	 *
	 * @param zoom - Zoom factor (0.25 to 5.0)
	 */
	setZoom(zoom: number): void

	/** Zoom in by one step */
	zoomIn(): void

	/** Zoom out by one step */
	zoomOut(): void

	/** Reset zoom to 1.0 */
	resetZoom(): void

	/** Fit page width to container */
	fitToWidth(): void

	/** Fit entire page to container */
	fitToPage(): void

	// =========================================================================
	// Page Management
	// =========================================================================

	/**
	 * Add a blank page
	 *
	 * @param afterPage - Insert after this page (0 for beginning)
	 * @param width - Page width (default: letter width)
	 * @param height - Page height (default: letter height)
	 * @returns New page number
	 */
	addBlankPage(afterPage?:  number, width?: number, height?: number): number

	/**
	 * Delete a page
	 *
	 * @param pageNumber - Page to delete (1-indexed)
	 */
	deletePage(pageNumber: number): void

	/**
	 * Rotate a page
	 *
	 * @param pageNumber - Page to rotate (1-indexed)
	 * @param rotation - New rotation
	 */
	rotatePage(pageNumber: number, rotation: PageRotation): void

	/**
	 * Get page rotation
	 *
	 * @param pageNumber - Page number (1-indexed)
	 * @returns Current rotation
	 */
	getPageRotation(pageNumber:  number): PageRotation

	/**
	 * Move a page to a new position
	 *
	 * @param fromPage - Source page (1-indexed)
	 * @param toPage - Destination position (1-indexed)
	 */
	movePage(fromPage: number, toPage: number): void

	// =========================================================================
	// Save/Export
	// =========================================================================

	/** Save to existing file handle */
	save(): Promise<void>

	/** Save to new file with picker */
	saveAs(): Promise<void>

	/**
	 * Download as file
	 *
	 * @param fileName - Download file name
	 */
	download(fileName?: string): void

	/** Export as ArrayBuffer */
	toArrayBuffer(): ArrayBuffer

	// =========================================================================
	// Layer Access
	// =========================================================================

	/** Get the text layer */
	getTextLayer(): TextLayerInterface | undefined

	/** Get the drawing layer */
	getDrawingLayer(): DrawingLayerInterface | undefined

	/** Get the form layer */
	getFormLayer(): FormLayerInterface | undefined

	/** Get the annotation layer */
	getAnnotationLayer(): AnnotationLayerInterface | undefined

	// =========================================================================
	// Text Operations (convenience methods)
	// =========================================================================

	/**
	 * Get plain text from a page
	 *
	 * @param pageNumber - Page number (1-indexed)
	 * @returns Page text
	 */
	getPageText(pageNumber:  number): string

	/**
	 * Search for text in document
	 *
	 * @param query - Search query
	 * @returns Array of matches
	 */
	searchText(query: string): readonly SearchMatch[]

	// =========================================================================
	// Form Operations (convenience methods)
	// =========================================================================

	/** Check if document has form fields */
	hasFormFields(): boolean

	// =========================================================================
	// Lifecycle
	// =========================================================================

	/** Clean up all resources */
	destroy(): void
}