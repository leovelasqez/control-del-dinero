import * as pdfjsLib from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

export async function extractTextFromPDF(file, password) {
  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, password: password || undefined })

  loadingTask.onPassword = (updatePassword, reason) => {
    if (reason === pdfjsLib.PasswordResponses.NEED_PASSWORD) {
      if (!password) {
        throw new Error('PASSWORD_REQUIRED')
      }
      updatePassword(password)
    } else if (reason === pdfjsLib.PasswordResponses.INCORRECT_PASSWORD) {
      throw new Error('INCORRECT_PASSWORD')
    }
  }

  let pdf
  try {
    pdf = await loadingTask.promise
  } catch (err) {
    if (err.message === 'PASSWORD_REQUIRED' || err.message === 'INCORRECT_PASSWORD') {
      throw err
    }
    if (err.name === 'PasswordException') {
      if (err.code === pdfjsLib.PasswordResponses.NEED_PASSWORD) {
        throw new Error('PASSWORD_REQUIRED')
      }
      if (err.code === pdfjsLib.PasswordResponses.INCORRECT_PASSWORD) {
        throw new Error('INCORRECT_PASSWORD')
      }
    }
    throw err
  }

  const pages = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map(item => item.str).join(' ')
    pages.push(text)
  }

  return pages.join('\n\n')
}
