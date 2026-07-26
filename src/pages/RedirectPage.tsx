import { useEffect } from 'react'

export function RedirectPage({ to }: { to: string }) {
  useEffect(() => {
    const suffix = to.includes('#') ? '' : `${window.location.search}${window.location.hash}`
    window.location.replace(`${to}${suffix}`)
  }, [to])
  return <section className="page container not-found"><h1>Taking you to the new page…</h1><p><a href={to}>Continue if you are not redirected.</a></p></section>
}
