# AI Workflow Platform - Figma Design Guide

## 📋 Overview
This guide will help you recreate the AI Workflow Platform interface in Figma with all the necessary design specifications, components, and styling details.

## 🎨 Design System

### Color Palette

#### Primary Colors
```
Brand Blue: #3B82F6 (rgb(59, 130, 246))
Brand Purple: #8B5CF6 (rgb(139, 92, 246))
Brand Pink: #EC4899 (rgb(236, 72, 153))
```

#### Background Colors
```
Primary Background: Linear gradient from #F8FAFC to #DBEAFE to #E0E7FF
White/95 Backdrop: rgba(255, 255, 255, 0.95) with backdrop blur
Card Background: #FFFFFF
```

#### Text Colors
```
Primary Text: #111827 (Gray-900)
Secondary Text: #374151 (Gray-700) 
Muted Text: #6B7280 (Gray-500)
Light Text: #9CA3AF (Gray-400)
```

#### Status Colors
```
Success: #10B981 (Emerald-500) / #059669 (Emerald-600)
Warning: #F59E0B (Amber-500) / #D97706 (Amber-600)
Error: #EF4444 (Red-500) / #DC2626 (Red-600)
Info: #3B82F6 (Blue-500) / #2563EB (Blue-600)
```

#### UI Element Colors
```
Border Light: rgba(255, 255, 255, 0.3)
Border Gray: #E5E7EB (Gray-200)
Border Focus: #3B82F6 (Blue-500)
Hover Background: rgba(255, 255, 255, 0.7)
```

### Typography

#### Font Family
```
Primary: System UI, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
```

#### Font Sizes & Weights
```
H1 (Page Title): 36px, Font Weight 700 (Bold)
H2 (Section Title): 24px, Font Weight 700 (Bold) 
H3 (Card Title): 20px, Font Weight 700 (Bold)
Body Large: 18px, Font Weight 400 (Regular)
Body: 16px, Font Weight 400 (Regular)
Body Small: 14px, Font Weight 400 (Regular)
Caption: 12px, Font Weight 400 (Regular)
Button: 14px, Font Weight 500 (Medium)
Nav Button: 14px, Font Weight 500 (Medium)
```

### Spacing System

#### Base Unit: 4px
```
XS: 4px (space-x-1, space-y-1)
SM: 8px (space-x-2, space-y-2)
MD: 12px (space-x-3, space-y-3)
LG: 16px (space-x-4, space-y-4)
XL: 20px (space-x-5, space-y-5)
2XL: 24px (space-x-6, space-y-6)
3XL: 32px (space-x-8, space-y-8)
```

#### Container Spacing
```
Page Padding: 24px (px-6)
Card Padding: 24px (p-6)
Section Margin: 32px (mb-8)
Component Gap: 24px (space-x-6)
```

### Border Radius
```
Small: 8px (rounded-lg)
Medium: 12px (rounded-xl)
Large: 16px (rounded-2xl)
Circle: 50% (rounded-full)
```

### Shadows
```
Card Shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
Button Hover: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
Light Shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
```

## 🧩 Component Library

### 1. Navigation Bar
**Dimensions**: Full width × 64px height
**Background**: White/95 with backdrop blur + bottom border
**Content**:
- Logo: 32px × 32px gradient square with rounded corners
- Brand text: "AI Workflow" 
- Navigation buttons with icons
- User avatar + username
- Logout button

### 2. Logo Component
**Size**: 32px × 32px
**Background**: Linear gradient (Blue → Purple → Pink)
**Icon**: Code/development icon in white
**Border Radius**: 8px
**Hover Effect**: Scale 105%

### 3. Navigation Buttons
**States**:
- Active: Dark gradient background, white text, scale 105%
- Inactive: Gray text, transparent background
- Hover: White/70 background, shadow
- Disabled: Gray-400 text, 50% opacity

**Dimensions**: Auto width × 40px height
**Padding**: 16px horizontal, 8px vertical

### 4. Status Badges
**Dimensions**: Auto width × 24px height
**Padding**: 12px horizontal, 4px vertical
**Border Radius**: 50% (fully rounded)

**Variants**:
- Active: Green gradient background
- Draft: Yellow gradient background  
- Inactive: Gray gradient background

### 5. Card Components
**Background**: White
**Border Radius**: 16px
**Shadow**: Large card shadow
**Border**: Light gray (1px)

**Header Section**:
- Gradient background (varies by card type)
- White text
- 24px padding
- Icon + Title layout

**Content Section**:
- White background
- 24px padding
- Body text styling

### 6. Button Components

#### Primary Button
**Background**: Green gradient (Green-500 → Green-600)
**Text**: White, 14px, medium weight
**Padding**: 24px horizontal, 12px vertical
**Border Radius**: 12px
**Hover Effects**: Darker gradient, shadow, translate -2px

