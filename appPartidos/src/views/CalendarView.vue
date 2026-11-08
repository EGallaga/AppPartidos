<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { getPartidos } from '@/services/partidos'

const START_DATE = '2026-11-01'
const END_DATE = '2027-06-30'
const sportClasses = {
  futbol: 'sport-pill--futbol',
  baloncesto: 'sport-pill--baloncesto',
  waterpolo: 'sport-pill--waterpolo',
  'waterpolo infantil': 'sport-pill--waterpolo-infantil',
  'baile moderno': 'sport-pill--baile-moderno',
}
const partidos = ref([])
const loading = ref(true)
const error = ref('')
const weekendElements = ref([])

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const weekdayFormatter = new Intl.DateTimeFormat('es-ES', { weekday: 'long' })
const monthFormatter = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' })

function toIsoDate(date) {
  return date.toISOString().slice(0, 10)
}

function dateFromIso(date) {
  return new Date(`${date}T12:00:00`)
}

function getWeekends() {
  const start = new Date(`${START_DATE}T00:00:00Z`)
  const end = new Date(`${END_DATE}T00:00:00Z`)
  const firstFriday = new Date(start)
  firstFriday.setUTCDate(firstFriday.getUTCDate() - ((firstFriday.getUTCDay() + 2) % 7))

  const weekends = []
  for (const friday = new Date(firstFriday); friday <= end; friday.setUTCDate(friday.getUTCDate() + 7)) {
    const days = [0, 1, 2].map((offset) => {
      const date = new Date(friday)
      date.setUTCDate(date.getUTCDate() + offset)
      const iso = toIsoDate(date)
      return {
        iso,
        date: dateFromIso(iso),
        inRange: iso >= START_DATE && iso <= END_DATE,
        partidos: [],
      }
    })
    weekends.push({
      id: toIsoDate(friday),
      label: monthFormatter.format(dateFromIso(toIsoDate(friday))),
      days,
    })
  }

  return weekends
}

const weekends = computed(() => {
  const byDay = new Map()
  for (const partido of partidos.value) {
    if (!byDay.has(partido.fecha)) byDay.set(partido.fecha, [])
    byDay.get(partido.fecha).push(partido)
  }

  return getWeekends().map((weekend) => ({
    ...weekend,
    days: weekend.days.map((day) => ({
      ...day,
      partidos: (byDay.get(day.iso) || []).toSorted((a, b) =>
        a.horario.localeCompare(b.horario),
      ),
    })),
  }))
})

