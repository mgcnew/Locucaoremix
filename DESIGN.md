---
name: VozVarejo Studio
description: Locução para Mercados & Açougues — a clean SaaS voice studio from offers to MP3.
colors:
  ground: "#f6f7f9"
  surface: "#ffffff"
  sunken: "#f1f2f5"
  line: "#e4e6eb"
  line-strong: "#cdd1d9"
  fg: "#0d0f14"
  muted: "#565c6b"
  subtle: "#8a90a0"
  ink: "#0d0f14"
  ink-hover: "#262a33"
  on-ink: "#ffffff"
  accent: "#6d28d9"
  accent-hover: "#5b21b6"
  accent-soft: "#f2edfd"
  accent-fg: "#5b21b6"
  success: "#157f3c"
  success-soft: "#e8f6ed"
  warning: "#a35a06"
  warning-soft: "#fdf3e2"
  danger: "#c42b2b"
  danger-soft: "#fdeded"
typography:
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.5rem (1.75rem from 640px)"
    fontWeight: 600
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.4
    fontFeature: "'ss01', 'cv11'"
  body-sm:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.43
  caption:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  control: "10px"
  card: "12px"
  dialog: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  card-stack: "20px"
  card-pad: "24px"
  page-x-mobile: "16px"
  page-x: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-accent-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.sunken}"
  button-ghost:
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  button-ghost-hover:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.fg}"
  button-lg:
    rounded: "{rounded.card}"
    padding: "0 20px"
    height: "48px"
  icon-button:
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
    size: "40px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
    typography: "{typography.body}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-pad}"
  choice-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
  choice-card-selected:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-fg}"
  segmented-track:
    backgroundColor: "{colors.sunken}"
    rounded: "{rounded.control}"
    padding: "4px"
  segmented-option-selected:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
    height: "36px"
  chip-suggestion:
    textColor: "{colors.fg}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "36px"
  nav-step-active:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-fg}"
    rounded: "{rounded.md}"
  nav-item-active:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
    height: "40px"
  toast:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "12px 16px"
  dialog:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.dialog}"
    padding: "24px"
  player-bar:
    backgroundColor: "{colors.surface}"
    height: "72px"
---

# Design System: VozVarejo Studio

## Overview

**Creative North Star: "The Quiet Console"**

VozVarejo is the category-standard SaaS voice studio executed with care: a cool, near-white workspace where the path offers → script → voice & MP3 is always the most obvious thing on screen. The interface steps back so the shopkeeper's content (store name, products, prices, the script, the chosen voice) carries the screen. Hierarchy comes from ink weight, one accent hue, and 1px structure, never from colored panels competing for attention.

Density is moderate and touch-safe: controls are 36–48px tall, cards breathe at 20–24px padding, and every long action reports progress in place or through a floating toast. Light and dark themes are first-class siblings driven by the same token names; dark swaps the ground to near-black and lifts the violet to a lavender that reads on dark surfaces.

The system explicitly refuses the generic dashboard of stacked orange cards and buttons that compete with each other: one dark primary action per decision point, violet only where the user's attention or the AI is involved.

**Key Characteristics:**
- Cool near-white ground, white surfaces, 1px borders as the main structural device.
- Near-black ink for the primary action; violet as the single accent (active step, selection, AI actions, progress).
- Green, amber, red are state colors only, always paired with a soft tinted ground.
- Geist throughout, semibold for hierarchy, tabular numerals for prices, counts and times.
- 8/10/12px radii by size; soft shadows only on floating layers.

## Colors

A cool neutral scale with one saturated violet and three state hues, every role defined twice (light in `:root`, dark in `.dark`) under the same token name.

### Primary
- **Studio Violet** (accent): the only accent. Active step marker, selected choice cards and their check, the "Escrever roteiro com IA" / "Aplicar" AI buttons, the player progress fill and thumb, focus outlines, caret, text selection tint. Hover deepens to **Deep Violet** (accent-hover).
- **Violet Wash** (accent-soft): ground of selected choice cards, the active sidebar step and pressed toggles. Text on it uses **Violet Ink** (accent-fg).

