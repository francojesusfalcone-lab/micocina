import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

// Lee el estado de la jornada actual
export function useJornada() {
  return useLiveQuery(async () => {
    const estado = await db.jornada.get('estado')
    const apertura = await db.jornada.get('apertura')
    return {
      abierto: estado?.value === 'abierto',
      apertura: apertura?.value ?? null,
    }
  }, [], { abierto: false, apertura: null })
}

export async function abrirJornada() {
  const now = new Date().toISOString()
  await db.jornada.bulkPut([
    { key: 'estado', value: 'abierto' },
    { key: 'apertura', value: now },
  ])
}

export async function cerrarJornada() {
  await db.jornada.put({ key: 'estado', value: 'cerrado' })
}
