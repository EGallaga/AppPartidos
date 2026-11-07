const express = require('express')
const fs = require('node:fs/promises')
const path = require('node:path')

const app = express()
const DATA_FILE = path.join(__dirname, 'data', 'partidos.json')
const BLOB_PATH = 'app-partidos/partidos.json'
const SPORTS = new Set([
  'futbol',
  'baloncesto',
  'waterpolo',
  'waterpolo infantil',
  'baile moderno',
])

app.use(express.json({ limit: '20kb' }))

function usesBlobStorage() {
  return process.env.VERCEL === '1' || Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

function normalizePartido(partido) {
  return {
    deporte: String(partido.deporte || '').trim().toLocaleLowerCase('es-ES'),
    fecha: String(partido.fecha || '').trim(),
    horario: String(partido.horario || partido.hora || '').trim(),
    lugar: String(partido.lugar || '').trim(),
    casa: partido.casa,
    acude: partido.acude !== false,
    resultado: String(partido.resultado || '').trim(),
  }
}

function normalizeData(data) {
  const partidos = Array.isArray(data) ? data : data?.partidos
  if (!Array.isArray(partidos)) {
    throw new Error('El archivo de partidos no tiene un formato válido.')
  }
  return { partidos: partidos.map(normalizePartido) }
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

async function readLocalData() {
  const contents = await fs.readFile(DATA_FILE, 'utf8')
  return normalizeData(JSON.parse(contents))
}

async function readBlobData() {
  const { get } = await import('@vercel/blob')
  const blob = await get(BLOB_PATH, { access: 'private', useCache: false })
  if (!blob) return readLocalData()

  if (blob.statusCode !== 200 || !blob.stream) {
    throw new Error(`No se pudo leer el archivo de partidos en Blob (${blob.statusCode}).`)
  }

  const reader = blob.stream.getReader()
  const chunks = []
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  return normalizeData(JSON.parse(Buffer.concat(chunks).toString('utf8')))
}

async function readData() {
  return usesBlobStorage() ? readBlobData() : readLocalData()
}

async function writeData(data) {
  const normalized = normalizeData(data)
  if (usesBlobStorage()) {
    const { put } = await import('@vercel/blob')
    await put(BLOB_PATH, JSON.stringify(normalized, null, 2), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
      contentType: 'application/json',
    })
    return
  }

  await fs.writeFile(DATA_FILE, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8')
}

function validatePartido(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return 'El cuerpo debe contener los datos del partido.'
  }
  const partido = normalizePartido(input)
  if (!SPORTS.has(partido.deporte)) return 'Selecciona un deporte válido.'
  if (!isValidDate(partido.fecha)) return 'La fecha no es válida.'
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(partido.horario)) {
    return 'La hora debe tener el formato HH:mm.'
  }
  if (!partido.lugar || partido.lugar.length > 120) {
    return 'El lugar es obligatorio y no puede superar 120 caracteres.'
  }
  if (typeof input.casa !== 'boolean') return 'Indica si el partido es en casa o fuera.'
  if (input.acude !== undefined && typeof input.acude !== 'boolean') {
    return 'Indica si se acude al partido.'
  }
  if (partido.resultado.length > 40) return 'El resultado no puede superar 40 caracteres.'
  return null
}

function sortPartidos(partidos) {
  return [...partidos].sort(
    (first, second) =>
      first.fecha.localeCompare(second.fecha) || first.horario.localeCompare(second.horario),
  )
}

app.get('/api/partidos', async (req, res, next) => {
  try {
    const data = await readData()
    res.json({ partidos: sortPartidos(data.partidos) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/partidos', async (req, res, next) => {
  const validationError = validatePartido(req.body)
  if (validationError) return res.status(400).json({ error: validationError })

  try {
    const partido = normalizePartido(req.body)
    const data = await readData()
    const existingIndex = data.partidos.findIndex(
      (item) => item.deporte === partido.deporte && item.fecha === partido.fecha,
    )
    const updated = existingIndex !== -1
    if (updated) data.partidos[existingIndex] = partido
    else data.partidos.push(partido)

    await writeData(data)
    res.status(updated ? 200 : 201).json({
      message: updated ? 'Partido actualizado correctamente.' : 'Partido guardado correctamente.',
      partido,
    })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/partidos', async (req, res, next) => {
  const deporte = String(req.body?.deporte || '').trim().toLocaleLowerCase('es-ES')
  const fecha = String(req.body?.fecha || '').trim()
  if (!SPORTS.has(deporte)) return res.status(400).json({ error: 'Selecciona un deporte válido.' })
  if (!isValidDate(fecha)) return res.status(400).json({ error: 'La fecha no es válida.' })

  try {
    const data = await readData()
    const remaining = data.partidos.filter(
      (partido) => partido.deporte !== deporte || partido.fecha !== fecha,
    )
    const deleted = data.partidos.length - remaining.length
    if (deleted) await writeData({ partidos: remaining })

    res.json({
      deleted,
      message: deleted
        ? `Se borraron ${deleted} partido(s).`
        : 'No había partidos de ese deporte en esa fecha.',
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api', (req, res) => {
  res.json({ message: 'API de AppPartidos' })
})

app.use((error, req, res, next) => {
  console.error('Error en la API de partidos:', error)
  if (res.headersSent) return next(error)
  res.status(500).json({ error: 'No se pudo acceder a los partidos. Inténtalo de nuevo.' })
})

if (require.main === module) {
  const port = process.env.PORT || 3001
  app.listen(port, () => {
    console.log(`API de AppPartidos escuchando en el puerto ${port}`)
  })
}

module.exports = app
