import { useEffect, useState } from 'react'
import { db } from '../db'

export function useDarkMode() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    db.settings.get('darkMode').then(r => {
      // Si nunca se guardó preferencia, default es claro
      const val = r === undefined ? false : r?.value === true
      setDark(val)
      document.documentElement.classList.toggle('dark', val)
    }).catch(() => {
      setDark(false)
      document.documentElement.classList.remove('dark')
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
