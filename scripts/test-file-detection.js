/**
 * Test script for file type detection
 * Tests the detection of PDF, CSV, PPT, PPTX, TXT, and JSON files
 */

// Mock the file type detection function for testing
function detectFileType(filename, content) {
  const extension = filename.toLowerCase().split('.').pop() || ''
  
  // Extension-based detection
  const extensionMap = {
    'pdf': 'application/pdf',
    'csv': 'text/csv',
    'json': 'application/json',
    'txt': 'text/plain',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'ppt': 'application/vnd.ms-powerpoint',
  }

  let mimeType = extensionMap[extension] || 'application/octet-stream'
  
  // Content-based detection if content is provided
  if (content) {
    const buffer = typeof content === 'string' ? Buffer.from(content, 'binary') : content
    
    // PDF signature check
    if (buffer.length >= 4 && buffer.subarray(0, 4).toString('hex') === '25504446') {
      mimeType = 'application/pdf'
    }
    
    // ZIP signature check (PPTX)
    else if (buffer.length >= 4 && buffer.subarray(0, 4).toString('hex') === '504b0304') {
      const zipContent = buffer.toString('binary', 0, Math.min(2000, buffer.length))
      if (zipContent.includes('presentationml/')) {
        mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      }
    }
    
    // Old PPT format
    else if (buffer.length >= 8 && buffer.subarray(0, 8).toString('hex') === 'd0cf11e0a1b11ae1') {
      mimeType = 'application/vnd.ms-powerpoint'
    }
    
    // JSON check
    else if (isValidJSON(buffer)) {
      mimeType = 'application/json'
    }
    
    // CSV check
    else if (isValidCSV(buffer)) {
      mimeType = 'text/csv'
    }
    
    // Text check
    else if (isValidText(buffer)) {
      mimeType = 'text/plain'
    }
  }

  return {
    mimeType,
    extension,
    isText: ['csv', 'json', 'txt'].includes(extension),
    isBinary: !['csv', 'json', 'txt'].includes(extension)
  }
}

function isValidJSON(buffer) {
  try {
    const content = buffer.toString('utf8').trim()
    if (!content || (!content.startsWith('{') && !content.startsWith('['))) return false
    JSON.parse(content)
    return true
  } catch {
    return false
  }
}

function isValidCSV(buffer) {
  try {
    const content = buffer.toString('utf8').trim()
    if (!content) return false
    const lines = content.split('\n').filter(line => line.trim().length > 0)
    if (lines.length < 1) return false
    const firstLine = lines[0].trim()
    return firstLine.includes(',') || firstLine.includes(';')
  } catch {
    return false
  }
}

function isValidText(buffer) {
  try {
    const content = buffer.toString('utf8').trim()
    if (!content) return false
    if (content.startsWith('{') || content.startsWith('[') || content.startsWith('<')) return false
    return true
  } catch {
    return false
  }
}

// Test cases
const testCases = [
  {
    name: 'PDF file',
    filename: 'document.pdf',
    content: Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n', 'binary'),
    expected: 'application/pdf'
  },
  {
    name: 'CSV file',
    filename: 'data.csv',
    content: Buffer.from('Name,Age,City\nJohn,25,New York\nJane,30,London\n', 'utf8'),
    expected: 'text/csv'
  },
  {
    name: 'JSON file',
    filename: 'config.json',
    content: Buffer.from('{"name": "test", "value": 123}', 'utf8'),
    expected: 'application/json'
  },
  {
    name: 'TXT file',
    filename: 'readme.txt',
    content: Buffer.from('This is a plain text file.\nIt contains multiple lines.\n', 'utf8'),
    expected: 'text/plain'
  },
  {
    name: 'PPTX file (ZIP signature)',
    filename: 'presentation.pptx',
    content: Buffer.from('PK\x03\x04\x14\x00\x00\x00\x08\x00', 'binary'),
    expected: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  },
  {
    name: 'PPT file (old format)',
    filename: 'presentation.ppt',
    content: Buffer.from('\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1', 'binary'),
    expected: 'application/vnd.ms-powerpoint'
  }
]

// Run tests
console.log('🧪 Testing File Type Detection\n')

let passed = 0
let total = testCases.length

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`)
  
  const result = detectFileType(testCase.filename, testCase.content)
  
  console.log(`  Filename: ${testCase.filename}`)
  console.log(`  Expected: ${testCase.expected}`)
  console.log(`  Detected: ${result.mimeType}`)
  console.log(`  Extension: ${result.extension}`)
  console.log(`  Is Text: ${result.isText}`)
  
  if (result.mimeType === testCase.expected) {
    console.log(`  ✅ PASSED\n`)
    passed++
  } else {
    console.log(`  ❌ FAILED\n`)
  }
})

console.log(`\n📊 Results: ${passed}/${total} tests passed`)

if (passed === total) {
  console.log('🎉 All tests passed! File type detection is working correctly.')
} else {
  console.log('⚠️  Some tests failed. Please review the file type detection logic.')
}
