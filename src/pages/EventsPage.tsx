import { mailingListUrl } from '../config/links'
import { eventContent } from '../data/content'
import type { EventContent } from '../types/content'

function eventTimestamp(event: EventContent) {
  return Date.parse(event.event_date.replace(/(\d+)(st|nd|rd|th)/, '$1'))
}

function EventList({ events }: { events: EventContent[] }) {
  return (
    <div className="event-list">
      {events.map((event) => (
        <article className="event-card" key={event.url}>
          <p className="eyebrow">{event.event_date}</p>
          <h2><a href={event.url}>{event.title}</a></h2>
          <a href={event.url}>Event details <span aria-hidden="true">→</span></a>
        </article>
      ))}
    </div>
  )
}

export function EventsPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcomingEvents = eventContent.filter((event) => eventTimestamp(event) >= today.getTime())
  const pastEvents = eventContent.filter((event) => eventTimestamp(event) < today.getTime())

  return (
    <section className="page container">
      <p className="eyebrow">Hike together</p>
      <h1>Events</h1>
      <p className="page-lede">Want to celebrate getting outdoors on the bus or try a car-free hike with other people? Join Hiking by Transit for an event.</p>
      <a className="button-link archive-action" href={mailingListUrl}>Get event announcements</a>

      {upcomingEvents.length > 0 && (
        <section aria-labelledby="upcoming-events">
          <h2 id="upcoming-events">Upcoming Events</h2>
          <EventList events={upcomingEvents} />
        </section>
      )}

      {pastEvents.length > 0 && (
        <section aria-labelledby="past-events">
          <h2 id="past-events">Past Events</h2>
          <EventList events={pastEvents} />
        </section>
      )}
    </section>
  )
}
