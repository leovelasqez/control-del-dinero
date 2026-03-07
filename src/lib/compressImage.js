const MAX_DIMENSION = 1200
const JPEG_QUALITY = 0.7

export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img
      const maxSide = Math.max(width, height)

      if (maxSide > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / maxSide
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
      const base64 = dataUrl.split(',')[1]

      resolve({
        base64,
        mediaType: 'image/jpeg',
        originalSize: file.size,
        compressedSize: Math.round(base64.length * 0.75)
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Error al cargar la imagen para compresion'))
    }

    img.src = url
  })
}
