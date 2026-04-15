import { useEffect, useState } from 'react'
import { db } from '../db'

export function useDarkMode() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    db.settings.get('darkMode').then(r => {
      // Si nunca se guardó preferencia, default es oscuro
      const val = r === undefined ? true : r?.value === true
      setDark(val)
      document.documentElement.classList.toggle('dark', val)
    }).catch(() => {
      setDark(true)
      document.documentElement.classList.add('dark')
    })
  }, [])

  async function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    await db.settings.put({ key: 'darkMode', value: next })
  }

  return { dark, toggle }
}
