# Design Document

## Overview

The color palette selector is a visual component that displays 10 pre-defined color schemes in a responsive grid layout. Each palette is presented as a card containing the palette name, four color preview circles, an apply button, and an active state indicator. The design leverages the existing MASE CSS framework's design tokens and follows WordPress admin UI conventions.

## Architecture

### Component Structure

```
.mase-palette-selector (Container)
├── .mase-palette-grid (Grid Layout)
    ├── .mase-palette-card (Individual Palette)
    │   ├── .mase-palette-card-header
    │   │   ├── .mase-palette-name
    │   │   └── .mase-palette-badge (Active indicator)
    │   ├── .mase-palette-colors (Color preview area)
    │   │   └── .mase-palette-color (Individual color circle) × 4
    │   └── .mase-palette-card-footer
    │       └── .mase-palette-apply-btn (Apply button)
```

### CSS Organization

The palette selector CSS will be added to the existing `mase-admin.css` file in a dedicated section following the established structure:

1. **Base Styles** - Container and grid layout
2. **Card Styles** - Palette card structure and default state
3. **Color Circle Styles** - Color preview elements
4. **Interactive States** - Hover, focus, and active states
5. **Responsive Styles** - Mobile, tablet, and desktop breakpoints
6. **Accessibility** - Focus indicators and reduced motion support

## Components and Interfaces

### 1. Palette Grid Container

**Purpose:** Provides the responsive grid layout for palette cards

**CSS Class:** `.mase-palette-grid`

**Properties:**
- Display: CSS Grid
- Desktop (>1024px): 5 columns with auto-fill
- Tablet (768-1024px): 3 columns
- Mobile (<768px): 2 columns
- Gap: 16px (var(--mase-space-base))
- Margin: 24px 0 (var(--mase-space-xl))

**Integration:** Uses existing MASE spacing tokens

### 2. Palette Card

**Purpose:** Individual card displaying a single color palette

**CSS Class:** `.mase-palette-card`

**Default State:**
- Background: white (var(--mase-surface))
- Border: 1px solid #e5e7eb (var(--mase-border-light))
- Border-radius: 8px (var(--mase-radius-lg))
- Padding: 16px (var(--mase-space-base))
- Box-shadow: 0 1px 3px rgba(0,0,0,0.1) (var(--mase-shadow-base))
- Display: flex column layout
- Transition: all 200ms ease (var(--mase-transition-base))

**Hover State:**
- Box-shadow: 0 4px 12px rgba(0,0,0,0.15) (var(--mase-shadow-md))
- Transform: translateY(-2px)
- Cursor: pointer

**Active State:**
- Border: 2px solid #0073aa (var(--mase-primary))
- Background: #f0f6fc (custom light blue)
- Box-shadow: 0 4px 12px rgba(0,115,170,0.2)

### 3. Palette Card Header

**Purpose:** Contains palette name and active badge

**CSS Class:** `.mase-palette-card-header`

**Properties:**
- Display: flex with space-between
- Align-items: center
- Margin-bottom: 12px (var(--mase-space-md))
- Min-height: 24px (for badge alignment)

### 4. Palette Name

**Purpose:** Displays the palette name

**CSS Class:** `.mase-palette-name`

**Properties:**
- Font-size: 14px (var(--mase-font-size-base))
- Font-weight: 600 (var(--mase-font-weight-semibold))
- Color: var(--mase-text)
- Line-height: 1.4
- Flex: 1

**Mobile Adjustments:**
- Font-size: 13px (var(--mase-font-size-sm))

### 5. Active Badge

**Purpose:** Indicates the currently active palette

**CSS Class:** `.mase-palette-badge`

**Properties:**
- Display: inline-flex
- Padding: 4px 8px (var(--mase-space-xs) var(--mase-space-sm))
- Background: #0073aa (var(--mase-primary))
- Color: white
- Font-size: 11px (var(--mase-font-size-xs))
- Font-weight: 600 (var(--mase-font-weight-semibold))
- Border-radius: 4px (var(--mase-radius-base))
- Text-transform: uppercase
- Letter-spacing: 0.5px

**Visibility:** Only shown when card has `.active` class

### 6. Color Preview Area

**Purpose:** Container for color circles

**CSS Class:** `.mase-palette-colors`

**Properties:**
- Display: flex
- Justify-content: center
- Align-items: center
- Gap: 4px (var(--mase-space-xs))
- Padding: 12px 0 (var(--mase-space-md))
- Flex-wrap: wrap

### 7. Color Circle

**Purpose:** Individual color preview element

**CSS Class:** `.mase-palette-color`

**Properties:**
- Width: 40px
- Height: 40px
- Border-radius: 50% (var(--mase-radius-full))
- Border: 2px solid white
- Box-shadow: 0 2px 4px rgba(0,0,0,0.1) (var(--mase-shadow-sm))
- Transition: transform 200ms ease (var(--mase-transition-base))
- Display: inline-block
- Flex-shrink: 0

**Hover State:**
- Transform: scale(1.1)
- Box-shadow: 0 4px 6px rgba(0,0,0,0.15)

**Mobile Adjustments:**
- Width: 32px
- Height: 32px

### 8. Apply Button

**Purpose:** Activates the selected palette

**CSS Class:** `.mase-palette-apply-btn`

**Properties:**
- Width: 100%
- Padding: 8px 16px (var(--mase-space-sm) var(--mase-space-base))
- Background: #0073aa (var(--mase-primary))
- Color: white
- Border: none
- Border-radius: 4px (var(--mase-radius-base))
- Font-size: 14px (var(--mase-font-size-base))
- Font-weight: 500 (var(--mase-font-weight-medium))
- Cursor: pointer
- Transition: all 200ms ease (var(--mase-transition-base))

