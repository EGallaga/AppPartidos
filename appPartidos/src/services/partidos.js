async function request(url, options) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(result.error || 'No se pudo completar la operación.')
  }

  return result
}

export function getPartidos() {
  return request('/api/partidos')
}

export function savePartido(partido) {
  return request('/api/partidos', {
    method: 'POST',
    body: JSON.stringify(partido),
  })
}

export function deletePartidos({ deporte, fecha }) {
  return request('/api/partidos', {
    method: 'DELETE',
    body: JSON.stringify({ deporte, fecha }),
  })
}
