---
name: Ledgerly Institutional Auth
colors:
  surface: '#0e1323'
  surface-dim: '#0e1323'
  surface-bright: '#34394a'
  surface-container-lowest: '#080d1d'
  surface-container-low: '#161b2b'
  surface-container: '#1a1f30'
  surface-container-high: '#25293a'
  surface-container-highest: '#2f3446'
  on-surface: '#dee1f9'
  on-surface-variant: '#c3c5d7'
  inverse-surface: '#dee1f9'
  inverse-on-surface: '#2b3041'
  outline: '#8d90a0'
  outline-variant: '#434654'
  surface-tint: '#b5c4ff'
  primary: '#b5c4ff'
  on-primary: '#00297b'
  primary-container: '#648aff'
  on-primary-container: '#00236d'
  inverse-primary: '#1a53d6'
  secondary: '#4fddb8'
  on-secondary: '#00382b'
  secondary-container: '#00b290'
  on-secondary-container: '#003d30'
  tertiary: '#bec6dd'
  on-tertiary: '#283042'
  tertiary-container: '#8990a6'
  on-tertiary-container: '#222a3b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b5c4ff'
  on-primary-fixed: '#00164d'
  on-primary-fixed-variant: '#003cad'
  secondary-fixed: '#70fad3'
  secondary-fixed-dim: '#4fddb8'
  on-secondary-fixed: '#002018'
  on-secondary-fixed-variant: '#005140'
  tertiary-fixed: '#dbe2fa'
  tertiary-fixed-dim: '#bec6dd'
  on-tertiary-fixed: '#131b2c'
  on-tertiary-fixed-variant: '#3f475a'
  background: '#0e1323'
  on-background: '#dee1f9'
  surface-variant: '#2f3446'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-xs:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system establishes an institutional-grade, highly secure, and uncompromisingly modern identity tailored for high-capital fintech authentication. Designed for institutional operators, asset managers, and technical traders, the aesthetic communicates absolute mathematical rigor, operational sovereignty, and zero-latency performance. 

The visual strategy merges Modern Corporate precision with restrained Glassmorphic structural depth. Surfaces are treated like precision instruments: dark, non-distracting midnight surfaces anchored by electric signals of verified state. The emotional outcome must be total trust, elevated discretion, and an unhurried, razor-sharp sense of executive control.

## Colors

The palette is engineered around low-strain luminance contrast optimized for mission-critical, continuous monitoring:

- **Canvas & Backdrops:** `#0B1020` anchors the entire ecosystem, creating a non-reflective, deep midnight void.
- **Structural Surfaces:** `#121A2B` isolates functional regions, modal shells, and authentication cards without introducing visual noise.
- **Accents & Telemetry:**
  - **Electric Blue (`#4F7CFF`):** Dedicated exclusively to primary actionable focal points, key inputs, and confirmed states.
  - **Muted Teal (`#35C9A5`):** Reserved for telemetry validations, multi-factor hardware verification, and cryptographic hash confirmations.
- **Text & Borders:**
  - **Primary Text:** `#F5F7FF` ensures maximum clarity on dense verification tables.
  - **Secondary Text:** `#9BA7BC` holds structural copy, field descriptors, and timestamps at a low optical threshold.
  - **Structural Boundary:** Outlines and ledger dividers utilize a translucent blue-gray (`rgba(155, 167, 188, 0.14)`), delivering hair-thin structural demarcation without breaking visual unity.

## Typography

The type hierarchy establishes strict technical functionalism. `Inter` provides high-density legibility across all UI instructions, labels, and header tiers, prioritizing vertical clarity and neutral letterforms.

For security keys, cryptographic nonces, hardware tokens, and validation telemetry, `JetBrains Mono` is deployed exclusively. This prevents glyph confusion (e.g., `0` vs `O`, `1` vs `l`), preserves tabular decimal alignment, and directly evokes the mechanical certitude of a distributed ledger engine.

## Layout & Spacing

The structural layout relies on an 8px base rhythm governed by an institutional 12-column fixed grid desktop model (max container width: 1200px) that centers securely across wide command viewports.

- **Desktop (1024px+):** Authentication cards are anchored via an off-center balance or precision split-view—data integrity telemetry on the left (7 columns), authentication gate on the right (5 columns)—using 24px gutters.
- **Tablet (768px - 1023px):** Collapses to an 8-column layout with 24px margins, stacking ledger node status below the primary card.
- **Mobile (<768px):** Drops to a 4-column fluid container with 20px edge margins, prioritizing input verticality and biometric touch-targets without unnecessary ornamental wrappers.