const currentWeekendId = computed(() => {
  const today = toIsoDate(new Date())
  if (today < START_DATE || today > END_DATE) return weekends.value[0]?.id

  const date = new Date(`${today}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 2) % 7))
  return toIsoDate(date)
})

function formatWeekday(date) {
  const weekday = weekdayFormatter.format(date)
  return weekday.charAt(0).toUpperCase() + weekday.slice(1)
}

function formatFullDate(date) {
  return dateFormatter.format(date)
}

function formatSport(sport) {
  return sport.replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase('es-ES'))
}

function sportClass(sport) {
  return sportClasses[sport] || ''
}

function elementRef(element, index) {
  if (element) weekendElements.value[index] = element
}

onMounted(async () => {
  try {
    const response = await getPartidos()
    partidos.value = response.partidos
  } catch (requestError) {
    error.value = requestError.message
  } finally {
    loading.value = false
  }

  await nextTick()
  const currentIndex = weekends.value.findIndex((weekend) => weekend.id === currentWeekendId.value)
  weekendElements.value[currentIndex]?.scrollIntoView({ block: 'start' })
})
</script>

<template>
  <main class="page-shell calendar-page">
    <header class="calendar-header">
      <div>
        <p class="eyebrow">Agenda deportiva · 2026—2027</p>
        <h1 class="page-title">Fines de semana</h1>
        <p class="page-description">
          Todos los partidos de la temporada, de noviembre a junio.
        </p>
      </div>
      <div class="season-badge" aria-label="Temporada 2026 a 2027">
        <span class="season-badge__dot"></span>
        Temporada 26/27
      </div>
    </header>

    <p v-if="error" class="notice" role="alert">
      No se pudieron cargar los partidos: {{ error }}
    </p>
    <p v-else-if="loading" class="loading-state" role="status">Cargando calendario…</p>

    <div v-else class="weekend-list">
      <section
        v-for="(weekend, index) in weekends"
        :key="weekend.id"
        :ref="(element) => elementRef(element, index)"
        class="weekend"
        :class="{ 'weekend--current': weekend.id === currentWeekendId }"
        :aria-label="`Fin de semana del ${weekend.label}`"
      >
        <header class="weekend-heading">
          <div class="weekend-heading__date">
            <span class="weekend-heading__month">{{ weekend.label }}</span>
            <span v-if="weekend.id === currentWeekendId" class="current-tag">Esta semana</span>
          </div>
          <span class="weekend-heading__line"></span>
        </header>

        <div class="days-grid">
          <article
            v-for="day in weekend.days"
            :key="day.iso"
            class="day-card"
            :class="{ 'day-card--outside': !day.inRange }"
          >
            <header class="day-card__heading">
              <div>
                <h2>{{ formatWeekday(day.date) }}</h2>
                <p>{{ formatFullDate(day.date) }}</p>
              </div>
              <span class="day-card__number">{{ day.date.getDate() }}</span>
            </header>

            <div v-if="day.partidos.length" class="match-list">
              <article
                v-for="(partido, matchIndex) in day.partidos"
                :key="`${partido.deporte}-${partido.fecha}-${partido.horario}`"
                class="match-card"
                :class="{ 'match-card--no-asistencia': partido.acude === false }"
                :style="{ '--match-index': matchIndex }"
              >
                <div class="match-card__topline">
                  <span class="sport-pill" :class="sportClass(partido.deporte)">
                    {{ formatSport(partido.deporte) }}
                  </span>
                  <span
                    class="venue-icon"
                    :title="partido.casa ? 'En casa' : 'Fuera de casa'"
                    :aria-label="partido.casa ? 'En casa' : 'Fuera de casa'"
                  >
                    {{ partido.casa ? '⌂' : '✈' }}
                  </span>
                </div>
                <p class="match-card__time">
                  <span class="clock-icon" aria-hidden="true">◷</span>
                  {{ partido.horario || 'Hora pendiente' }}
                </p>
                <p class="match-card__place">{{ partido.lugar }}</p>
                <p v-if="partido.resultado" class="match-card__result">
                  <span>Resultado</span>
                  <strong>{{ partido.resultado }}</strong>
                </p>
              </article>
            </div>
            <p v-else class="empty-day">
              <span class="empty-day__mark" aria-hidden="true"></span>
              Sin partidos
            </p>
          </article>
        </div>
      </section>
    </div>

    <footer class="calendar-footer">
      <span class="footer-mark" aria-hidden="true">●</span>
      Desplázate para recorrer la temporada
    </footer>
  </main>
</template>

<style scoped>
.calendar-page {
  padding-top: 54px;
}

.calendar-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 38px;
}

.season-badge {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 9px;
  padding: 10px 13px;
  border: 1px solid #e1e7f0;
  border-radius: 999px;
  color: #526078;
  background: #fff;
  font-size: 0.82rem;
  font-weight: 650;
}

.season-badge__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #46bb7b;
  box-shadow: 0 0 0 3px #e5f7ed;
}

.loading-state {
  padding: 48px 0;
  color: var(--muted);
  text-align: center;
}

.weekend-list {
  display: grid;
  gap: 34px;
}

.weekend {
  scroll-margin-top: 24px;
}

.weekend-heading {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 13px;
}

.weekend-heading__date {
  display: flex;
  align-items: center;
  gap: 10px;
}

.weekend-heading__month {
  color: #657187;
  font-size: 0.79rem;
  font-weight: 750;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.weekend-heading__line {
  height: 1px;
  flex: 1;
  background: #e2e8f0;
}

.current-tag {
  padding: 4px 8px;
  border-radius: 999px;
  color: #274bc9;
  background: #eaf0ff;
  font-size: 0.7rem;
  font-weight: 750;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 13px;
}

.day-card {
  min-height: 194px;
  padding: 17px;
  border: 1px solid #e5eaf1;
  border-radius: 15px;
  background: var(--surface);
  box-shadow: 0 3px 12px rgb(28 43 70 / 3%);
}

.day-card--outside {
  border-style: dashed;
  background: #f8f9fb;
}

.day-card__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 13px;
  border-bottom: 1px solid #eef1f5;
}

.day-card__heading h2 {
  margin: 0;
  color: #263248;
  font-size: 0.96rem;
  font-weight: 750;
}

.day-card__heading p {
  margin: 5px 0 0;
  color: #8490a2;
  font-size: 0.75rem;
  text-transform: capitalize;
}

.day-card__number {
  display: grid;
  width: 31px;
  height: 31px;
  place-items: center;
  border-radius: 9px;
  color: #4a5870;
  background: #f0f3f8;
  font-size: 0.82rem;
  font-weight: 750;
}

.empty-day {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 22px 0 0;
  color: #a0a9b6;
  font-size: 0.83rem;
}

.empty-day__mark {
  width: 7px;
  height: 7px;
  border: 1px solid #bbc3ce;
  border-radius: 50%;
}

.match-list {
  display: grid;
  gap: 9px;
  padding-top: 11px;
}

.match-card {
  padding: 12px;
  border: 1px solid #e8edf5;
  border-radius: 11px;
  background: #fbfcfe;
  animation: card-in 260ms ease both;
  animation-delay: calc(var(--match-index) * 40ms);
}

.match-card--no-asistencia {
  border-color: #f2d5d2;
  background: #fff7f6;
}

.match-card__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sport-pill {
  max-width: 80%;
  overflow: hidden;
  padding: 5px 8px;
  border-radius: 6px;
  color: #3852ad;
  background: #edf1ff;
  font-size: 0.72rem;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sport-pill--futbol {
  color: #166534;
  background: #dcfce7;
}

.sport-pill--baloncesto {
  color: #9a3412;
  background: #ffedd5;
}

.sport-pill--waterpolo {
  color: #075985;
  background: #e0f2fe;
}

.sport-pill--waterpolo-infantil {
  color: #1e3a8a;
  background: #dbeafe;
}

.sport-pill--baile-moderno {
  color: #6b21a8;
  background: #f3e8ff;
}

.venue-icon {
  display: grid;
  width: 25px;
  height: 25px;
  place-items: center;
  border-radius: 7px;
  color: #59667b;
  background: #f0f3f8;
  font-size: 0.95rem;
}

.match-card__time {
  margin: 10px 0 4px;
  color: #1e2b40;
  font-size: 1.06rem;
  font-weight: 760;
  letter-spacing: -0.02em;
}

.clock-icon {
  margin-right: 4px;
  color: #8290a4;
  font-size: 0.95rem;
}

.match-card__place {
  margin: 0;
  color: #69758a;
  font-size: 0.8rem;
}

.match-card__result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 11px 0 0;
  padding-top: 9px;
  border-top: 1px solid #e9edf3;
  color: #778398;
  font-size: 0.74rem;
}

.match-card__result strong {
  color: #1e2b40;
  font-size: 0.84rem;
}

.calendar-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-top: 38px;
  color: #8994a5;
  font-size: 0.8rem;
}

.footer-mark {
  color: #bbc6d6;
  font-size: 0.55rem;
}

@keyframes card-in {
  from {
    transform: translateY(4px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 800px) {
  .days-grid {
    gap: 9px;
  }

  .day-card {
    padding: 13px;
  }
}

@media (max-width: 620px) {
  .calendar-page {
    padding-top: 36px;
  }

  .calendar-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 18px;
    margin-bottom: 30px;
  }

  .days-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .day-card {
    min-height: 0;
    padding: 13px 15px;
  }

  .day-card__heading {
    align-items: center;
    padding-bottom: 10px;
  }

  .day-card__heading > div {
    display: flex;
    align-items: baseline;
    gap: 9px;
  }

  .day-card__heading p {
    margin: 0;
  }

  .empty-day {
    margin-top: 12px;
  }

  .weekend-list {
    gap: 28px;
  }
}
</style>