#### Secondary Button  
**Background**: Gray gradient (Gray-500 → Gray-600)
**Styling**: Same as primary but with gray colors

#### Icon Button
**Size**: 32px × 32px or 40px × 40px
**Background**: Transparent or light background
**Icon**: 16px or 20px

### 7. Form Elements

#### Input Fields
**Height**: 40px
**Padding**: 12px horizontal, 8px vertical
**Border**: 1px solid Gray-300
**Border Radius**: 6px
**Focus State**: Blue-500 border, blue ring

#### Textarea
**Min Height**: 96px (for 3 rows)
**Padding**: 12px horizontal, 8px vertical
**Resize**: Vertical only

#### Select Dropdown
**Height**: 40px
**Styling**: Same as input fields
**Dropdown**: White background, shadow, border

### 8. Node Components (Workflow Editor)

#### Node Base
**Size**: 120px × 80px
**Background**: White
**Border**: 2px solid
**Border Radius**: 8px
**Shadow**: Light shadow

#### Node Types & Colors
- Start Node: Green border (#10B981)
- Agent Node: Blue border (#3B82F6)  
- Condition Node: Orange border (#F59E0B)
- Human Control Node: Purple border (#8B5CF6)
- End Node: Red border (#EF4444)

### 9. Execution Status Components

#### Status Icons
**Size**: 24px × 24px
**Background**: Colored circle matching status
**Icon**: White symbol inside

#### Status List Cards
**Layout**: Horizontal scroll
**Card Width**: 200px
**Card Height**: 160px
**Background**: Gradient based on status
**Border Radius**: 12px

### 10. Modal/Dialog Components
**Background**: White
**Max Width**: 896px (7xl)
**Height**: 95vh
**Border Radius**: 16px
**Backdrop**: Black with 50% opacity
**Shadow**: Extra large shadow

## 📐 Layout Grid System

### Breakpoints
```
Mobile: < 640px
Tablet: 640px - 1024px  
Desktop: > 1024px
Max Content Width: 1280px (7xl)
```

### Grid Layouts
**3-Column Grid**: Used in Execution View
- Column 1: 33% width (Execution list)
- Column 2-3: 67% width (Details)

**2-Column Grid**: Used in various forms
- Equal columns: 50% each
- Unequal: 33% / 67% split

## 🎯 Page Layouts

### 1. Workflow Manager
- Header with search and create button
- Grid of workflow cards (responsive)
- Each card shows workflow info + actions

### 2. Workflow Editor  
- Left sidebar: Node palette
- Center: Canvas area with zoom controls
- Right sidebar: Node configuration panel
- Bottom: Execution controls

### 3. Execution Manager
- Top: Node execution status (horizontal)
- 3-column layout:
  - Left: Execution history list
  - Right: Execution details + final output

### 4. Human Feedback Modal
- Full screen overlay
- Split layout: Variables (left) + Chat (right)
- Header with node info
- Action buttons at bottom

## 🚀 How to Use This Guide in Figma

### Step 1: Setup
1. Create new Figma file
2. Set up color styles using the color palette above
3. Set up text styles using the typography system
4. Create effect styles for shadows

### Step 2: Create Components
1. Start with basic components (buttons, inputs, cards)
2. Create variants for different states
3. Build complex components using basic ones
4. Use auto-layout for responsive behavior

### Step 3: Build Pages
1. Create frames for each main page
2. Use components to build the layouts
3. Apply consistent spacing using the spacing system
4. Test responsive behavior

### Step 4: Interactive Prototyping
1. Connect pages with overlays for modals
2. Add hover states for buttons
3. Create smooth transitions (300ms duration)
4. Test user flows

## 📱 Responsive Considerations

### Mobile Adaptations
- Stack navigation buttons vertically
- Single column layouts
- Larger touch targets (44px minimum)
- Simplified node editor interface

### Tablet Adaptations  
- 2-column layouts where appropriate
- Maintained card-based interface
- Touch-optimized controls

### Desktop Optimizations
- Full 3-column layouts
- Hover states and tooltips
- Keyboard shortcuts indicators
- Dense information display

## 🎨 Animation Guidelines

### Transitions
- Duration: 200-300ms
- Easing: Ease-out for entrances, ease-in for exits
- Scale: 1.05x for hover effects
- Translate: -2px for button hover (lift effect)

### Loading States
- Pulse animation for loading placeholders
- Spin animation for loading icons
- Smooth fade-ins for content appearance

This guide should give you everything you need to recreate the AI Workflow Platform interface in Figma with high fidelity. Focus on building a solid component system first, then assembling the pages using those components. 