## Elevation & Depth

Visual hierarchy does not rely on heavy drop shadows or dramatic blurs. Depth is produced via disciplined tonal layering, fine-gauge structural borders, and directional luminescence:

- **Base Floor (L0):** `#0B1020` void, textured solely by subtle cryptographic node network lines rendered at 4% opacity.
- **Authentication Shell (L1):** `#121A2B` card base enclosed with a 1px uniform perimeter of `rgba(155, 167, 188, 0.12)`. Ambient glow is tightly concentrated: `0 24px 48px -12px rgba(0, 0, 0, 0.6)`.
- **Active Interactive Focus (L2):** Elevated interactive elements (active fields, hardware key dialogs) deploy a subtle top specular stroke: `border-top: 1px solid rgba(79, 124, 255, 0.4)` paired with an electric blue diffusion halo: `0 0 20px -4px rgba(79, 124, 255, 0.25)`.
- **System Modals / Hardware Handshakes (L3):** `#182238` with dual-stop borders (`rgba(53, 201, 165, 0.3)` on top, `rgba(155, 167, 188, 0.1)` on edges) signaling secure enclave separation.

## Shapes

The design system embraces a restrained, architectural curvature (`Level 1 - Soft`). Sharp, controlled geometries avoid the consumerism of pill-shaped interfaces and the aggression of zero-radius brutalism.

- **Standard Elements (Inputs, Buttons, Micro-Badges):** Standardized to `4px` (`0.25rem`) radius to match ledger row lines.
- **Containers & Primary Modals:** Sculpted at `8px` (`0.5rem`) radius (`rounded-lg`), delivering clean architectural framing.
- **Data Nodes & Network Indicators:** Perfect circles (`50%`) with strict 6px and 8px diameters, functioning as mechanical LEDs.

## Components

### Buttons
- **Primary Auth CTA:** Background `#4F7CFF`, text `#F5F7FF` (`Inter`, 14px, 500 weight), height 44px, border radius 4px. Hover state shifts to `#3E6AE1` with an inner 1px highlight line. Active state reduces scale to 99%.
- **Secondary / Passkey:** Background `transparent`, border 1px solid `rgba(155, 167, 188, 0.2)`, text `#F5F7FF`. Hover initiates background tint `rgba(79, 124, 255, 0.08)` and border `#4F7CFF`.
- **Destructive / Reset:** Monospace text link with low-contrast slate `#9BA7BC`, shifting to `#FF5C5C` strictly on active hover.

### Inputs & Verification Fields
- **Text & Credential Inputs:** Background `#0B1020` inset into the `#121A2B` card surface. Border 1px solid `rgba(155, 167, 188, 0.15)`. Font is `Inter` 14px for credentials, swapping to `JetBrains Mono` for multi-factor code sequences.
- **Focus State:** Border shifts instantaneously to `#4F7CFF`, paired with an outer box-shadow of `0 0 0 1px #4F7CFF`.
- **Error State:** Border shifts to `#FF5C5C`, supplemented by mono inline diagnostic message below.

### Status Chips & Cryptographic Badges
- Constructed with `JetBrains Mono` (11px, uppercase).
- Height 24px, 4px border radius.
- **Verified State:** Background `rgba(53, 201, 165, 0.1)`, text `#35C9A5`, border 1px solid `rgba(53, 201, 165, 0.25)`.
- **Node Syncing State:** Background `rgba(79, 124, 255, 0.1)`, text `#4F7CFF`, border 1px solid `rgba(79, 124, 255, 0.25)`.

### Cards & Enclaves
- Outer envelope: Background `#121A2B`, border 1px solid `rgba(155, 167, 188, 0.12)`.
- Inner header section features a segmented bottom border separator (`rgba(155, 167, 188, 0.08)`) and explicit cryptographic node meta details (e.g., `TLS 1.3 / HSM SECURE`).

### Checkboxes & Authentication Toggles
- Square 16px geometry with 2px radius. Border 1px solid `rgba(155, 167, 188, 0.3)`.
- Checked state fills with `#4F7CFF` displaying an angled micro-check in `#F5F7FF`.

### Ledger Telemetry Visualizer (Specialized Component)
- Embedded vertical graph tracking dynamic session entropy or verification consensus.
- Renders 1px hairline horizontal coordinate guides with active `#35C9A5` pulse markers verifying authentic network validation.