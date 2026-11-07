# AppPartidos

Calendario de partidos deportivos con frontend Vue 3, API Express y almacenamiento persistente en Vercel Blob al desplegar.

## Desarrollo local

Se necesitan Node.js 22 o superior y npm. Instala las dependencias de las dos aplicaciones:

```powershell
cd appPartidos
npm install

cd ..\server
npm install
```

Inicia la API y el frontend en terminales separadas:

```powershell
# Terminal 1, desde server/
npm start

# Terminal 2, desde appPartidos/
npm run dev
```

Vite reenvía las peticiones `/api` a Express en `http://localhost:3001`. En local, los partidos se guardan en `server/data/partidos.json`.

## Rutas

- `/`: calendario de viernes, sábados y domingos de la temporada.
- `/admin`: formulario de gestión, sin enlace visible en el calendario.
- `GET /api/partidos`: consulta los partidos.
- `POST /api/partidos`: crea o actualiza por deporte, fecha y horario.
- `DELETE /api/partidos`: elimina por deporte y fecha.

## Despliegue en Vercel

El archivo `vercel.json` compila `appPartidos/` como sitio estático y `server/index.js` como función Node. Conecta un almacén **Vercel Blob privado** al proyecto para que Vercel configure el acceso de lectura y escritura (OIDC/`BLOB_STORE_ID`); fuera de Vercel puedes configurar `BLOB_READ_WRITE_TOKEN` para usar el mismo almacenamiento. En producción, la API falla explícitamente si Blob no está configurado: no intenta escribir en el sistema de archivos efímero.

Los partidos se guardan como `app-partidos/partidos.json` en Blob. La API lee y escribe el archivo con el SDK autenticado de Vercel Blob y `access: 'private'`. El JSON local existente sirve como contenido inicial cuando todavía no se ha creado ese blob.

> `/admin` no está enlazada desde el calendario, pero la ruta por sí sola no autentica al administrador. Antes de usar datos reales en un sitio público, protege las operaciones de escritura con autenticación.
