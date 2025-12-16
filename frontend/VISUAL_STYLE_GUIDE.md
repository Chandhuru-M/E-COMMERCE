# Ditya Birla Theme - Visual Style Guide

## 🎨 Color Palette

### Primary Brand Colors
```
┌──────────────────────────┐
│  CAPITAL RED             │
│  #D71920                 │
│  RGB(215, 25, 32)        │
│  HSL(359, 79%, 47%)      │
│  Usage: Main buttons,    │
│         links, highlights│
└──────────────────────────┘

┌──────────────────────────┐
│  CORPORATE MAROON        │
│  #7A1225                 │
│  RGB(122, 18, 37)        │
│  HSL(346, 74%, 27%)      │
│  Usage: Hover states,    │
│         active buttons   │
└──────────────────────────┘
```

### Secondary Brand Colors
```
┌──────────────────────────┐
│  WARM SAND               │
│  #F5E2C8                 │
│  RGB(245, 226, 200)      │
│  HSL(27, 77%, 87%)       │
│  Usage: Accents, badges  │
└──────────────────────────┘

┌──────────────────────────┐
│  CREAM                   │
│  #FFF7F0                 │
│  RGB(255, 247, 240)      │
│  HSL(15, 100%, 97%)      │
│  Usage: Light backgrounds│
└──────────────────────────┘
```

### Light Mode Palette
```
Background      #FFFFFF  ████████████████ (Pure White)
Surface         #F8F9FA  ███████████████░ (Off-White)
Surface Alt     #F0F2F5  ██████████████░░ (Light Gray)
Text            #1A1A1A  ░░░░░░░░░░░░░░░░ (Near-Black)
Text Secondary  #4A4A4A  ░░░░░░░░░████░░░ (Medium Gray)
Text Tertiary   #8A8A8A  ░░░░░████████░░░ (Light Gray)
Border          #E5E7EB  █████████████░░░ (Subtle Border)
```

### Dark Mode Palette
```
Background      #0F0F0F  ░░░░░░░░░░░░░░░░ (Pure Black)
Surface         #1A1A1A  ░░░░░░░░░░░░░░░░ (Dark Gray)
Surface Alt     #2D2D2D  ░░░░░░░░░░░░░░░░ (Darker Gray)
Text            #FFFFFF  ████████████████ (Pure White)
Text Secondary  #E0E0E0  ███████████████░ (Light Gray)
Text Tertiary   #B0B0B0  ██████████░░░░░░ (Medium Gray)
Border          #333333  ░░░░░░░░░░░░░░░░ (Dark Border)
```

### Functional Colors
```
Success  #10B981  ████████░░ (Green)   - Confirmations, success states
Warning  #F59E0B  ████████░░ (Yellow)  - Alerts, cautions
Danger   #EF4444  ████████░░ (Red)     - Errors, destructive actions
Info     #3B82F6  ████████░░ (Blue)    - Information, tips
```

## 📐 Spacing System

```
xs    4px   ░░░░
sm    8px   ░░░░░░░░
md   16px   ░░░░░░░░░░░░░░░░
lg   24px   ░░░░░░░░░░░░░░░░░░░░░░░░
xl   32px   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
xxl  48px   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

## 🔲 Border Radius System

```
xs    2px   ████░░░░░░
sm    4px   ██████░░░░
md    8px   ████████░░
lg   12px   ██████████
xl   16px   ████████████
```

## 🎛️ Typography Scale

### Font Families
```
Primary:  Segoe UI, Helvetica Neue, sans-serif
Code:     Fira Code, monospace
```

### Font Sizes
```
xs    12px   ░░░░░
sm    13px   ░░░░░░
base  14px   ░░░░░░░
lg    16px   ░░░░░░░░
xl    18px   ░░░░░░░░░░
2xl   20px   ░░░░░░░░░░░░
3xl   24px   ░░░░░░░░░░░░░░░░
4xl   28px   ░░░░░░░░░░░░░░░░░░
5xl   32px   ░░░░░░░░░░░░░░░░░░░░░░░
```

### Font Weights
```
Light      300
Normal     400
Medium     500
Semibold   600
Bold       700
```

## 💫 Shadow System

```
sm   0 1px 2px 0 rgba(0, 0, 0, 0.05)
     Subtle elevation for cards, inputs

md   0 4px 6px -1px rgba(0, 0, 0, 0.1)
     Standard elevation for components

lg   0 10px 15px -3px rgba(0, 0, 0, 0.1)
     Enhanced elevation for modals

xl   0 20px 25px -5px rgba(0, 0, 0, 0.1)
     Maximum elevation for overlays
