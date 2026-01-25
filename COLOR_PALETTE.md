# Color Palette Reference

This document describes the color palette used throughout the application. Use these exact color values when asking AI to create or modify components.

## Primary Color Palette

### **Neutral Grays (Main Palette)**
- `bg-white` - Pure white backgrounds
- `bg-neutral-50` / `bg-neutral-50/50` - Very light gray backgrounds (subtle backgrounds)
- `bg-neutral-100` / `bg-neutral-100/80` / `bg-neutral-100/90` - Light gray backgrounds (hover states, active states, cards)
- `bg-neutral-200` / `bg-neutral-200/60` / `bg-neutral-200/80` - Medium-light gray (borders, dividers, icon backgrounds)
- `bg-neutral-400` - Medium gray (disabled states, subtle indicators)
- `bg-neutral-500` - Medium-dark gray (secondary text, status indicators)
- `bg-neutral-600` - Dark gray (default text, icons)
- `bg-neutral-700` - Darker gray (headers, active text)
- `bg-neutral-800` - Very dark gray (primary text, bold labels)
- `bg-neutral-900` / `bg-neutral-900/10` - Almost black (text, overlays)

### **Text Colors**
- `text-neutral-900` - Primary headings, main text
- `text-neutral-800` - Secondary headings, important text
- `text-neutral-700` - Default text, labels
- `text-neutral-600` - Secondary text, icons
- `text-neutral-500` - Tertiary text, descriptions, hints
- `text-neutral-400` - Disabled/placeholder text

### **Border Colors**
- `border-neutral-200` / `border-neutral-200/40` / `border-neutral-200/50` / `border-neutral-200/60` - Subtle borders
- `border-gray-200` - Standard borders (alternative to neutral-200)

### **Ring Colors (Focus/Active States)**
- `ring-neutral-200/50` / `ring-neutral-200/60` - Subtle ring borders

## Accent Colors

### **Status Colors**
- `bg-emerald-500` - Success/online status indicators
- `shadow-emerald-500/50` - Success shadow effects
- `text-green-600` / `bg-green-50` / `text-green-700` - Success states (limited use)

## Background Patterns

### **Gradients**
- `bg-gradient-to-r from-neutral-50/50 to-white` - Header gradients
- `bg-gradient-to-r from-neutral-50/30 to-transparent` - Footer gradients
- `bg-gradient-to-br from-neutral-100 to-neutral-50` - Avatar/icon container gradients

### **Overlays**
- `bg-neutral-900/10` - Modal/overlay backgrounds

## Shadow System

- `shadow-sm` - Subtle shadows (default for cards, buttons)
- `shadow-md` - Medium shadows (mobile buttons, elevated elements)
- `shadow-lg` - Large shadows (hover states)
- `shadow-[0_2px_4px_rgba(0,0,0,0.04)]` - Custom subtle shadow

## Component-Specific Patterns

### **Sidebar**
- Background: `bg-white`
- Border: `border-neutral-200/60` or `border-neutral-200/50`
- Active item: `bg-neutral-100/90 text-neutral-900 shadow-sm ring-1 ring-neutral-200/60`
- Hover: `hover:bg-neutral-50/80`
- Icon container (active): `bg-neutral-200/80`
- Icon container (hover): `group-hover:bg-neutral-100/70`

### **Cards**
- Background: `bg-white`
- Border: `border-gray-200` or `border-neutral-200`
- Shadow: `shadow-sm` or custom subtle shadow
- Rounded: `rounded-xl` or `rounded-lg`

### **Buttons**
- Primary: `bg-gray-900` or `bg-neutral-900`, `text-white`
- Hover: `hover:bg-gray-800` or `hover:bg-neutral-800`
- Secondary: `bg-neutral-100`, `text-neutral-700`
- Active scale: `active:scale-95`

### **Input Fields**
- Background: `bg-gray-50` or `bg-neutral-50`
- Border: `border-gray-200` or `border-neutral-200`
- Focus: `focus:bg-white focus:border-gray-300`
- Text: `text-gray-900` or `text-neutral-900`

### **Tables**
- Border: `border-gray-200` or `border-neutral-200`
- Row hover: `hover:bg-gray-50` or `hover:bg-neutral-50`
- Header text: `text-gray-500` or `text-neutral-500`

## Design Principles

1. **Neutral-First**: Use neutral grays as the primary palette
2. **Subtle Opacity**: Use opacity modifiers (`/50`, `/80`, `/90`) for layered effects
3. **No Bright Colors**: Avoid blue, red, orange, purple - stick to neutral grays
4. **Emerald for Status**: Only use emerald/green for success/online indicators
5. **Consistent Opacity**: Use consistent opacity values across similar elements
6. **Soft Shadows**: All shadows should be subtle and soft
7. **Rounded Corners**: Use `rounded-lg` (8px) or `rounded-xl` (12px)
8. **Smooth Transitions**: Always include `transition-all duration-200`

## Example Usage Prompt

"When creating this component, use the following color palette:
- Backgrounds: white, neutral-50, neutral-100 (with opacity modifiers)
- Text: neutral-800, neutral-700, neutral-600, neutral-500
- Borders: neutral-200 with opacity (40-60)
- Shadows: shadow-sm for subtle elevation
- Active states: bg-neutral-100/90 with ring-neutral-200/60
- Hover states: bg-neutral-50/80 or bg-neutral-100/80
- No bright colors, only neutral grays and emerald-500 for status
- Use rounded-lg or rounded-xl for corners
- Include transition-all duration-200 for smooth animations"
