/**
 * File type detection utilities
 * Detects MIME types based on file extension and content analysis
 */

export interface FileTypeInfo {
  mimeType: string
  extension: string
  isText: boolean
  isBinary: boolean
}

/**
 * Detect file type based on filename and content
 */
export function detectFileType(filename: string, content?: Buffer | string): FileTypeInfo {
  const extension = filename.toLowerCase().split('.').pop() || ''
  
  // First, try to detect based on file extension
  const extensionMap: Record<string, string> = {
    // PDF files
    'pdf': 'application/pdf',
    
    // CSV files
    'csv': 'text/csv',
    
    // JSON files
    'json': 'application/json',
    
    // Excel files
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel',
    
    // Word documents
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    
    // PowerPoint files
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'ppt': 'application/vnd.ms-powerpoint',
    
    // Text files
    'txt': 'text/plain',
    'log': 'text/plain',
    
    // Image files
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    
    // Archive files
    'zip': 'application/zip',
    'rar': 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',
    
    // Web files
    'html': 'text/html',
    'htm': 'text/html',
    'xml': 'application/xml',
  }

  let mimeType = extensionMap[extension] || 'application/octet-stream'
  let isText = false
  let isBinary = true

  // If we have content, try to detect based on content analysis
  if (content) {
    const contentType = detectContentType(content)
    if (contentType !== 'application/octet-stream') {
      mimeType = contentType
    }
    
    // Determine if it's text or binary
    isText = isTextContent(content)
    isBinary = !isText
  } else {
    // If no content, assume text for known text types
    isText = ['csv', 'json', 'txt', 'log', 'html', 'htm', 'xml'].includes(extension)
    isBinary = !isText
  }

  return {
    mimeType,
    extension,
    isText,
    isBinary
  }
}

/**
 * Detect content type based on file content analysis
 */
function detectContentType(content: Buffer | string): string {
  const buffer = typeof content === 'string' ? Buffer.from(content, 'binary') : content
  
  // Check for PDF signature (%PDF)
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString('hex') === '25504446') {
    return 'application/pdf'
  }
  
  // Check for ZIP signature (PK\x03\x04) - used by PPTX, DOCX, XLSX
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString('hex') === '504b0304') {
    // Check if it's an Office document by looking for specific files in the ZIP
    try {
      const zipContent = buffer.toString('binary', 0, Math.min(2000, buffer.length))
      if (zipContent.includes('[Content_Types].xml')) {
        if (zipContent.includes('presentationml/')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        if (zipContent.includes('word/')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        if (zipContent.includes('spreadsheetml/')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    } catch (e) {
      // If we can't parse the ZIP content, assume it's a regular ZIP
    }
    return 'application/zip'
  }
  
  // Check for old PowerPoint format (PPT) - D0 CF 11 E0 A1 B1 1A E1
  if (buffer.length >= 8 && buffer.subarray(0, 8).toString('hex') === 'd0cf11e0a1b11ae1') {
    return 'application/vnd.ms-powerpoint'
  }
  
  // Check for JSON
  if (isValidJSON(buffer)) {
    return 'application/json'
  }
  
  // Check for CSV
  if (isValidCSV(buffer)) {
    return 'text/csv'
  }
  
  // Check for plain text
  if (isValidText(buffer)) {
    return 'text/plain'
  }
  
  // Check for XML
  if (isValidXML(buffer)) {
    return 'application/xml'
  }
  
  return 'application/octet-stream'
}

/**
 * Check if content is text-based
 */
function isTextContent(content: Buffer | string): boolean {
  const buffer = typeof content === 'string' ? Buffer.from(content, 'binary') : content
  
  // Check if the buffer contains mostly printable ASCII characters
  let printableCount = 0
  const sampleSize = Math.min(1000, buffer.length)
  
  for (let i = 0; i < sampleSize; i++) {
    const byte = buffer[i]
    // Check if byte is printable ASCII or common whitespace
    if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
      printableCount++
    }
  }
  
  const printableRatio = printableCount / sampleSize
  return printableRatio > 0.8 // 80% of characters should be printable
}

/**
 * Check if content is valid JSON
 */
function isValidJSON(buffer: Buffer): boolean {
  try {
    const content = buffer.toString('utf8').trim()
    if (!content) return false
    
    // Check if it starts with { or [
    if (!content.startsWith('{') && !content.startsWith('[')) return false
    
    JSON.parse(content)
    return true
  } catch {
    return false
  }
}

/**
 * Check if content is valid CSV
 */
function isValidCSV(buffer: Buffer): boolean {
  try {
    const content = buffer.toString('utf8').trim()
    if (!content) return false
    
    const lines = content.split('\n').filter(line => line.trim().length > 0)
    
    // Check if we have at least 1 line and it contains commas or semicolons
    if (lines.length < 1) return false
    
    const firstLine = lines[0].trim()
    if (!firstLine.includes(',') && !firstLine.includes(';')) return false
    
    // Check if most lines have similar delimiter counts
    const delimiter = firstLine.includes(',') ? ',' : ';'
    const delimiterCounts = lines.slice(0, Math.min(10, lines.length)).map(line => 
      (line.match(new RegExp(`\\${delimiter}`, 'g')) || []).length
    )
    
    if (delimiterCounts.length === 0) return false
    
    const avgDelimiters = delimiterCounts.reduce((a, b) => a + b, 0) / delimiterCounts.length
    const consistent = delimiterCounts.every(count => Math.abs(count - avgDelimiters) <= 2)
    
    return consistent
  } catch {
    return false
  }
}

/**
 * Check if content is valid plain text
 */
function isValidText(buffer: Buffer): boolean {
  try {
    const content = buffer.toString('utf8').trim()
    if (!content) return false
    
    // Check if it's mostly printable text
    const printableRatio = isTextContent(buffer)
    if (!printableRatio) return false
    
    // Check if it doesn't look like other structured formats
    if (content.startsWith('{') || content.startsWith('[')) return false // JSON
    if (content.startsWith('<')) return false // XML/HTML
    if (content.includes(',') && content.split('\n').length > 1) return false // CSV
    
    // Check if it has reasonable line lengths (not too long)
    const lines = content.split('\n')
    const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length
    if (avgLineLength > 200) return false // Probably not plain text
    
    return true
  } catch {
    return false
  }
}

/**
 * Check if content is valid XML
 */
function isValidXML(buffer: Buffer): boolean {
  try {
    const content = buffer.toString('utf8')
    // Simple XML validation - check for opening and closing tags
    const trimmed = content.trim()
    return trimmed.startsWith('<') && trimmed.includes('>') && trimmed.includes('</')
  } catch {
    return false
  }
}