```

## ⚡ Animation System

```
fast   150ms ease-in-out   (Micro interactions, hovers)
base   250ms ease-in-out   (Standard state changes)
slow   350ms ease-in-out   (Major animations, modals)
```

## 🔘 Button Styles

### Primary Button
```
┌─────────────────────────────┐
│  Primary Button             │
│  Background: #D71920        │
│  Text: White                │
│  Padding: 8px 16px          │
│  Border-radius: 8px         │
│  Font-weight: 600           │
│                             │
│  Hover: Background #7A1225  │
│  Shadow: md                 │
│  Transform: translateY(-2px)│
└─────────────────────────────┘
```

### Secondary Button
```
┌─────────────────────────────┐
│  Secondary Button           │
│  Background: #F5E2C8        │
│  Text: #1A1A1A              │
│  Border: 1px #E5E7EB        │
│  Padding: 8px 16px          │
│  Border-radius: 8px         │
│                             │
│  Hover: Background #FFF7F0  │
│  Shadow: md                 │
└─────────────────────────────┘
```

### Outline Button
```
┌─────────────────────────────┐
│  Outline Button             │
│  Background: Transparent    │
│  Border: 2px #D71920        │
│  Text: #D71920              │
│  Font-weight: 600           │
│                             │
│  Hover: Background light red│
│         Border #7A1225      │
│         Text #7A1225        │
└─────────────────────────────┘
```

## 📋 Form Elements

### Input Field
```
┌────────────────────────────┐
│ placeholder text           │
├────────────────────────────┤
│ Focused: Border #D71920    │
│ Padding: 8px 16px         │
│ Border-radius: 8px        │
│ Background: #F8F9FA       │
│ Box-shadow: 0 0 0 3px     │
│            (focus color)  │
└────────────────────────────┘
```

## 🎴 Card Component

```
┌──────────────────────────────┐
│  Card Component              │
├──────────────────────────────┤
│                              │
│  Background: #F8F9FA (light) │
│            #1A1A1A (dark)    │
│  Border: 1px #E5E7EB (light) │
│        1px #333333 (dark)    │
│  Border-radius: 12px         │
│  Padding: 24px               │
│  Box-shadow: md              │
│                              │
│  On Hover:                   │
│  - Box-shadow: lg            │
│  - Transform: translateY(-4px)
│                              │
└──────────────────────────────┘
```

## 🚨 Alert/Message Styles

### Alert Success
```
┌──────────────────────────────┐
│ ✓ Success Message            │
├──────────────────────────────┤
│ Background: rgba(16,185,129) │
│ Border-left: 4px #10B981     │
│ Text: #10B981                │
│ Padding: 16px                │
└──────────────────────────────┘
```

### Alert Warning
```
┌──────────────────────────────┐
│ ⚠ Warning Message            │
├──────────────────────────────┤
│ Background: rgba(245,158,11) │
│ Border-left: 4px #F59E0B     │
│ Text: #F59E0B                │
│ Padding: 16px                │
└──────────────────────────────┘
```

### Alert Danger
```
┌──────────────────────────────┐
│ ✕ Error Message              │
├──────────────────────────────┤
│ Background: rgba(239,68,68)  │
│ Border-left: 4px #EF4444     │
│ Text: #EF4444                │
│ Padding: 16px                │
└──────────────────────────────┘
```

## 🔄 Light/Dark Mode Toggle

```
Light Mode                Dark Mode
┌──────────────┐         ┌──────────────┐
│  ☀️ Toggle   │  ←→    │  🌙 Toggle   │
├──────────────┤         ├──────────────┤
│ Background:  │         │ Background:  │
│ #FFFFFF      │         │ #0F0F0F      │
│              │         │              │
│ Text Colors: │         │ Text Colors: │
│ #1A1A1A      │         │ #FFFFFF      │
│ #4A4A4A      │         │ #E0E0E0      │
│ #8A8A8A      │         │ #B0B0B0      │
└──────────────┘         └──────────────┘
```

## 📱 Responsive Breakpoints

```
Mobile        (< 480px)
Tablet        (480px - 768px)
Desktop       (768px - 1024px)
Large Desktop (> 1024px)

All CSS variables scale appropriately
at each breakpoint for consistent
spacing and typography.
```

## ♿ Accessibility Features

```
Focus States:
┌────────────────────────────┐
│  Interactive Element       │
├────────────────────────────┤
│  Outline: 2px solid        │
│  Outline-color: #D71920    │
│  Outline-offset: 2px       │
│  Visible on TAB navigation │
└────────────────────────────┘

Contrast Ratios:
Text on Background: 16:1 (AAA)
Buttons & Links:    7:1  (AA)
UI Components:      4.5:1 (AA)
```

## 🎯 Component Hierarchy

```
Tier 1: Primary Actions
├─ Main CTA Buttons (#D71920)
├─ Add to Cart
└─ Checkout

Tier 2: Secondary Actions
├─ Secondary Buttons (#F5E2C8)
├─ View Details
└─ Filter Options

Tier 3: Tertiary Actions
├─ Links
├─ Cancel
└─ Help Text

UI Elements
├─ Cards & Panels
├─ Alerts & Messages
├─ Forms & Inputs
└─ Navigation
```

## 📊 Consistency Rules

✅ Always use CSS variables
✅ Maintain consistent spacing
✅ Follow button hierarchy
✅ Use proper color contrast
✅ Apply shadows consistently
✅ Smooth all transitions
✅ Test in light AND dark modes
✅ Focus states on all interactive elements

---

**Style Guide Version**: 1.0.0  
**Last Updated**: December 2025  
**Theme**: Ditya Birla Hybrid
