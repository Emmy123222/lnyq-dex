#!/usr/bin/env node
/**
 * CI guard: fail if any production source file imports or references mock runtime data.
 *
 * Run: npm run check:no-mock-data
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, relative, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
const ROOT = join(__dirname, '..')
const SRC  = join(ROOT, 'src')

// Explicit file-existence check: src/data/mock.ts must not exist in production source
if (existsSync(join(SRC, 'data', 'mock.ts'))) {
  console.error('[check:no-mock-data] src/data/mock.ts exists — delete it or move to test fixtures before building.')
  process.exit(1)
}

const FORBIDDEN_PATTERNS = [
  /from\s+['"][^'"]*data\/mock['"]/,
  /from\s+['"][^'"]*\/mock['"]/,
  /require\s*\(\s*['"][^'"]*data\/mock['"]/,
  /\bCANDLES\b(?!\s*=|\s*:)/,   // usage not declaration
  /\bASKS\b(?!\s*=|\s*:|\s*OrderBookLevel)/,
  /\bBIDS\b(?!\s*=|\s*:|\s*OrderBookLevel)/,
  /\bRECENT_TRADES\b(?!\s*=|\s*:)/,
  /\bOPEN_ORDERS\b(?!\s*=|\s*:)/,
  /\bORDER_HISTORY\b(?!\s*=|\s*:)/,
  /\bLEADERBOARD\b(?!\s*=|\s*:)/,
  /\bPORTFOLIO_STATS\b(?!\s*=|\s*:)/,
  /\bHOLDINGS\b(?!\s*=|\s*:)/,
]

// Files in test/spec directories are exempt
const TEST_DIRS = ['__tests__', 'test', 'fixtures', '.test.', '.spec.']

function isTestFile(filePath) {
  return TEST_DIRS.some(d => filePath.includes(d))
}

function walk(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      files.push(...walk(full))
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
      files.push(full)
    }
  }
  return files
}

let violations = 0

for (const file of walk(SRC)) {
  if (isTestFile(file)) continue
  const content = readFileSync(file, 'utf8')
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(line)) {
        const rel = relative(ROOT, file)
        console.error(`[check:no-mock-data] ${rel}:${i + 1}  →  ${line.trim()}`)
        violations++
      }
    }
  }
}

if (violations > 0) {
  console.error(`\n✗ ${violations} mock data violation(s) found. Remove them before building.`)
  process.exit(1)
} else {
  console.log('✓ No mock runtime data found in production source.')
}
