const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504]

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function fetchWithRetry(url, options = {}, config = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    backoffMultiplier = 2,
    timeout = 30000
  } = config

  let lastError

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) return response

      if (!RETRYABLE_STATUS_CODES.includes(response.status)) {
        return response
      }

      lastError = new Error(`HTTP ${response.status}`)

      const retryAfter = response.headers.get('Retry-After')
      if (retryAfter && attempt < maxRetries) {
        const waitMs = parseInt(retryAfter, 10) * 1000 || initialDelay * Math.pow(backoffMultiplier, attempt)
        await sleep(waitMs)
        continue
      }
    } catch (err) {
      clearTimeout(timeoutId)
      lastError = err.name === 'AbortError'
        ? new Error('La solicitud agoto el tiempo de espera')
        : err
    }

    if (attempt < maxRetries) {
      const delay = initialDelay * Math.pow(backoffMultiplier, attempt)
      await sleep(delay)
    }
  }

  throw lastError
}
