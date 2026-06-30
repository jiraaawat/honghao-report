export interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  type?: string
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function isValidImageFile(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type) && file.size > 0
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid image type. Allowed: jpeg, png, webp, gif' }
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Image too large. Max 5MB.' }
  }
  return { valid: true }
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.85,
    type = 'image/jpeg',
  } = options

  const validation = validateImageFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Skip compression for small images that are already JPEG/WebP under threshold.
  const skipThreshold = 300 * 1024 // 300KB
  if (file.size <= skipThreshold && (file.type === 'image/jpeg' || file.type === 'image/webp')) {
    return file
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img
      if (width > maxWidth || height > maxHeight) {
        const scale = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Unable to get canvas context'))
        return
      }

      // Draw with white background to avoid transparency issues when converting to JPEG.
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Image compression failed'))
            return
          }
          const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg'
          const compressed = new File([blob], `compressed_${Date.now()}.${ext}`, { type })
          resolve(compressed.size < file.size ? compressed : file)
        },
        type,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image for compression'))
    }

    img.src = url
  })
}
