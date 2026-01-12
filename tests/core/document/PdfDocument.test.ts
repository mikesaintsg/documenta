/**
 * Tests for PdfDocument
 * @module tests/core/document/PdfDocument
 *
 * Uses real mupdf library - no mocks. Tests run in Playwright browser environment.
 */

import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import { PdfDocument } from '~/src/core/document/PdfDocument.js'
import { loadPdfFixture, PDF_FIXTURES } from '../../setup.js'
import type { PdfDocumentInterface, PdfPageInterface } from '~/src/types.js'

describe('PdfDocument', () => {
let document: PdfDocumentInterface
let simplePdfBuffer: ArrayBuffer
let multiPagePdfBuffer: ArrayBuffer

beforeAll(async () => {
// Pre-load fixtures
simplePdfBuffer = await loadPdfFixture(PDF_FIXTURES.simple)
multiPagePdfBuffer = await loadPdfFixture(PDF_FIXTURES.multiPage)
})

beforeEach(() => {
document = new PdfDocument()
})

describe('isLoaded', () => {
it('returns false initially', () => {
expect(document.isLoaded()).toBe(false)
})

it('returns true after loading', async () => {
await document.loadFromBuffer(simplePdfBuffer, 'test.pdf')
expect(document.isLoaded()).toBe(true)
})

it('returns false after destroy', async () => {
await document.loadFromBuffer(simplePdfBuffer, 'test.pdf')
document.destroy()
expect(document.isLoaded()).toBe(false)
})
})

describe('getPageCount', () => {
it('returns 0 before loading', () => {
expect(document.getPageCount()).toBe(0)
})

it('returns correct page count for simple PDF', async () => {
await document.loadFromBuffer(simplePdfBuffer, 'test.pdf')
expect(document.getPageCount()).toBe(1)
})

it('returns correct page count for multi-page PDF', async () => {
await document.loadFromBuffer(multiPagePdfBuffer, 'test.pdf')
expect(document.getPageCount()).toBe(5)
})
})

describe('getFileName', () => {
it('returns undefined before loading', () => {
expect(document.getFileName()).toBeUndefined()
})

it('returns filename after loading', async () => {
await document.loadFromBuffer(simplePdfBuffer, 'document.pdf')
expect(document.getFileName()).toBe('document.pdf')
})

it('handles undefined filename', async () => {
await document.loadFromBuffer(simplePdfBuffer)
expect(document.getFileName()).toBeUndefined()
})
})

describe('loadFromBuffer', () => {
it('loads document from buffer', async () => {
await document.loadFromBuffer(simplePdfBuffer, 'test.pdf')
expect(document.isLoaded()).toBe(true)
})

it('sets filename', async () => {
await document.loadFromBuffer(simplePdfBuffer, 'my-doc.pdf')
expect(document.getFileName()).toBe('my-doc.pdf')
})

it('creates pages', async () => {
await document.loadFromBuffer(simplePdfBuffer, 'test.pdf')
expect(document.getPageCount()).toBeGreaterThan(0)
})

it('replaces previous document', async () => {
await document.loadFromBuffer(simplePdfBuffer, 'first.pdf')

await document.loadFromBuffer(multiPagePdfBuffer, 'second.pdf')

expect(document.getFileName()).toBe('second.pdf')
expect(document.getPageCount()).toBe(5)
})
})

describe('getPage', () => {
beforeEach(async () => {
await document.loadFromBuffer(simplePdfBuffer, 'test.pdf')
})

it('returns page for valid page number', () => {
const page = document.getPage(1)
expect(page.pageNumber).toBe(1)
})

it('throws for page number less than 1', () => {
expect(() => document.getPage(0)).toThrow()
})

it('throws for page number greater than page count', () => {
const pageCount = document.getPageCount()
expect(() => document.getPage(pageCount + 1)).toThrow()
})

it('throws when document not loaded', () => {
const unloaded = new PdfDocument()
expect(() => unloaded.getPage(1)).toThrow('No document loaded')
})

it('returns same page instance on repeated calls (caching)', () => {
const page1 = document.getPage(1)
const page1Again = document.getPage(1)
expect(page1).toBe(page1Again)
})
})

describe('getPageDimensions', () => {
beforeEach(async () => {
await document.loadFromBuffer(simplePdfBuffer, 'test.pdf')
})

it('returns width and height', () => {
const dims = document.getPageDimensions(1)
expect(dims.width).toBeGreaterThan(0)
expect(dims.height).toBeGreaterThan(0)
})

it('returns standard Letter size', () => {
const dims = document.getPageDimensions(1)
expect(dims.width).toBe(612) // 8.5 inches at 72 DPI
expect(dims.height).toBe(792) // 11 inches at 72 DPI
})
})

describe('getPageRotation', () => {
beforeEach(async () => {
await document.loadFromBuffer(simplePdfBuffer, 'test.pdf')
})

it('returns rotation value', () => {
const rotation = document.getPageRotation(1)
expect([0, 90, 180, 270]).toContain(rotation)
})

it('returns 0 for unrotated page', () => {
const rotation = document.getPageRotation(1)
expect(rotation).toBe(0)
})
})

describe('toArrayBuffer', () => {
it('throws when not loaded', () => {
expect(() => document.toArrayBuffer()).toThrow('No document loaded')
})

it('returns buffer after loading', async () => {
await document.loadFromBuffer(simplePdfBuffer, 'test.pdf')
const buffer = document.toArrayBuffer()
expect(buffer).toBeInstanceOf(ArrayBuffer)
expect(buffer.byteLength).toBeGreaterThan(0)
})
})

describe('destroy', () => {
it('sets isLoaded to false', async () => {
await document.loadFromBuffer(simplePdfBuffer, 'test.pdf')
document.destroy()
expect(document.isLoaded()).toBe(false)
})

it('sets pageCount to 0', async () => {
await document.loadFromBuffer(simplePdfBuffer, 'test.pdf')
document.destroy()
expect(document.getPageCount()).toBe(0)
})

it('handles multiple destroy calls', async () => {
await document.loadFromBuffer(simplePdfBuffer, 'test.pdf')
document.destroy()
expect(() => document.destroy()).not.toThrow()
})
})
})

