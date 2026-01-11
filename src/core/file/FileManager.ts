/**
 * FileManager - PDF file load/save operations
 * @module core/file/FileManager
 *
 * Handles loading PDFs from various sources and saving with File System Access API.
 */

import type { FileManagerInterface } from '../../types.js'
import { hasFileSystemAccess, downloadBlob } from '../../helpers.js'
import { PDF_MIME_TYPE, PDF_FILE_PICKER_ACCEPT } from '../../constants.js'

// Extend Window interface for File System Access API
declare global {
	interface Window {
		showSaveFilePicker?: (options?: {
			suggestedName?: string
			types?: ReadonlyArray<{
				description: string
				accept: Record<string, readonly string[]>
			}>
		}) => Promise<FileSystemFileHandle>
	}
}

/**
 * FileManager - Manages PDF file operations
 *
 * @remarks
 * Uses File System Access API when available for native save dialogs.
 * Falls back to download links for older browsers.
 */
export class FileManager implements FileManagerInterface {
	async loadFile(file: File): Promise<ArrayBuffer> {
		return file.arrayBuffer()
	}

	async loadUrl(url: string): Promise<ArrayBuffer> {
		const response = await fetch(url)
		if (!response.ok) {
			throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`)
		}
		return response.arrayBuffer()
	}

	async save(
		data: ArrayBuffer,
		handle?: FileSystemFileHandle,
	): Promise<FileSystemFileHandle | undefined> {
		if (!handle) {
			return undefined
		}

		if (!hasFileSystemAccess()) {
			return undefined
		}

		const writable = await handle.createWritable()
		await writable.write(data)
		await writable.close()
		return handle
	}

	async saveAs(
		data: ArrayBuffer,
		suggestedName: string,
	): Promise<FileSystemFileHandle | undefined> {
		if (!hasFileSystemAccess() || !window.showSaveFilePicker) {
			// Fallback to download
			this.download(data, suggestedName)
			return undefined
		}

		const handle = await window.showSaveFilePicker({
			suggestedName,
			types: [PDF_FILE_PICKER_ACCEPT],
		})

		const writable = await handle.createWritable()
		await writable.write(data)
		await writable.close()

		return handle
	}

	download(data: ArrayBuffer, fileName: string): void {
		downloadBlob(data, fileName, PDF_MIME_TYPE)
	}
}
