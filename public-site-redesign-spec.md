# Restore With Ellis Public-Site Redesign Specification

## Visual Direction

The public Restore With Ellis site will adopt the client portal’s **quiet premium** visual language while retaining a marketing-site structure. The experience should feel restorative, personal, and clear rather than resemble an internal dashboard. Its content hierarchy will lead with care, introduce both therapists with equal visibility, then guide visitors toward the therapist-first booking flow.

| System element | Portal reference | Public-site adaptation |
| --- | --- | --- |
| Background | Deep mineral black `#0a1012` with restrained teal and muted terracotta radial light | Full-bleed page background with soft, low-contrast atmosphere behind hero and therapist sections. |
| Primary accent | Warm gold `#caa66a` | Eyebrows, dividers, active states, booking buttons, and small profile details. |
| Typography | Cormorant Garamond for editorial display headings; Manrope for interface and body copy | Large serif care-led headlines paired with clear, accessible sans-serif body copy and navigation. |
| Surfaces | Dark green-charcoal gradient cards, fine warm borders, rounded 24–28px corners | Editorial content panels, service cards, therapist profiles, and booking prompts. Avoid a grid of indistinguishable boxes. |
| Motion | Brief rise-in entrance, responsive hover states, clear focus rings, reduced-motion support | Subtle section entrances and button feedback under 300ms. Motion supports hierarchy rather than distracting from booking. |
| Responsive behavior | Generous desktop composition that collapses to single-column cards | Therapist profiles stack cleanly on mobile, retaining equal visual prominence and primary booking actions. |

## Public-Site Content Hierarchy

The home page will use a warm editorial hero with a direct booking CTA and a secondary link to the secure Client Portal. A paired **Meet Your Therapists** section will introduce Zachary Ellis and Hunter Ellis using matching card treatment, portrait framing, CAMTC credentials, weekday availability, concise individual positioning, and an equal-strength `Book with Zachary` or `Book with Hunter` action that leads to the therapist-first booking page.

Zachary’s existing square professional portrait is approved for this treatment. Hunter’s matching portrait will be incorporated once provided, without generating or substituting an invented likeness. Both profiles will remain accurately scoped to their confirmed availability: Zachary Monday–Thursday and Hunter Monday–Friday from 12:51 PM to 8:00 PM. Alternating-weekend booking must remain unavailable until the schedule is confirmed.

Below the therapist section, services and care approach will be presented as calm, legible editorial modules; the booking callout will reinforce therapist choice before date and time selection. The footer and navigation will preserve the Client Portal link and booking path. Public HSA/FSA claims and insurance identifiers will remain excluded until processor confirmation and approved compliance messaging are available.

## Implementation Guardrails

The redesign must preserve the deployed `book.html` interaction, its `/proxy.php` integration, and the existing direct Client Portal path. It must not introduce fabricated reviews, ratings, testimonials, insurance identifiers, or unconfirmed weekend availability. Image assets for the hosted static site should be optimized and deployed through the existing Hostinger workflow alongside their linked HTML and CSS updates.