**Hover State:**
- Background: #005a87 (var(--mase-primary-hover))
- Transform: translateY(-1px)
- Box-shadow: 0 2px 4px rgba(0,0,0,0.15)

**Focus State:**
- Outline: 2px solid var(--mase-primary)
- Outline-offset: 2px

**Disabled State (when active):**
- Background: var(--mase-border)
- Cursor: not-allowed
- Opacity: 0.6

## Data Models

### Palette Data Structure

Each palette is defined with the following data attributes that will be applied via inline styles or data attributes:

```html
<div class="mase-palette-card" data-palette-id="professional-blue">
  <div class="mase-palette-card-header">
    <span class="mase-palette-name">Professional Blue</span>
    <span class="mase-palette-badge">Active</span>
  </div>
  <div class="mase-palette-colors">
    <span class="mase-palette-color" style="background-color: #4A90E2;"></span>
    <span class="mase-palette-color" style="background-color: #50C9C3;"></span>
    <span class="mase-palette-color" style="background-color: #7B68EE;"></span>
    <span class="mase-palette-color" style="background-color: #F8FAFC;"></span>
  </div>
  <div class="mase-palette-card-footer">
    <button class="mase-palette-apply-btn">Apply Palette</button>
  </div>
</div>
```

### Palette Definitions

The 10 palettes with their exact color values:

1. **Professional Blue**: `#4A90E2`, `#50C9C3`, `#7B68EE`, `#F8FAFC`
2. **Creative Purple**: `#8B5CF6`, `#A855F7`, `#EC4899`, `#FAF5FF`
3. **Energetic Green**: `#10B981`, `#34D399`, `#F59E0B`, `#ECFDF5`
4. **Sunset**: `#F97316`, `#FB923C`, `#EAB308`, `#FFF7ED`
5. **Rose Gold**: `#E11D48`, `#F43F5E`, `#F59E0B`, `#FFF1F2`
6. **Dark Elegance**: `#6366F1`, `#8B5CF6`, `#EC4899`, `#0F172A`
7. **Ocean**: `#0EA5E9`, `#06B6D4`, `#3B82F6`, `#F0F9FF`
8. **Cyber Electric**: `#00FF88`, `#00CCFF`, `#FF0080`, `#000814`
9. **Golden Sunrise**: `#F59E0B`, `#FBBF24`, `#F97316`, `#FFFBEB`
10. **Gaming Neon**: `#FF0080`, `#8000FF`, `#00FF80`, `#0A0A0A`

## Error Handling

### CSS Fallbacks

1. **Grid Support:** Fallback to flexbox for older browsers
2. **CSS Variables:** Fallback values provided for all custom properties
3. **Transform Support:** Graceful degradation without transforms

### Edge Cases

1. **Long Palette Names:** Text truncation with ellipsis after 2 lines
2. **Missing Colors:** Default gray color (#e5e7eb) if color value is invalid
3. **No Active Palette:** No badge shown, all cards in default state

## Testing Strategy

### Visual Testing

1. **Layout Testing**
   - Verify 5-column grid on desktop (>1024px)
   - Verify 3-column grid on tablet (768-1024px)
   - Verify 2-column grid on mobile (<768px)
   - Check consistent spacing between cards

2. **Card Appearance**
   - Verify all 10 palettes render correctly
   - Check color circles display exact hex values
   - Verify active badge appears only on active card
   - Test hover states on cards and color circles

3. **Responsive Behavior**
   - Test at breakpoints: 320px, 768px, 1024px, 1440px
   - Verify font size adjustments on mobile
   - Check color circle size reduction on mobile
   - Ensure touch targets meet 44px minimum on mobile

### Interaction Testing

1. **Hover States**
   - Card hover: shadow increases, slight lift
   - Color circle hover: scales to 110%
   - Button hover: background darkens, slight lift

2. **Focus States**
   - Button focus: visible outline
   - Keyboard navigation: clear focus indicators
   - Tab order: logical flow through cards

3. **Active State**
   - Active card: blue border, light blue background
   - Active badge: visible and properly positioned
   - Apply button: disabled state when active

### Browser Compatibility

Test in:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

### Accessibility Testing

1. **Color Contrast**
   - Verify WCAG AA compliance for all text
   - Check badge contrast ratio (white on blue)
   - Ensure button text meets contrast requirements

2. **Keyboard Navigation**
   - All interactive elements focusable
   - Logical tab order
   - Enter/Space activates buttons

3. **Screen Reader**
   - Palette names announced correctly
   - Active state communicated
   - Button purpose clear

4. **Reduced Motion**
   - Animations disabled when prefers-reduced-motion is set
   - Transforms removed
   - Transitions minimized

### Performance Testing

1. **Rendering Performance**
   - Initial paint time < 100ms
   - No layout shifts during load
   - Smooth hover animations (60fps)

2. **CSS Size**
   - Palette selector CSS < 5KB uncompressed
   - Efficient selector usage
   - No redundant rules

## Integration Points

### Existing MASE Framework

The palette selector integrates with:

1. **CSS Variables:** Uses all existing MASE design tokens
2. **Section Structure:** Fits within `.mase-section` containers
3. **Responsive System:** Follows existing breakpoint strategy
4. **Accessibility:** Matches MASE focus and interaction patterns

### WordPress Admin

1. **Settings Page:** Renders within MASE settings tabs
2. **Admin Styles:** Compatible with WordPress admin CSS
3. **RTL Support:** Prepared for right-to-left languages

### Future Enhancements

1. **Custom Palettes:** Structure supports user-defined palettes
2. **Palette Preview:** Can add live preview functionality
3. **Palette Export:** Structure supports import/export features
4. **Animation Library:** Can integrate with MASE animation system
