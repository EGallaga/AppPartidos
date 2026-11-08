<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { deletePartidos, getPartidos, savePartido } from '@/services/partidos'

const sports = ['futbol', 'baloncesto', 'waterpolo', 'waterpolo infantil', 'baile moderno']
const today = new Date()
const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60_000)
const todayIso = localToday.toISOString().slice(0, 10)

const form = reactive({
  deporte: sports[0],
  fecha: todayIso,
  horario: '',
  rival: '',
  lugar: '',
  casa: true,
  acude: true,
  resultado: '',
})
const deleteForm = reactive({ deporte: sports[0], fecha: todayIso })
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const editing = ref(false)
const partidos = ref([])
const partidosActualesYFuturos = computed(() =>
  partidos.value.filter((partido) => partido.fecha >= todayIso),
)
const error = ref('')
const message = ref('')

async function refreshPartidos() {
  const response = await getPartidos()
  partidos.value = response.partidos
}

async function submitPartido() {
  error.value = ''
  message.value = ''
  saving.value = true

  try {
    const response = await savePartido({ ...form })
    message.value = response.message
    form.horario = ''
    form.rival = ''
    form.lugar = ''
    form.resultado = ''
    form.acude = true
    editing.value = false
    await refreshPartidos()
  } catch (requestError) {
    error.value = requestError.message
  } finally {
    saving.value = false
  }
}

function editPartido(partido) {
  Object.assign(form, partido, { acude: partido.acude !== false })
  editing.value = true
}

function cancelEdit() {
  editing.value = false
  form.horario = ''
  form.rival = ''
  form.lugar = ''
  form.resultado = ''
  form.acude = true
}

