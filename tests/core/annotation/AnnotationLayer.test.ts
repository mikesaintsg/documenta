/**
 * Tests for AnnotationLayer
 * @module tests/core/annotation/AnnotationLayer
 *
 * Uses real mupdf library - no mocks.
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest'
import { AnnotationLayer } from '~/src/core/annotation/AnnotationLayer.js'
import { PdfDocument } from '~/src/core/document/PdfDocument.js'
import { createTestElement, loadPdfFixture, PDF_FIXTURES } from '../../setup.js'
import type { PdfDocumentInterface } from '~/src/types.js'

describe('AnnotationLayer', () => {
let container: HTMLElement
let annotationLayer: AnnotationLayer
let pdfDocument: PdfDocumentInterface
let simplePdfBuffer: ArrayBuffer

beforeAll(async () => {
// Pre-load the simple PDF fixture
simplePdfBuffer = await loadPdfFixture(PDF_FIXTURES.simple)
})

beforeEach(async () => {
container = createTestElement()
container.style.width = '800px'
container.style.height = '600px'
document.body.appendChild(container)

annotationLayer = new AnnotationLayer(container)
pdfDocument = new PdfDocument()
await pdfDocument.loadFromBuffer(simplePdfBuffer, 'test.pdf')
})

afterEach(() => {
annotationLayer.destroy()
container.remove()
})

describe('constructor', () => {
it('creates layer element', () => {
const layer = container.querySelector('[class*="annotation-layer"]')
expect(layer).not.toBeNull()
})
})

describe('setDocument', () => {
it('accepts a document', () => {
expect(() => annotationLayer.setDocument(pdfDocument)).not.toThrow()
})

it('allows setting different documents', async () => {
const anotherDoc = new PdfDocument()
await anotherDoc.loadFromBuffer(simplePdfBuffer, 'another.pdf')

annotationLayer.setDocument(pdfDocument)
expect(() => annotationLayer.setDocument(anotherDoc)).not.toThrow()
})
})

describe('render', () => {
beforeEach(() => {
annotationLayer.setDocument(pdfDocument)
})

it('renders at scale 1', () => {
expect(() => annotationLayer.render(1, 1.0)).not.toThrow()
})

it('renders at different scales', () => {
expect(() => annotationLayer.render(1, 0.5)).not.toThrow()
expect(() => annotationLayer.render(1, 2.0)).not.toThrow()
})
})

describe('resize', () => {
it('accepts new dimensions', () => {
expect(() => annotationLayer.resize(1024, 768)).not.toThrow()
})
})

describe('activate/deactivate', () => {
it('activates layer', () => {
annotationLayer.activate()
expect(annotationLayer.isActive()).toBe(true)
})

it('deactivates layer', () => {
annotationLayer.activate()
annotationLayer.deactivate()
expect(annotationLayer.isActive()).toBe(false)
})
})

describe('annotation operations', () => {
it('getAnnotations returns array', () => {
expect(Array.isArray(annotationLayer.getAnnotations(1))).toBe(true)
})

it('addAnnotation creates annotation', () => {
const annotation = annotationLayer.addAnnotation({
pageNumber: 1,
type: 'Text',
bounds: { x: 100, y: 100, width: 50, height: 50 },
})
expect(annotation).toHaveProperty('id')
expect(annotation.pageNumber).toBe(1)
})

it('getAnnotationById returns annotation', () => {
const annotation = annotationLayer.addAnnotation({
pageNumber: 1,
type: 'Text',
bounds: { x: 100, y: 100, width: 50, height: 50 },
})
const found = annotationLayer.getAnnotationById(annotation.id)
expect(found).toBeDefined()
expect(found?.id).toBe(annotation.id)
})

it('removeAnnotation removes annotation', () => {
const annotation = annotationLayer.addAnnotation({
pageNumber: 1,
type: 'Text',
bounds: { x: 100, y: 100, width: 50, height: 50 },
})
annotationLayer.removeAnnotation(annotation.id)
expect(annotationLayer.getAnnotationById(annotation.id)).toBeUndefined()
})

it('updateAnnotation updates annotation', () => {
const annotation = annotationLayer.addAnnotation({
pageNumber: 1,
type: 'Text',
bounds: { x: 100, y: 100, width: 50, height: 50 },
})
expect(() => annotationLayer.updateAnnotation(annotation.id, { contents: 'Updated' })).not.toThrow()
})
})

describe('selection', () => {
it('getSelectedAnnotation returns undefined when no selection', () => {
expect(annotationLayer.getSelectedAnnotation()).toBeUndefined()
})

it('selectAnnotation selects annotation', () => {
const annotation = annotationLayer.addAnnotation({
pageNumber: 1,
type: 'Text',
bounds: { x: 100, y: 100, width: 50, height: 50 },
})
annotationLayer.selectAnnotation(annotation.id)
expect(annotationLayer.getSelectedAnnotation()?.id).toBe(annotation.id)
})

it('deselectAnnotation deselects annotation', () => {
const annotation = annotationLayer.addAnnotation({
pageNumber: 1,
type: 'Text',
bounds: { x: 100, y: 100, width: 50, height: 50 },
})
annotationLayer.selectAnnotation(annotation.id)
annotationLayer.deselectAnnotation()
expect(annotationLayer.getSelectedAnnotation()).toBeUndefined()
})
})

describe('events', () => {
it('onAnnotationAdd returns unsubscribe function', () => {
const unsubscribe = annotationLayer.onAnnotationAdd(() => {})
expect(typeof unsubscribe).toBe('function')
unsubscribe()
})

it('onAnnotationRemove returns unsubscribe function', () => {
const unsubscribe = annotationLayer.onAnnotationRemove(() => {})
expect(typeof unsubscribe).toBe('function')
unsubscribe()
})

it('onAnnotationSelect returns unsubscribe function', () => {
const unsubscribe = annotationLayer.onAnnotationSelect(() => {})
expect(typeof unsubscribe).toBe('function')
unsubscribe()
})

it('onAnnotationAdd callback is called', () => {
const callback = vi.fn()
annotationLayer.onAnnotationAdd(callback)

annotationLayer.addAnnotation({
pageNumber: 1,
type: 'Text',
bounds: { x: 100, y: 100, width: 50, height: 50 },
})

expect(callback).toHaveBeenCalled()
})
})

describe('destroy', () => {
it('removes layer from container', () => {
annotationLayer.destroy()
const layer = container.querySelector('[class*="annotation-layer"]')
expect(layer).toBeNull()
})

it('handles multiple destroy calls', () => {
expect(() => {
annotationLayer.destroy()
annotationLayer.destroy()
}).not.toThrow()
})
})
})