### Neutral
- **Console Ink** (ink): primary action buttons ("Continuar", "Baixar MP3", "Salvar", play button) and the logo tile. Text on it is **On-Ink** (on-ink); hover lifts to ink-hover.
- **Cool Paper** (ground): the app background behind everything.
- **White Surface** (surface): cards, sidebar, top bar, bottom nav, player bar, toasts, dialog, fields.
- **Sunken Grey** (sunken): segmented-control tracks, hover fills on ghost controls, neutral count badges, skeleton base.
- **Hairline** (line): default 1px borders and dividers. **Firm Hairline** (line-strong): field and secondary-button borders, hover border on choice cards.
- **Text Black** (fg), **Slate Muted** (muted) for supporting copy and inactive nav, **Faint Slate** (subtle) only for non-text indicators such as the "checking" status dot.

### State
- **Ledger Green** (success / success-soft): completed step check, "IA conectada" dot, success toasts.
- **Shelf Amber** (warning / warning-soft): "Modo sem IA" badge and notice, offline status dot.
- **Alarm Red** (danger / danger-soft): destructive icon buttons, invalid field border, error toasts.

### Dark theme
Same names, `.dark` values: ground #0b0c0f, surface #14161b, sunken #0f1115, line #24272e, line-strong #363a44, fg #eceef2, muted #a3a9b6, ink #f2f3f5 with on-ink #0d0f14 (the primary button inverts to light), accent #a78bfa with accent-soft #221a38 and accent-fg #c9b8ff, success #4ade80, warning #fbbf24, danger #f87171. Text on a filled accent in dark is #120a24.

### Named Rules
**The One Violet Rule.** Violet marks exactly three things: where the user is (active step, selection), what the AI does (AI-action buttons, generation progress), and focus. It is never decoration, never a section background, never a second brand color.

**The State-Only Rule.** Green, amber and red appear only to report a state, always as a strong hue on its own soft tint. No product, template or category is ever color-coded with them.

**The Ink-Leads Rule.** The move-forward action in any area is a near-black ink button; violet buttons are reserved for AI work.

## Typography

**Display Font:** none (the system has no display face)
**Body Font:** Geist (with ui-sans-serif, system-ui, -apple-system, Segoe UI fallback), loaded 400–700
**Label/Mono Font:** Geist only; Geist Mono is declared but not used

**Character:** One neutral grotesk carries everything, with `ss01` and `cv11` stylistic sets on. Weight (500/600) and size, not font changes, build the hierarchy.

### Hierarchy
- **Headline** (600, 1.5rem → 1.75rem at ≥640px, tracking −0.025em): one per view; the step title or view title ("O que vamos anunciar?", "Modelos prontos", "Histórico"). Followed by a 0.9375rem muted subline.
- **Title** (600, 1rem): card headings ("Loja", "Voz do locutor") and the dialog title at 1.125rem.
- **Body** (400, 0.9375rem, 1.4): field text, choice-card names (500/600), nav items (500), player title (600).
- **Body small** (400, 0.875rem): helper text, card descriptions, toast copy, list metadata; muted color.
- **Label** (500, 0.875rem): every form label and fieldset legend, sentence case, in fg.
- **Caption** (500, 0.75rem): step hints, sidebar group label ("Criar locução"), bottom-nav labels, tags, badges. Sentence case.

### Named Rules
**The Tabular Figures Rule.** Every price, duration, timestamp and count uses tabular numerals so values align and don't jitter while playing.

**The Sentence-Case Rule.** No uppercase, no letter-spaced labels. Group labels are small muted sentence-case text.

## Layout

