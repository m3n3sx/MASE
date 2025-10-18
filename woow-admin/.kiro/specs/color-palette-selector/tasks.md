# Implementation Plan

- [x] 1. Create base palette selector structure

  - Add new section comment in mase-admin.css for "Color Palette Selector"
  - Create `.mase-palette-selector` container styles
  - Create `.mase-palette-grid` with CSS Grid layout for desktop (5 columns)
  - Set grid gap to 16px using var(--mase-space-base)
  - Add margin spacing using var(--mase-space-xl)
  - _Requirements: 1.1, 1.5_

- [x] 2. Implement palette card base styles

  - Create `.mase-palette-card` with flexbox column layout
  - Apply white background using var(--mase-surface)
  - Add 1px solid border using #e5e7eb (var(--mase-border-light))
  - Set border-radius to 8px using var(--mase-radius-lg)
  - Apply 16px padding using var(--mase-space-base)
  - Add box-shadow using var(--mase-shadow-base)
  - Set transition to all 200ms ease using var(--mase-transition-base)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Create palette card header layout

  - Create `.mase-palette-card-header` with flexbox layout
  - Set justify-content to space-between
  - Set align-items to center
  - Add margin-bottom of 12px using var(--mase-space-md)
  - Set min-height to 24px for badge alignment
  - _Requirements: 2.1_

- [x] 4. Style palette name text

  - Create `.mase-palette-name` styles
  - Set font-size to 14px using var(--mase-font-size-base)
  - Set font-weight to 600 using var(--mase-font-weight-semibold)
  - Apply color using var(--mase-text)
  - Set line-height to 1.4
  - Add flex: 1 for proper spacing
  - Add text overflow handling (ellipsis after 2 lines)
  - _Requirements: 2.1_

- [x] 5. Create active badge styles

  - Create `.mase-palette-badge` with inline-flex display
  - Set padding to 4px 8px using var(--mase-space-xs) and var(--mase-space-sm)
  - Apply background color using var(--mase-primary)
  - Set text color to white
  - Set font-size to 11px using var(--mase-font-size-xs)
  - Set font-weight to 600 using var(--mase-font-weight-semibold)
  - Apply border-radius of 4px using var(--mase-radius-base)
  - Add text-transform: uppercase
  - Add letter-spacing: 0.5px
  - _Requirements: 5.1, 5.4, 5.5_

- [x] 6. Implement color preview container

  - Create `.mase-palette-colors` with flexbox layout
  - Set justify-content to center
  - Set align-items to center
  - Add gap of 4px using var(--mase-space-xs)
  - Set padding to 12px 0 using var(--mase-space-md)
  - Add flex-wrap: wrap for responsiveness
  - _Requirements: 2.2, 2.5_

- [x] 7. Style individual color circles

  - Create `.mase-palette-color` styles
  - Set width and height to 40px
  - Apply border-radius: 50% using var(--mase-radius-full)
  - Add 2px solid white border
  - Apply box-shadow using var(--mase-shadow-sm)
  - Set display to inline-block
  - Add flex-shrink: 0
  - Set transition for transform using var(--mase-transition-base)
  - _Requirements: 2.3, 2.4_

- [x] 8. Create apply button styles

  - Create `.mase-palette-apply-btn` styles
  - Set width to 100%
  - Apply padding of 8px 16px using var(--mase-space-sm) and var(--mase-space-base)
  - Set background to var(--mase-primary)
  - Set color to white
  - Remove border
  - Apply border-radius of 4px using var(--mase-radius-base)
  - Set font-size to 14px using var(--mase-font-size-base)
  - Set font-weight to 500 using var(--mase-font-weight-medium)
  - Add cursor: pointer
  - Set transition using var(--mase-transition-base)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 9. Implement hover states

  - Add `.mase-palette-card:hover` with increased box-shadow (0 4px 12px rgba(0,0,0,0.15))
  - Add transform: translateY(-2px) to card hover
  - Add `.mase-palette-color:hover` with transform: scale(1.1)
  - Add increased box-shadow to color circle hover
  - Add `.mase-palette-apply-btn:hover` with background var(--mase-primary-hover)
  - Add transform: translateY(-1px) to button hover
  - Add box-shadow to button hover
  - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [x] 10. Create active card state styles

  - Add `.mase-palette-card.active` with 2px solid border using var(--mase-primary)
  - Apply background color #f0f6fc to active cards
  - Add enhanced box-shadow with primary color tint
  - Show `.mase-palette-badge` only on active cards
  - _Requirements: 5.2, 5.3_

- [x] 11. Implement focus states for accessibility

  - Add `.mase-palette-apply-btn:focus` with 2px outline using var(--mase-primary)
  - Set outline-offset to 2px
  - Add `.mase-palette-card:focus-within` for keyboard navigation
  - Ensure focus indicators are visible and meet WCAG standards
  - _Requirements: 4.3, 6.3_

- [x] 12. Create tablet responsive styles (768px-1024px)

  - Add media query for tablet breakpoint
  - Change grid to 3 columns using grid-template-columns
  - Maintain all other card styles
  - _Requirements: 1.3_

- [x] 13. Create mobile responsive styles (<768px)

  - Add media query for mobile breakpoint
  - Change grid to 2 columns using grid-template-columns
  - Reduce card padding to 12px
  - Reduce color circle size to 32px width and height
  - Reduce palette name font-size to 13px using var(--mase-font-size-sm)
  - Ensure touch targets remain at least 44px for buttons
  - _Requirements: 1.4, 7.1, 7.2, 7.3, 7.5_

- [x] 14. Add reduced motion support

  - Add @media (prefers-reduced-motion: reduce) query
  - Remove transform animations from hover states
  - Set transition-duration to 0.01ms for all palette elements
  - Maintain layout without animations
  - _Requirements: 7.4_

- [x] 15. Create disabled button state

  - Add `.mase-palette-apply-btn:disabled` styles
  - Set background to var(--mase-border)
  - Add cursor: not-allowed
  - Set opacity to 0.6
  - Remove hover effects when disabled
  - _Requirements: 6.3_

- [x] 16. Add CSS comments and documentation

  - Add section header comment for palette selector
  - Document each component with inline comments
  - Add comments for responsive breakpoints
  - Document color values and their purposes
  - Add usage examples in comments
  - _Requirements: All_

- [x] 17. Create HTML example template

  - Create example HTML structure showing all 10 palettes
  - Include proper data attributes for palette IDs
  - Show active state example
  - Include inline color styles for each palette
  - Add comments explaining structure
  - _Requirements: 8.1-8.10_

- [x] 18. Validate CSS syntax and compatibility
  - Run CSS through validator
  - Check for browser compatibility issues
  - Verify all CSS variables are defined
  - Test fallback values
  - Ensure no syntax errors
  - _Requirements: All_
