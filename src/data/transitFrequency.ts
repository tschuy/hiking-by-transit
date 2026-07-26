import type { CatalogAccess } from '../types/catalog'

function frequencyLabel(value: number): string {
  const trips = Math.max(1, Math.round(value))
  if (trips === 1) return '1 trip a day'
  if (trips < 10) return `${trips} trips a day`
  if (trips < 18) return 'Every 1–2 hours'
  if (trips < 30) return 'About hourly'
  if (trips < 50) return 'Every 30–45 minutes'
  if (trips < 75) return 'Every 20–30 minutes'
  return 'Frequent service'
}

export function formatServiceFrequency(access: CatalogAccess): string[] {
  const entries = Object.entries(access.frequency)
    .filter((entry): entry is ['weekday' | 'saturday' | 'sunday', number] => entry[1] !== null && entry[1] > 0)
    .map(([day, value]) => [day, frequencyLabel(value)] as const)
  const labels = Object.fromEntries(entries) as Partial<Record<'weekday' | 'saturday' | 'sunday', string>>

  if (labels.weekday && labels.weekday === labels.saturday && labels.saturday === labels.sunday) {
    return [`7 days a week: ${labels.weekday}`]
  }

  const result: string[] = []
  if (labels.weekday) result.push(`Weekday: ${labels.weekday}`)
  if (labels.saturday && labels.saturday === labels.sunday) result.push(`Weekend: ${labels.saturday}`)
  else {
    if (labels.saturday) result.push(`Saturday: ${labels.saturday}`)
    if (labels.sunday) result.push(`Sunday: ${labels.sunday}`)
  }
  return result
}
