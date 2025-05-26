import React, { useState } from 'react'
import { downloadFromWalrus } from '@blockchain/walrus'
import toast from 'react-hot-toast'

export function DownloadSection() {
  const [downloadBlobId, setDownloadBlobId] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadedFile, setDownloadedFile] = useState(null)

  // Handle file download
  const handleDownloadFile = async () => {
    if (!downloadBlobId) {
      toast.error('Please enter a blob ID')
      return
    }

    setIsDownloading(true)
    const toastId = toast.loading('Downloading from Walrus...')

    try {
      const data = await downloadFromWalrus(downloadBlobId)
      
      // Try to parse as JSON first (for metadata)
      let fileData, fileName, fileType
      try {
        const parsed = JSON.parse(data)
        if (parsed.fileName) {
          // This is a metadata file
          fileData = data
          fileName = `${parsed.fileName}.metadata.json`
          fileType = 'application/json'
        } else {
          // Unknown JSON structure
          fileData = data
          fileName = 'downloaded-file.json'
          fileType = 'application/json'
        }
      } catch {
        // Not JSON, treat as binary
        fileData = data
        fileName = 'downloaded-file'
        fileType = 'application/octet-stream'
      }

      // Create blob for download
      const blob = new Blob([fileData], { type: fileType })
      const url = URL.createObjectURL(blob)

      setDownloadedFile({
        url,
        fileName,
        size: blob.size,
        blobId: downloadBlobId
      })

      toast.success('File downloaded successfully!', { id: toastId })
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error(`Download failed: ${error.message}`, { id: toastId })
    } finally {
      setIsDownloading(false)
    }
  }

  // Save downloaded file
  const saveDownloadedFile = () => {
    if (!downloadedFile) return

    const a = document.createElement('a')
    a.href = downloadedFile.url
    a.download = downloadedFile.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    // Clean up
    URL.revokeObjectURL(downloadedFile.url)
    setDownloadedFile(null)
    setDownloadBlobId('')
    toast.success('File saved!')
  }

  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-medium mb-4">Download File from Walrus</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Blob ID</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={downloadBlobId}
              onChange={(e) => setDownloadBlobId(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Walrus blob ID..."
            />
            <button
              onClick={handleDownloadFile}
              disabled={isDownloading || !downloadBlobId}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
            >
              {isDownloading ? 'Downloading...' : 'Download'}
            </button>
          </div>
        </div>

        {downloadedFile && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-800">File ready for download</p>
            <p className="text-sm text-gray-600 mt-1">
              {downloadedFile.fileName} ({(downloadedFile.size / 1024).toFixed(2)} KB)
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Blob ID: {downloadedFile.blobId}
            </p>
            <button
              onClick={saveDownloadedFile}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Save File
            </button>
          </div>
        )}
      </div>
    </div>
  )
}