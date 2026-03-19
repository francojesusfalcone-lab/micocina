import { useEffect, useState } from 'react'
import { db } from '../db'

export function useDarkMode() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    db.settings.get('darkMode').then(r => {
      const val = r?.value === true
      setDark(val)
      document.documentElement.classList.toggle('dark', val)
    }).catch(() => {})
  }, [])

  async function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    await db.settings.put({ key: 'darkMode', value: next })
  }

  return { dark, toggle }
}
