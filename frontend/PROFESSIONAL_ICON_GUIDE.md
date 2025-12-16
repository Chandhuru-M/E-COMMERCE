# Professional Icon Reference Guide

## Icon Specifications

### 1. Dark Mode Toggle Icon (Sun/Moon)

#### Light Mode (Show Sun Icon)
```
- Shape: Circle with rays around it
- Style: Outlined with stroke
- Color: Adapts to theme (black in light, white in dark)
- Size: 24x24px base
```

#### Dark Mode (Show Moon Icon)
```
- Shape: Crescent moon shape
- Style: Filled
- Color: Adapts to theme (black in light, white in dark)
- Size: 24x24px base
```

**Location**: Header/Navigation area
**Component**: `src/components/ThemeToggle.js`

---

### 2. Camera Icon (Barcode Scanner)

#### Default State (Ready to Scan)
```
- Shape: Camera body with lens
- Style: Outlined with stroke
- Color: Theme color (appears in button)
- Size: 16x16px
- Similar to: WhatsApp camera icon
```

#### Scanning State (Active)
```
- Shape: Stop/Square shape
- Style: Filled
- Color: Red/primary color
- Size: 16x16px
- Indicates: Recording/scanning in progress
```

**Location**: Chat Assistant -> Barcode scanning section
**Component**: `src/components/assistant/ChatAssistant.js`

---

### 3. Microphone Icon (Voice Input)

#### Idle State (Ready to Listen)
```
- Shape: Microphone with sound waves
- Style: Outlined with stroke
- Color: Theme color
- Size: 18x18px
- Similar to: Amazon Alexa microphone
```

#### Active State (Listening)
```
- Shape: Microphone with sound waves (animated concept)
- Style: Filled
- Color: Theme color (usually red when active)
- Size: 18x18px
- Indicates: Recording/listening in progress
```

**Locations**: 
- Chat input bar (ChatAssistant.js)
- Voice chat component (VoiceChat.js)

---

## Icon Color Behavior

### Light Mode
- Icons: Black outline or filled
- Background: Sandal/cream (#FFF7F0)
- Buttons: Red primary (#D71920)

### Dark Mode
- Icons: White outline or filled
- Background: Very dark (#0B0B0B)
- Buttons: Red primary (#D71920) with high contrast

---

## Professional Styling Standards

### Icon Properties
- **Stroke Width**: 2px (for outlined icons)
- **Border Radius**: None (geometric shapes)
- **Opacity**: 1.0 (full opaque)
- **Transitions**: 200ms ease-in-out on state change

### Button Integration
- Icon centered within button
- Padding: `--btn-padding-vert` x `--btn-padding-horz`
- Height: `--btn-height` (40px)
- Font size: `--btn-font-size` (14px)

### Accessibility
- All buttons have `aria-label` attributes
- Icons are semantic (represented state, not decorative)
- Proper contrast ratios maintained
- Keyboard accessible

---

## Usage Examples

### Theme Toggle
```html
<button class="theme-toggle" onClick={toggleTheme}>
  <svg><!-- Sun or Moon Icon --></svg>
</button>
```

### Camera Button
```html
<button onClick={() => setIsScanning(!isScanning)}>
  <svg><!-- Camera or Stop Icon --></svg>
  {isScanning ? 'Stop' : 'Scan'}
</button>
```

### Microphone Button
```html
<button className="mic-btn" onClick={startListening}>
  <svg><!-- Microphone Icon --></svg>
  {isListening ? 'Listening...' : 'Speak'}
</button>
```

---

## CSS Variables Applied

```css
/* Icon color uses parent button's color property */
.theme-toggle svg {
  stroke: currentColor;  /* Light mode - black stroke */
  fill: currentColor;    /* Dark mode - white fill */
}

/* Size controlled by viewBox and height/width */
.theme-icon {
  width: 24px;
  height: 24px;
  vertical-align: middle;
}
```

---

## Screenshots/Testing Checklist

### Light Mode
- [ ] Sun icon visible and clear
- [ ] Camera icon shows properly
- [ ] Microphone icon shows properly
- [ ] Icons have black outlines/fills
- [ ] Good contrast on sandal background

### Dark Mode
- [ ] Moon icon visible and clear
- [ ] Camera icon shows properly
- [ ] Microphone icon shows properly
- [ ] Icons have white outlines/fills
- [ ] Excellent contrast on dark background

### Responsive
- [ ] Icons scale properly on mobile
- [ ] Icons visible on tablet
- [ ] Buttons remain clickable
- [ ] Touch targets >= 44px (mobile)

---

## Reference Materials

### Similar Professional UI Systems
- **WhatsApp**: Clean, minimalist icons with subtle animations
- **Amazon Alexa**: Professional microphone UI with state indicators
- **Material Design**: Consistent stroke widths and sizes

### Icon Standards
- All SVGs use `viewBox="0 0 24 24"` for consistency
- Stroke width: 2px for outlined icons
- Fill: Used for solid state indicators
- No gradients or complex fills