async function submitDelete() {
  error.value = ''
  message.value = ''
  if (!window.confirm(`¿Borrar todos los partidos de ${deleteForm.deporte} del ${deleteForm.fecha}?`)) {
    return
  }

  deleting.value = true
  try {
    const response = await deletePartidos({ ...deleteForm })
    message.value = response.message
    await refreshPartidos()
  } catch (requestError) {
    error.value = requestError.message
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  try {
    await refreshPartidos()
  } catch (requestError) {
    error.value = requestError.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="page-shell admin-page">
    <header class="admin-header">
      <div>
        <p class="eyebrow">Gestión de la temporada</p>
        <h1 class="page-title">Administrar partidos</h1>
        <p class="page-description">Añade encuentros al calendario o elimina los de un día.</p>
      </div>
      <RouterLink class="text-link" to="/">← Volver al calendario</RouterLink>
    </header>

    <p v-if="error" class="notice" role="alert">{{ error }}</p>
    <p v-if="message" class="notice notice--success" role="status">{{ message }}</p>

    <div class="admin-grid">
      <section class="form-panel">
        <div class="panel-heading">
          <span class="panel-icon" aria-hidden="true">＋</span>
          <div>
            <h2>{{ editing ? 'Editar partido' : 'Nuevo partido' }}</h2>
            <p v-if="editing">
              Deporte y fecha identifican el partido y no se pueden modificar aquí.
            </p>
            <p v-else>Si ya existe el mismo deporte y fecha, se actualizará.</p>
          </div>
        </div>

        <form class="admin-form" @submit.prevent="submitPartido">
          <label>
            <span class="field-label">Deporte</span>
            <select v-model="form.deporte" class="field-control" :disabled="editing" required>
              <option v-for="sport in sports" :key="sport" :value="sport">{{ sport }}</option>
            </select>
          </label>

          <div class="form-row">
            <label>
              <span class="field-label">Fecha</span>
              <input
                v-model="form.fecha"
                class="field-control"
                type="date"
                :disabled="editing"
                required
              />
            </label>
            <label>
              <span class="field-label">Hora de inicio <span class="optional">(opcional)</span></span>
              <input
                v-model="form.horario"
                class="field-control"
                type="time"
              />
            </label>
          </div>

          <label>
            <span class="field-label">Rival <span class="optional">(opcional)</span></span>
            <input
              v-model.trim="form.rival"
              class="field-control"
              type="text"
              maxlength="120"
              placeholder="Nombre del equipo rival"
            />
          </label>

          <label>
            <span class="field-label">Lugar</span>
            <input
              v-model.trim="form.lugar"
              class="field-control"
              type="text"
              maxlength="120"
              placeholder="Nombre del sitio"
              required
            />
          </label>

          <label class="checkbox-row">
            <input v-model="form.casa" type="checkbox" />
            <span class="checkbox-custom" aria-hidden="true"></span>
            <span>Partido en casa</span>
          </label>

          <label class="checkbox-row">
            <input v-model="form.acude" type="checkbox" />
            <span class="checkbox-custom" aria-hidden="true"></span>
            <span>Acude al partido</span>
          </label>

          <label>
            <span class="field-label">Resultado <span class="optional">(opcional)</span></span>
            <input
              v-model.trim="form.resultado"
              class="field-control"
              type="text"
              maxlength="40"
              placeholder="Ej. 3 - 1"
            />
          </label>

          <div class="form-actions">
            <button class="primary-button submit-button" type="submit" :disabled="saving">
              {{ saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Guardar partido' }}
              <span aria-hidden="true">→</span>
            </button>
            <button
              v-if="editing"
              class="cancel-button"
              type="button"
              :disabled="saving"
              @click="cancelEdit"
            >
              Cancelar
            </button>
          </div>
        </form>
      </section>

      <aside class="side-column">
        <section class="form-panel delete-panel">
          <div class="panel-heading">
            <span class="panel-icon panel-icon--delete" aria-hidden="true">−</span>
            <div>
              <h2>Borrar partidos del día</h2>
              <p>Elimina todos los partidos del deporte elegido en esa fecha.</p>
            </div>
          </div>

          <form class="admin-form" @submit.prevent="submitDelete">
            <label>
              <span class="field-label">Deporte</span>
              <select v-model="deleteForm.deporte" class="field-control" required>
                <option v-for="sport in sports" :key="sport" :value="sport">{{ sport }}</option>
              </select>
            </label>
            <label>
              <span class="field-label">Fecha</span>
              <input v-model="deleteForm.fecha" class="field-control" type="date" required />
            </label>
            <button class="secondary-button" type="submit" :disabled="deleting">
              {{ deleting ? 'Borrando…' : 'Borrar partidos' }}
            </button>
          </form>
        </section>

        <section class="matches-panel">
          <div class="matches-panel__heading">
            <h2>Partidos cargados</h2>
            <span>{{ partidosActualesYFuturos.length }}</span>
          </div>
          <p v-if="loading" class="panel-empty">Cargando partidos…</p>
          <p v-else-if="!partidosActualesYFuturos.length" class="panel-empty">
            No hay partidos con fecha actual o futura.
          </p>
          <ul v-else class="loaded-list">
            <li
              v-for="partido in partidosActualesYFuturos"
              :key="`${partido.fecha}-${partido.deporte}`"
            >
              <div>
                <strong>{{ partido.deporte }}</strong>
                <span>{{ partido.fecha }} · {{ partido.horario || 'Hora pendiente' }}</span>
              </div>
              <div class="loaded-actions">
                <span class="loaded-place">{{ partido.lugar }}</span>
                <button class="edit-button" type="button" @click="editPartido(partido)">
                  Editar
                </button>
              </div>
            </li>
          </ul>
        </section>
      </aside>
    </div>

    <p class="admin-note notice notice--info">
      Esta pantalla se abre desde <code>/admin</code>; no aparece enlazada en el calendario.
    </p>
  </main>
</template>

<style scoped>
.admin-page {
  max-width: 1000px;
  padding-top: 54px;
}

.admin-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 30px;
}

.admin-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(310px, 0.9fr);
  align-items: start;
  gap: 18px;
}

.form-panel,
.matches-panel {
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: 17px;
  background: var(--surface);
  box-shadow: 0 5px 20px rgb(28 43 70 / 4%);
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 22px;
}

.panel-icon {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 10px;
  color: #315be8;
  background: #edf1ff;
  font-size: 1.3rem;
}

.panel-icon--delete {
  color: #b5473e;
  background: #fff0ee;
}

.panel-heading h2,
.matches-panel__heading h2 {
  margin: 0;
  color: #243047;
  font-size: 1.05rem;
  font-weight: 750;
}

.panel-heading p {
  margin: 6px 0 0;
  color: #7a8698;
  font-size: 0.81rem;
  line-height: 1.45;
}

.admin-form {
  display: grid;
  gap: 17px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.optional {
  color: #98a2b1;
  font-weight: 450;
}

.checkbox-row {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 10px;
  color: #38455a;
  font-size: 0.89rem;
  font-weight: 600;
  cursor: pointer;
}

.checkbox-row input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.checkbox-custom {
  display: grid;
  width: 19px;
  height: 19px;
  place-items: center;
  border: 1px solid #c9d2df;
  border-radius: 5px;
  background: white;
}

.checkbox-row input:checked + .checkbox-custom {
  border-color: var(--accent);
  background: var(--accent);
}

.checkbox-row input:checked + .checkbox-custom::after {
  width: 8px;
  height: 5px;
  border-bottom: 2px solid white;
  border-left: 2px solid white;
  content: "";
  transform: rotate(-45deg) translate(1px, -1px);
}

.checkbox-row input:focus-visible + .checkbox-custom {
  outline: 3px solid rgb(49 91 232 / 22%);
}

.form-actions {
  display: grid;
  gap: 8px;
  margin-top: 3px;
}

.submit-button {
  width: 100%;
}

.cancel-button,
.edit-button {
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid #dce3ed;
  border-radius: 9px;
  color: #526078;
  background: white;
  font-size: 0.8rem;
  font-weight: 650;
}

.cancel-button:hover:not(:disabled),
.edit-button:hover {
  background: #f5f7fa;
}

.cancel-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.side-column {
  display: grid;
  gap: 16px;
}

.secondary-button {
  min-height: 44px;
  border: 1px solid #f0c5c1;
  border-radius: 10px;
  color: #a43f37;
  background: #fff8f7;
  font-weight: 700;
}

.secondary-button:hover:not(:disabled) {
  background: #fff0ee;
}

.secondary-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.matches-panel {
  padding-bottom: 10px;
}

.matches-panel__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.matches-panel__heading > span {
  display: grid;
  min-width: 26px;
  height: 26px;
  place-items: center;
  padding: 0 7px;
  border-radius: 999px;
  color: #4258ac;
  background: #edf1ff;
  font-size: 0.75rem;
  font-weight: 750;
}

.panel-empty {
  padding: 13px 0;
  color: #8792a3;
  font-size: 0.85rem;
}

.loaded-list {
  max-height: 320px;
  overflow: auto;
  margin: 0;
  padding: 0;
  list-style: none;
}

.loaded-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid #eef1f5;
}

.loaded-list li > div {
  display: grid;
  gap: 4px;
}

.loaded-list strong {
  color: #324058;
  font-size: 0.83rem;
  text-transform: capitalize;
}

.loaded-list li span {
  color: #8792a3;
  font-size: 0.73rem;
}

.loaded-list .loaded-place {
  max-width: 110px;
  overflow: hidden;
  color: #5f6c81;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.loaded-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.admin-note {
  margin-top: 20px;
}

.admin-note code {
  font-size: 0.85em;
}

@media (max-width: 760px) {
  .admin-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
  }

  .admin-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 460px) {
  .form-panel,
  .matches-panel {
    padding: 17px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