Desktop (≥1024px): a fixed 256px white sidebar on the left (logo, steps 1-2-3, Modelos prontos, Histórico, store card, AI status, theme toggle), main content offset by 256px and centered in a 1024px column with 32px side padding and 40px top padding. A 72px player bar is fixed to the bottom of the main area, aligned to the same 1024px column.

Mobile (<1024px): a 56px sticky translucent top bar (logo, compact "Sem IA" badge, store and theme buttons), a 3-segment horizontal stepper (4px bars, violet up to the current step), content at 16px side padding, the player bar stacked directly above a 64px three-tab bottom navigation that respects the safe-area inset. Page bottoms reserve space for these fixed layers (192px mobile / 128px desktop in the studio).

Rhythm: cards stack 20px apart; card padding 20px (24px from 640px); intra-control gaps 8px, between grouped controls 12px; fieldsets separated by 20px. Choice grids go 1 → 2 (≥640px) → 3 (≥1280px) columns with 8px gaps. Step changes fade up 6px over 260ms.

## Elevation & Depth

Flat at rest. Depth on the page is conveyed by tone (cool ground vs white surface vs sunken grey) and 1px hairlines. Shadows exist only for layers that float above the page: toasts and the store dialog. Fixed chrome (top bar, player bar) uses a 95% surface with backdrop blur and a top/bottom hairline, not a shadow. The dialog backdrop is 50% black with a 2px blur.

### Shadow Vocabulary
- **Float** (`box-shadow: 0 8px 24px -6px rgb(13 15 20 / 0.14), 0 2px 6px -2px rgb(13 15 20 / 0.08)`; dark: `0 10px 30px -8px rgb(0 0 0 / 0.6), 0 2px 6px -2px rgb(0 0 0 / 0.4)`): toasts and dialogs only.
- **Thumb** (Tailwind `shadow-sm`, `0 1px 3px rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`): the selected option inside a segmented control, lifting it off the sunken track.

### Named Rules
**The Floating-Only Rule.** Cards, buttons, fields and choice cards never carry a shadow. If it does not float over the page, it does not cast one; the segmented-control thumb is the single in-surface exception.

## Shapes

Radius scales with control size: 4px for tiny inline tags, 6px for skeleton bars and small close buttons, 8px for small buttons, nav rows and icon buttons, 10px for fields, default buttons, choice cards and segmented tracks, 12px for cards, toasts and large buttons, 16px for the dialog. Fully round only for status dots, step circles, count badges, suggestion chips, the progress/stepper bars and the circular play button. Borders are always 1px; selection swaps border color rather than adding thickness.

## Components

### Buttons
Calm and decisive: flat fills, semibold text, icon leading, no shadows.
- **Shape:** gently rounded (8px sm / 10px md / 12px lg), heights 36 / 44 / 48px.
- **Primary (ink):** Console Ink fill, On-Ink text. The forward action ("Escolher a voz", "Baixar MP3", "Salvar"). The player's play/pause is a 48px circular ink button.
- **Accent (violet):** reserved for AI actions ("Escrever roteiro com IA", "Aplicar" on refine instructions), wand/sparkles icon.
- **Secondary:** white surface, Firm Hairline border, sunken on hover ("Já tenho o texto").
- **Ghost:** muted text, sunken fill and fg text on hover ("Voltar", "Mais dados", "Ouvir amostra").
- **Danger:** danger text with a hairline border, danger-soft fill and danger border on hover.
- **Loading / disabled:** loading replaces the icon with a spinning loader and sets `aria-busy`; disabled drops to 50% opacity. Color transitions only.

### Chips
- **Suggestion chip:** 36px pill, hairline border, fg text with a leading plus icon; firm border and sunken fill on hover. Adds a popular product.
- **Tag:** 4px-radius sunken tag with hairline border and caption text (voice gender).
- **Badges:** pill counts in sunken/hairline (sidebar) or filled violet (mobile nav), tabular.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** White Surface on Cool Paper.
- **Shadow Strategy:** none (see Elevation).
- **Border:** 1px Hairline; template cards firm up to line-strong on hover.
- **Internal Padding:** 20px, 24px from 640px; header row with title, optional muted description and a right-aligned ghost action, 16px above content. Empty states are the same card with 56px vertical padding, centered.

