# Quick Reference: Ditya Birla Theme CSS Variables

## Color Variables

### Primary Colors
```css
--color-primary-red: #D71920;      /* Main brand color */
--color-primary-maroon: #7A1225;   /* Hover/accent */
```

### Secondary Colors
```css
--color-secondary-sand: #F5E2C8;
--color-secondary-cream: #FFF7F0;
```

### Light Mode (Default)
```css
--color-bg: #FFFFFF;
--color-surface: #F8F9FA;
--color-surface-alt: #F0F2F5;
--color-text: #1A1A1A;
--color-text-secondary: #4A4A4A;
--color-text-tertiary: #8A8A8A;
--color-border: #E5E7EB;
--color-divider: #D1D5DB;
```

### Functional Colors
```css
--color-success: #10B981;
--color-warning: #F59E0B;
--color-danger: #EF4444;
--color-info: #3B82F6;
```

## Spacing Scale

```css
--spacing-xs: 4px;      /* 4px */
--spacing-sm: 8px;      /* 8px */
--spacing-md: 16px;     /* 16px (default padding) */
--spacing-lg: 24px;     /* 24px (section spacing) */
--spacing-xl: 32px;     /* 32px (large spacing) */
--spacing-xxl: 48px;    /* 48px (hero spacing) */
```

## Border Radius

```css
--radius-xs: 2px;       /* Small buttons */
--radius-sm: 4px;       /* Form inputs */
--radius-md: 8px;       /* Cards, chips */
--radius-lg: 12px;      /* Larger components */
--radius-xl: 16px;      /* Modals, large cards */
```

## Typography

```css
--font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
--font-code: 'Fira Code', monospace;

/* Font Sizes */
--font-size-xs: 12px;
--font-size-sm: 13px;
--font-size-base: 14px;
--font-size-lg: 16px;
--font-size-xl: 18px;
--font-size-2xl: 20px;
--font-size-3xl: 24px;
--font-size-4xl: 28px;
--font-size-5xl: 32px;
```

## Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

## Transitions

```css
--transition-fast: 150ms ease-in-out;   /* Micro interactions */
--transition-base: 250ms ease-in-out;   /* Standard changes */
--transition-slow: 350ms ease-in-out;   /* Major animations */
```

## Common Patterns

### Button
```css
.btn-primary {
  background-color: var(--color-primary-red);
  color: white;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.btn-primary:hover {
  background-color: var(--color-primary-maroon);
  box-shadow: var(--shadow-md);
}
```

### Card
```css
.card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.card:hover {
  box-shadow: var(--shadow-md);
}
```

### Form Input
```css
input {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
}

input:focus {
  outline: none;
  border-color: var(--color-primary-red);
  box-shadow: 0 0 0 3px var(--color-focus);
}
```

### Alert
```css
.alert-danger {
  background-color: rgba(239, 68, 68, 0.1);
  border-left: 4px solid var(--color-danger);
  color: var(--color-danger);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}
```

## Dark Mode Override Example

Dark mode is automatically applied when `html.dark-mode` class is present. Colors automatically switch via CSS variables.

```css
/* Light Mode (default) */
.my-component {
  background: var(--color-surface);  /* #F8F9FA */
  color: var(--color-text);          /* #1A1A1A */
}

/* Dark Mode - automatically handled by CSS variables */
html.dark-mode .my-component {
  /* Same selectors, but variables resolve to dark values */
  background: var(--color-surface);  /* #1A1A1A */
  color: var(--color-text);          /* #FFFFFF */
}
```

## Using in JavaScript

```javascript
// Get computed color value
const redColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--color-primary-red')
  .trim(); // "#D71920"

// Use in inline styles
const style = {
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text)',
  padding: 'var(--spacing-md)',
};
```

## Z-Index Stack

```css
--z-dropdown: 1000;
--z-sticky: 1020;
--z-modal: 1050;
--z-popover: 1060;
--z-tooltip: 1070;
```

## Best Practices

✅ **DO:**
- Use CSS variables for all colors
- Use spacing scale consistently
- Combine multiple variables for complex styles
- Test in both light and dark modes

❌ **DON'T:**
- Hardcode color hex values
- Use arbitrary spacing values
- Forget to test dark mode
- Create inconsistent hover states

## Responsive Design

```css
/* Mobile First */
.component {
  padding: var(--spacing-md);
  font-size: var(--font-size-sm);
}

/* Tablet and up */
@media (min-width: 768px) {
  .component {
    padding: var(--spacing-lg);
    font-size: var(--font-size-base);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .component {
    padding: var(--spacing-xl);
  }
}
```

## Testing Theme

```javascript
// Toggle dark mode in browser console
document.documentElement.classList.toggle('dark-mode');

// Check active theme
console.log(document.documentElement.classList.contains('dark-mode'));

// Get specific color
const color = getComputedStyle(document.documentElement)
  .getPropertyValue('--color-primary-red');
```

---

**Quick Access:**
- 📄 Full Documentation: `THEME_DOCUMENTATION.md`
- 🎨 Theme Config: `src/theme/theme.js`
- 🎭 CSS Variables: `src/theme/theme.css`
- ⚙️ Provider: `src/theme/ThemeProvider.js`