describe('PdfPage', () => {
let page: PdfPageInterface
let simplePdfBuffer: ArrayBuffer

beforeAll(async () => {
simplePdfBuffer = await loadPdfFixture(PDF_FIXTURES.simple)
})

beforeEach(async () => {
const document = new PdfDocument()
await document.loadFromBuffer(simplePdfBuffer)
page = document.getPage(1)
})

describe('properties', () => {
it('has pageNumber', () => {
expect(page.pageNumber).toBe(1)
})

it('has width', () => {
expect(page.width).toBeGreaterThan(0)
})

it('has height', () => {
expect(page.height).toBeGreaterThan(0)
})

it('has rotation', () => {
expect([0, 90, 180, 270]).toContain(page.rotation)
})
})

describe('render', () => {
it('renders to canvas context', () => {
const canvas = document.createElement('canvas')
canvas.width = 612
canvas.height = 792
const ctx = canvas.getContext('2d')!

expect(() => page.render(ctx, 1.0)).not.toThrow()
})

it('respects scale parameter', () => {
const canvas = document.createElement('canvas')
canvas.width = 1224
canvas.height = 1584
const ctx = canvas.getContext('2d')!

expect(() => page.render(ctx, 2.0)).not.toThrow()
})
})

describe('getText', () => {
it('returns string', () => {
const text = page.getText()
expect(typeof text).toBe('string')
})
})

describe('getTextBlocks', () => {
it('returns array', () => {
const blocks = page.getTextBlocks()
expect(Array.isArray(blocks)).toBe(true)
})
})

describe('destroy', () => {
it('can be called without error', () => {
expect(() => page.destroy()).not.toThrow()
})
})
})
