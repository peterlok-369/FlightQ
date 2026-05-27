# FlightQ Design Brainstorm

## Context
A flight search app (HKG → FUK) with baggage-first filters, dark/light mode, demo/API modes. Converting from single-file HTML to React with component-based architecture.

---

<response>
## Idea 1: "Warm Modernism" — Organic Utility

<text>
**Design Movement**: Warm Modernism — inspired by Dieter Rams' functionalism but with organic warmth (think Muji meets airline lounge signage).

**Core Principles**:
1. Purposeful restraint — every element earns its place
2. Warm neutrals over cold grays — beige, cream, warm stone
3. Information density without clutter — compact but breathable
4. Tactile surfaces — subtle paper-like textures and soft shadows

**Color Philosophy**: A warm beige canvas (#f7f2e9) with deep teal accents (#01696f) creates a calming, trustworthy environment. The teal evokes ocean/sky travel without being cliché. Dark mode inverts to deep forest (#111816) with luminous cyan accents.

**Layout Paradigm**: Asymmetric two-column workspace — search controls in a narrower left column, results in a wider right column. The layout mimics a professional dashboard rather than a centered landing page.

**Signature Elements**:
- Pill-shaped status indicators with pulsing dots
- Timeline route visualizations with circular endpoints
- Airline logo initials in soft-colored squares

**Interaction Philosophy**: Micro-feedback on every action — buttons compress on press, panels slide open with spring physics, cards lift on hover. Nothing feels dead.

**Animation**: 
- Button press: scale(0.97) over 160ms ease-out
- Panel toggle: height animation with 250ms cubic-bezier(0.23, 1, 0.32, 1)
- Card hover: translateY(-2px) + shadow expansion over 200ms
- Skeleton shimmer: 1.2s infinite ease-in-out background sweep
- Tab switch: opacity crossfade 180ms

**Typography System**: Satoshi (geometric sans) for everything — 700 for headings, 500 for labels, 400 for body. Uppercase micro-labels (0.76rem, letter-spacing 0.04em) for form fields. Monospace-inspired alignment for prices and times.
</text>
<probability>0.08</probability>
</response>

---

<response>
## Idea 2: "Neo-Brutalist Travel" — Bold Information Architecture

<text>
**Design Movement**: Neo-Brutalism meets Swiss International Style — raw, honest, information-first with bold typographic hierarchy.

**Core Principles**:
1. Typography IS the design — oversized route codes, bold prices
2. Hard edges and visible structure — no rounded corners, thick borders
3. High contrast color blocking — sections clearly delineated
4. Data-forward — numbers and codes treated as visual elements

**Color Philosophy**: Pure white (#ffffff) background with jet black (#0a0a0a) text and electric lime (#c8ff00) as the action color. The lime is unexpected for travel — it signals speed, modernity, and breaks from airline-blue conventions.

**Layout Paradigm**: Stacked card system with full-width sections separated by thick 3px borders. No sidebar — everything flows vertically with clear section breaks. Mobile-first thinking that scales up.

**Signature Elements**:
- Airport codes rendered at 3x size as decorative typography
- Thick black borders (3px) between sections
- Lime-green action buttons with black text

**Interaction Philosophy**: Instant, snappy, no easing. Clicks produce immediate state changes. Hover states use background-color fills rather than transforms. Everything feels mechanical and precise.

**Animation**:
- No transform animations — only color/opacity changes
- Instant tab switches (0ms transition)
- Skeleton: hard-edge pulse (opacity 0.3→1) at 800ms
- Focus rings: 4px solid lime outline, no blur

**Typography System**: Space Grotesk for headings (bold, tight tracking), IBM Plex Mono for codes/prices/times, Inter for body text. Three distinct fonts creating clear information hierarchy.
</text>
<probability>0.04</probability>
</response>

---

<response>
## Idea 3: "Aero Glass" — Translucent Depth

<text>
**Design Movement**: Glassmorphism 2.0 — layered translucent panels with depth, inspired by macOS and modern dashboard UIs but with restraint.

**Core Principles**:
1. Layered depth — panels float above a gradient canvas
2. Frosted glass surfaces with subtle blur
3. Soft, diffused lighting — no harsh shadows
4. Gradient accents that shift with theme

**Color Philosophy**: A soft gradient background (warm peach to lavender in light mode, deep navy to charcoal in dark mode). Panels use rgba whites/blacks with backdrop-blur. Accent is a shifting gradient from teal to blue-violet.

**Layout Paradigm**: Floating panels on a gradient canvas — search panel and results panel appear as separate glass cards with visible depth separation. Slight rotation/perspective on hover for 3D feel.

**Signature Elements**:
- Frosted glass panels (backdrop-filter: blur(20px))
- Gradient border highlights on focused elements
- Floating pill badges with inner glow

**Interaction Philosophy**: Smooth, fluid, almost liquid. Elements respond to hover with gentle scale and glow. Transitions feel like objects moving through water — slightly damped.

**Animation**:
- Panel entrance: scale(0.96) + opacity(0) → normal over 400ms spring
- Hover: scale(1.02) + box-shadow glow over 300ms
- Tab switch: sliding indicator with 250ms spring
- Cards: subtle parallax tilt on hover (transform: perspective(800px) rotateY(2deg))
- Skeleton: gradient sweep with blur edge

**Typography System**: Plus Jakarta Sans for headings (semi-bold, generous tracking), Inter for body. Single font family keeps the focus on the glass effects rather than competing with typography.
</text>
<probability>0.06</probability>
</response>
