# Ditya Birla Hybrid Theme Implementation

## Overview
The frontend has been completely redesigned with the **Ditya Birla Hybrid Theme**, featuring a professional, enterprise-grade UI with full Light/Dark Mode support.

## Color Palette

### Primary Colors
- **Capital Red**: `#D71920` - Main brand color for buttons, links, and highlights
- **Corporate Maroon**: `#7A1225` - Accent and hover states for depth

### Secondary Colors
- **Warm Sand**: `#F5E2C8` - Subtle background accents
- **Cream**: `#FFF7F0` - Light background elements

### Light Mode (Default)
- **Background**: `#FFFFFF` (Pure White)
- **Surface**: `#F8F9FA` (Off-white for cards)
- **Text**: `#1A1A1A` (Near-black for readability)
- **Text Secondary**: `#4A4A4A` (Medium gray)
- **Text Tertiary**: `#8A8A8A` (Light gray)
- **Border**: `#E5E7EB` (Subtle border color)

### Dark Mode
- **Background**: `#0F0F0F` (Pure Black)
- **Surface**: `#1A1A1A` (Dark gray for cards)
- **Text**: `#FFFFFF` (Pure White)
- **Text Secondary**: `#E0E0E0` (Light gray)
- **Text Tertiary**: `#B0B0B0` (Medium gray)
- **Border**: `#333333` (Dark border)

## Key Features

### 1. Light/Dark Mode Toggle
- Located in the header next to user menu
- Automatically detects system preference on first visit
- Saves user preference to localStorage
- Smooth transitions between modes

### 2. Professional Typography
- Font Family: Segoe UI, Helvetica Neue (system fonts for optimal performance)
- Font Sizes: 5 scale levels from 12px to 32px
- Font Weights: Light (300) to Bold (700)
- Proper line heights for readability

### 3. Consistent Spacing
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **xxl**: 48px

### 4. Border Radius Scale
- **xs**: 2px
- **sm**: 4px
- **md**: 8px
- **lg**: 12px
- **xl**: 16px

### 5. Elevation System (Shadows)
- **sm**: Subtle shadow for interactive elements
- **md**: Standard elevation for cards and modals
- **lg**: Enhanced elevation for overlays
- **xl**: Maximum elevation for top-level overlays

### 6. Smooth Transitions
- **fast**: 150ms for micro-interactions
- **base**: 250ms for standard animations
- **slow**: 350ms for significant changes

## Component Updates

### Header
- Professional navigation bar with improved spacing
- Theme toggle button for mode switching
- Better responsive layout
- Proper color hierarchy

### Footer
- Redesigned with sections for About, Quick Links, and Contact
- Professional typography and spacing
- Smooth border and background colors

### Cards
- Enhanced shadow effects
- Smooth hover animations with subtle elevation changes
- Improved border styling with theme-aware colors

### Buttons
- Three button styles: Primary, Secondary, Outline
- Consistent padding and typography
- Smooth hover and active states
- Accessibility focus states

### Forms & Inputs
- Theme-aware borders and backgrounds
- Focus states with colored outline
- Disabled state styling
- Placeholder text coloring

### Alerts & Badges
- Color-coded for different message types
- Success (Green), Warning (Yellow), Danger (Red), Info (Blue)
- Consistent padding and typography

## CSS Variables Usage

All colors and spacing are defined as CSS variables in `src/theme/theme.css`:

```css
:root {
  --color-primary-red: #D71920;
  --color-primary-maroon: #7A1225;
  --color-bg: #FFFFFF;
  --color-surface: #F8F9FA;
  --color-text: #1A1A1A;
  /* ...more variables */
}

html.dark-mode {
  --color-bg: #0F0F0F;
  --color-surface: #1A1A1A;
  /* ...dark mode overrides */
}
```

## File Structure

```
src/
├── theme/
│   ├── theme.js           # Theme configuration object
│   ├── theme.css          # CSS variables and base styles
│   └── ThemeProvider.js   # React context for theme management
├── components/
│   ├── ThemeToggle.js     # Theme toggle button component
│   ├── ThemeToggle.css    # Toggle button styles
│   └── ...                # Other components
├── App.js                 # Updated with ThemeProvider wrapper
├── App.css                # Updated with CSS variables
└── ChatAssistant.css      # Updated with theme colors
```

## How to Use CSS Variables

### In CSS Files
```css
.my-element {
  background-color: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}
```

### In JavaScript (for inline styles)
```javascript
const styles = {
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text)',
  padding: 'var(--spacing-md)',
};
```

## Customization Guide

### Changing Primary Colors
Edit `src/theme/theme.js`:
```javascript
primary: {
  red: '#YOUR_COLOR_1',
  maroon: '#YOUR_COLOR_2',
}
```

Then update `src/theme/theme.css`:
```css
--color-primary-red: #YOUR_COLOR_1;
--color-primary-maroon: #YOUR_COLOR_2;
```

### Adding New Colors
1. Add to `src/theme/theme.js` in the colors object
2. Add CSS variable to `src/theme/theme.css`
3. Use in components via `var(--color-new-color)`

### Adjusting Spacing
Modify the spacing values in `src/theme/theme.js` and `src/theme/theme.css`:
```javascript
spacing: {
  md: '16px',  // Change this value
}
```

## Accessibility Features

- ✅ High contrast ratios for text readability
- ✅ Focus states visible on all interactive elements
- ✅ Semantic HTML structure maintained
- ✅ Respects `prefers-reduced-motion` for animations
- ✅ Proper ARIA labels on dynamic content

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari, Chrome Mobile

## Performance Optimizations

- CSS variables for efficient theme switching (no page reload)
- Hardware acceleration for smooth animations
- Optimized shadows and gradients
- Minimal repaints during transitions

## Best Practices

1. **Always use CSS variables** instead of hardcoding colors
2. **Maintain consistent spacing** using the spacing scale
3. **Use semantic color names** (danger, success, warning, info)
4. **Test in both light and dark modes** during development
5. **Ensure sufficient contrast** for accessibility
6. **Use the theme configuration** for all new components

## Testing Dark Mode

1. Click the theme toggle in the header
2. Or use browser DevTools:
   ```javascript
   document.documentElement.classList.add('dark-mode');
   // or
   document.documentElement.classList.remove('dark-mode');
   ```

## Troubleshooting

### Colors not updating on mode switch
- Ensure component imports `theme.css`
- Check that CSS variables are used instead of hardcoded colors
- Verify ThemeProvider wraps entire app

### Old colors still visible
- Clear browser cache
- Check for hardcoded color values in component CSS
- Search for hex color codes (#) in CSS files

### Theme toggle not working
- Ensure ThemeProvider is wrapping the Router
- Check browser console for JavaScript errors
- Verify localStorage is not disabled

## Future Enhancements

- [ ] Custom theme builder UI
- [ ] More predefined themes
- [ ] Theme scheduling (auto dark mode at night)
- [ ] Per-component theme overrides
- [ ] Theme export/import functionality

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Theme**: Ditya Birla Hybrid (Light + Dark Mode)
