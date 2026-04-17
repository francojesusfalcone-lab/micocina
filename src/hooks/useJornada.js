import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

const INACTIVITY_HOURS = 7 // horas sin pedidos → pasa a "sin actividad"

export function useJornada() {
  return useLiveQuery(async () => {
    const estado    = await db.jornada.get('estado')
    const apertura  = await db.jornada.get('apertura')
    const ultimoPedido = await db.jornada.get('ultimoPedido')

    // Si fue cerrado manualmente → 'cerrado'
    if (estado?.value === 'cerrado') {
      return { estado: 'cerrado', apertura: apertura?.value ?? null }
    }

    // Si hay apertura, ver si sigue "en actividad" o pasó a "sin actividad"
    if (apertura?.value) {
      const msInactividad = ultimoPedido?.value
        ? Date.now() - new Date(ultimoPedido.value).getTime()
        : Date.now() - new Date(apertura.value).getTime()

      const horasInactivo = msInactividad / (1000 * 60 * 60)

      if (horasInactivo >= INACTIVITY_HOURS) {
        return { estado: 'sin_actividad', apertura: apertura.value, ultimoPedido: ultimoPedido?.value }
      }
      return { estado: 'activo', apertura: apertura.value, ultimoPedido: ultimoPedido?.value }
    }

    // Sin apertura aún → sin actividad
    return { estado: 'sin_actividad', apertura: null }
  }, [], { estado: 'sin_actividad', apertura: null })
}

// Se llama automáticamente al crear el primer pedido del día
export async function activarJornada() {
  const now = new Date().toISOString()
  // Solo abre si no hay apertura hoy
  const apertura = await db.jornada.get('apertura')
  const estado   = await db.jornada.get('estado')

  // Si fue cerrado manualmente, no reabrir automáticamente
  if (estado?.value === 'cerrado') return

  if (!apertura?.value) {
    await db.jornada.bulkPut([
      { key: 'estado',    value: 'abierto' },
      { key: 'apertura',  value: now },
      { key: 'ultimoPedido', value: now },
    ])
  } else {
    // Actualiza el último pedido para reiniciar contador de inactividad
    await db.jornada.put({ key: 'ultimoPedido', value: now })
  }
}

export async function cerrarDia() {
  await db.jornada.put({ key: 'estado', value: 'cerrado' })
}

export async function reabrirDia() {
  const now = new Date().toISOString()
  await db.jornada.bulkPut([
    { key: 'estado',       value: 'abierto' },
    { key: 'ultimoPedido', value: now },
  ])
}

// Mantener compatibilidad con código anterior
export const abrirJornada = reabrirDia
export const cerrarJornada = cerrarDia
