import { useId, useState } from 'react'
import type { ChangeEvent, FocusEvent, FormEvent, KeyboardEvent } from 'react'
import { searchSite } from '../search/search'

export function SearchForm() {
  const inputId = useId()
  const listboxId = useId()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const results = searchSite(query, isExpanded ? 24 : 5)
  const hasSearchableQuery = query.trim().length >= 2
  const showPanel = isOpen

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value)
    setActiveIndex(-1)
    setIsOpen(true)
    setIsExpanded(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setIsOpen(false)
      setIsExpanded(false)
      setActiveIndex(-1)
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((current) => results.length === 0 ? -1 : (current + 1) % results.length)
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((current) => results.length === 0 ? -1 : current <= 0 ? results.length - 1 : current - 1)
    }

    if (event.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      event.preventDefault()
      window.location.assign(results[activeIndex].href)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setActiveIndex(-1)
    setIsOpen(true)
    setIsExpanded(true)
  }

  function handleBlur(event: FocusEvent<HTMLFormElement>) {
    if (!isExpanded && !event.currentTarget.contains(event.relatedTarget)) {
      setIsOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <form className="search-form" role="search" onSubmit={handleSubmit} onBlur={handleBlur}>
      <label htmlFor={inputId}>Search for a hike, trailhead, or place</label>
      <div className="search-combobox">
        <div className="search-row">
          <input
            id={inputId}
            type="search"
            value={query}
            placeholder="Try “redwoods” or “East Bay”"
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showPanel}
            aria-controls={listboxId}
            aria-activedescendant={activeIndex >= 0 ? results[activeIndex]?.id : undefined}
            onChange={handleChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
          />
          <button type="submit">Search</button>
        </div>

        {showPanel && <div className={`search-panel${isExpanded ? ' search-panel-expanded' : ''}`} id={listboxId} role="listbox" aria-label={isExpanded ? 'Search results' : 'Search suggestions'}>
          {isExpanded && hasSearchableQuery && results.length > 0 && <div className="search-results-heading" role="presentation"><strong>Search results</strong><span>{results.length} {results.length === 1 ? 'match' : 'matches'} for “{query.trim()}”</span></div>}
          {!hasSearchableQuery && <div className="search-message" role="option" aria-disabled="true">Type at least two characters to search hikes, places, trailheads, stops, and transit routes.</div>}
          {hasSearchableQuery && results.length === 0 && <div className="search-message" role="option" aria-disabled="true"><strong>No matches for “{query.trim()}”</strong><span>Try a place, park, trail name, transit agency, route, or stop.</span></div>}
          {results.map((result, index) => <a
            className="search-result"
            id={result.id}
            href={result.href}
            role="option"
            aria-selected={index === activeIndex}
            key={result.id}
            onMouseEnter={() => setActiveIndex(index)}
          ><span className="result-type">{result.type}</span><span className="result-copy"><strong>{result.title}</strong><span>{result.description}</span></span><span className="result-arrow" aria-hidden="true">→</span></a>)}
        </div>}
      </div>
      <p className="field-note">Use the arrow keys to review suggestions and Enter to open one.</p>
    </form>
  )
}