### Choice cards
The core selection pattern (tone, voice, chime). A label-wrapped hidden radio styled as a 10px-radius bordered tile. Unselected: hairline border, firm on hover. Selected: violet border, Violet Wash ground, Violet Ink name and a violet check at the top right. Keyboard focus draws the 2px violet outline on the tile.

### Segmented control
Sunken 10px track with 4px inset and hairline border; 36px options, muted text. The selected option becomes a white 8px tile with the thumb shadow. Secondary values inside an option (e.g. "30s") are muted, normal weight, tabular.

### Inputs / Fields
- **Style:** white surface, 1px Firm Hairline, 10px radius, 10px × 14px padding, 0.9375rem text; placeholder in muted. Selects use a custom chevron with 36px right padding.
- **Hover:** border darkens toward fg.
- **Focus:** violet border plus a 3px violet halo at 22% opacity; caret is violet.
- **Error:** `aria-invalid` turns the border Alarm Red.

### Navigation
- **Sidebar steps:** 24px circle markers. Active: violet filled circle with the number, Violet Wash row, Violet Ink label. Done: success-soft circle with a check. Pending: sunken circle with hairline and muted number. Each row carries a muted caption hint.
- **Sidebar links:** 40px rows, 18px icons, medium weight; active is sunken fill with fg text, inactive muted.
- **Mobile bottom nav:** three equal 64px tabs, 20px icon over caption label; active tab text in Violet Ink.
- **Status:** AI status is a colored dot plus muted text (success / warning / subtle).

### Player bar (signature)
The persistent output of the whole flow: a 72px translucent white bar with a hairline top edge, circular ink play button, semibold title over a muted tabular status line (estimated duration · voice · chime, or the live position), and the ink "Baixar MP3" button (icon-only on mobile). Playback progress is a 4px violet fill on a hairline track with a 14px violet thumb, sitting on the bar's top edge; browser-voice playback shows a shimmering skeleton strip instead.

### Toasts and dialog
Toasts: white 12px cards with hairline and Float shadow, a 20px state icon (violet spinner for loading), semibold title, muted description, optional violet text action; enter by rising 8px and scaling from 0.98 over 220ms. Top-centered on mobile (only the latest shown), top-right on desktop. The store dialog is a 16px-radius surface with Float shadow, 24px padding, max 576px wide, same entrance motion.

## Do's and Don'ts

### Do:
- **Do** build every view from Cool Paper ground, White Surface cards with a 1px Hairline, and 12px corners.
- **Do** give each decision point one ink primary button; use the violet button only for AI work.
- **Do** show selection with violet border + Violet Wash + violet check, never by color alone.
- **Do** pair every state hue with its soft tint and a text label or icon.
- **Do** set prices, durations, timestamps and counts in tabular numerals.
- **Do** keep the 2px violet focus outline (2px offset) on every interactive element, and the 3px halo on fields.
- **Do** define any new color in both `:root` and `.dark` under the same token name.
- **Do** honor reduced motion; entrances stay under 300ms with the `cubic-bezier(0.16, 1, 0.3, 1)` ease-out.

### Don't:
- **Don't** introduce a second accent hue or color-code products, templates or categories.
- **Don't** put shadows on cards, buttons, fields or choice cards; shadows belong to toasts and dialogs.
- **Don't** use uppercase, letter-spaced eyebrow or kicker labels above headings.
- **Don't** place a second forward action beside the ink button; pair it with a secondary or ghost button.
- **Don't** use green, amber or red for anything but state.
- **Don't** hardcode raw hex in components; reference the semantic tokens.
