import { useEffect, useState } from 'react'

const slides = [
  { file: 'las-trampas.jpg', alt: 'A hiker overlooking the rolling hills at Las Trampas' },
  { file: 'black-diamond.jpg', alt: 'Grasslands and wooded hills at Black Diamond Mines' },
  { file: 'tahoe.jpg', alt: 'Lake Tahoe surrounded by the Sierra Nevada' },
  { file: 'yosemite.jpg', alt: 'Granite cliffs and forest in Yosemite National Park' },
]

export function HeroSlideshow() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6000)
    return () => window.clearInterval(timer)
  }, [])

  return <div className="hero-slideshow"><img src={`/assets/${slides[active].file}`} alt={slides[active].alt} /><div className="slideshow-controls" aria-label="Choose hero photo">{slides.map((slide, index) => <button type="button" className={index === active ? 'active' : ''} aria-label={`Show ${slide.alt.toLowerCase()}`} aria-pressed={index === active} onClick={() => setActive(index)} key={slide.file} />)}</div></div>
}
