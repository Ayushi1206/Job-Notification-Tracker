# KodNest Premium Build System

A calm, intentional design system for serious B2C SaaS products.

## Design Philosophy

- Calm, Intentional, Coherent, Confident
- No gradients, no glassmorphism, no neon colors, no animation noise
- Everything feels like one mind designed it

## Color System

- Background: `#F7F6F3` (off-white)
- Primary text: `#111111`
- Accent: `#8B0000` (deep red)
- Success: `#4A6741` (muted green)
- Warning: `#B8860B` (muted amber)

Maximum 4 colors across entire system.

## Typography

- Headings: Crimson Pro (serif), large, confident, generous spacing
- Body: Inter (sans-serif), 16–18px, line-height 1.7
- Max text width: 720px
- No decorative fonts, no random sizes

## Spacing System

Consistent scale: `8px`, `16px`, `24px`, `40px`, `64px`

Never use random spacing. Whitespace is part of design.

## Global Layout Structure

Every page follows:
```
[Top Bar]
↓
[Context Header]
↓
[Primary Workspace (70%) + Secondary Panel (30%)]
↓
[Proof Footer]
```

## Components

### Top Bar
- Left: Project name
- Center: Progress indicator (Step X / Y)
- Right: Status badge (Not Started / In Progress / Shipped)

### Context Header
- Large serif headline
- 1-line subtext
- Clear purpose, no hype language

### Primary Workspace (70% width)
- Main product interaction area
- Clean cards, predictable components, no crowding

### Secondary Panel (30% width)
- Step explanation (short)
- Copyable prompt box
- Action buttons: Copy, Build in Lovable, It Worked, Error, Add Screenshot

### Proof Footer
Persistent bottom section with checklist:
- □ UI Built
- □ Logic Working
- □ Test Passed
- □ Deployed

Each checkbox requires user proof input.

## Component Rules

- Primary button: solid deep red
- Secondary button: outlined
- Same hover effect and border radius everywhere
- Inputs: clean borders, no heavy shadows, clear focus state
- Cards: subtle border, no drop shadows, balanced padding

## Interaction Rules

- Transitions: 150–200ms, ease-in-out
- No bounce, no parallax

## Error & Empty States

- Errors: explain what went wrong + how to fix, never blame user
- Empty states: provide next action, never feel dead

## Usage

Open `index.html` in a browser to see the design system in action.

All styles are defined in `design-system.css` with clear component classes and CSS variables for easy customization.
