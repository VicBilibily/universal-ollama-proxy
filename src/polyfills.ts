// Global polyfills for Node.js environment
import fetch from 'cross-fetch';

// 强制使用 cross-fetch 而不是 Node.js 内置的实验性 fetch
globalThis.fetch = fetch as any;

// Blob polyfill for Node.js
if (typeof globalThis.Blob === 'undefined') {
  const { Blob: NodeBlob } = require('buffer');
  globalThis.Blob = NodeBlob as any;
}

// Headers polyfill for Node.js
if (typeof globalThis.Headers === 'undefined') {
  const { Headers } = require('cross-fetch');
  globalThis.Headers = Headers as any;
}

// Response polyfill for Node.js
if (typeof globalThis.Response === 'undefined') {
  const { Response } = require('cross-fetch');
  globalThis.Response = Response as any;
}

// Request polyfill for Node.js
if (typeof globalThis.Request === 'undefined') {
  const { Request } = require('cross-fetch');
  globalThis.Request = Request as any;
}

// ReadableStream polyfill for Node.js (for older Node versions)
if (typeof globalThis.ReadableStream === 'undefined') {
  try {
    const { ReadableStream: NodeReadableStream } = require('stream/web');
    globalThis.ReadableStream = NodeReadableStream as any;
  } catch (error) {
    // Fallback for very old Node versions
    console.warn('ReadableStream polyfill not available');
  }
}

// WritableStream polyfill for Node.js (for older Node versions)
if (typeof globalThis.WritableStream === 'undefined') {
  try {
    const { WritableStream: NodeWritableStream } = require('stream/web');
    globalThis.WritableStream = NodeWritableStream as any;
  } catch (error) {
    // Fallback for very old Node versions
    console.warn('WritableStream polyfill not available');
  }
}

// TransformStream polyfill for Node.js (for older Node versions)
if (typeof globalThis.TransformStream === 'undefined') {
  try {
    const { TransformStream: NodeTransformStream } = require('stream/web');
    globalThis.TransformStream = NodeTransformStream as any;
  } catch (error) {
    // Fallback for very old Node versions
    console.warn('TransformStream polyfill not available');
  }
}

// TextEncoder/TextDecoder polyfills
if (typeof globalThis.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}

// FormData polyfill for Node.js
if (typeof globalThis.FormData === 'undefined') {
  try {
    const FormData = require('form-data');
    globalThis.FormData = FormData;
  } catch (error) {
    console.warn('FormData polyfill not available');
  }
}

// File and FileReader polyfills for Node.js
if (typeof globalThis.File === 'undefined') {
  globalThis.File = class File {
    constructor(chunks: any[], fileName: string, options: any = {}) {
      this.name = fileName;
      this.type = options.type || '';
      this.size = chunks.reduce((size, chunk) => size + chunk.length, 0);
    }
    name: string;
    type: string;
    size: number;
  } as any;
}
