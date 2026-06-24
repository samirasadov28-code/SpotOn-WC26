'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SessionGuard() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname.startsWith('/auth/')) return
    const remembered = localStorage.getItem('spoton_remember')
    const sessionActive = sessionStorage.getItem('spoton_session')
    if (!remembered && !sessionActive) {
      createClient().auth.getUser().then(({ data: { user } }) => {
        if (!user) return
        // Has a Supabase session but didn't choose "stay signed in" — sign out
        localStorage.removeItem('spoton_remember')
        createClient().auth.signOut().then(() => {
          window.location.href = '/auth/login'
        })
      })
    } else {
      sessionStorage.setItem('spoton_session', '1')
    }
  }, [pathname])
  return null
}
