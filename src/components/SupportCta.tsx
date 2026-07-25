import { mailingListUrl } from '../config/links'

export function SupportCta() {
  return <aside className="support-cta" aria-labelledby="support-title"><div className="container support-cta-inner"><div><p className="eyebrow">Keep the trail connected</p><h2 id="support-title">Support Hiking by Transit</h2><p>This volunteer-run project maps car-free access to the outdoors and publishes practical trip guides.</p></div><div className="support-actions"><a className="support-action support-action-primary" href="https://ko-fi.com/hikingbytransit"><strong>Donate</strong><span>Help maintain the map and guides</span></a><a className="support-action" href={mailingListUrl}><strong>Join the mailing list</strong><span>Get new hikes and event announcements</span></a></div></div></aside>
}
