# Agent UI Design System

Visual design principles and guidelines for the @deepractice-ai/agent-ui component library.

## Design Philosophy

**Duality of Intelligence**: Rationality & Emotion, Computation & Generation

Our design system embodies the dual nature of AI:

- **Left Brain (Computation)**: Logic, precision, structure → Cool tones
- **Right Brain (Generation)**: Creativity, intuition, flow → Warm tones

## Core Design Principles

### 1. Natural (自然)

- Interfaces must be intuitive and minimize cognitive load
- Components follow familiar patterns and behaviors
- Animations and transitions feel organic and purposeful

### 2. Certain (确定)

- Consistent use of components and patterns across all contexts
- Predictable interactions and visual feedback
- Clear hierarchy and information architecture

### 3. Meaningful (有意义)

- Every element serves a clear purpose
- Immediate feedback for user actions
- Visual elements communicate function, not just decoration

### 4. Clarity (清晰)

- Easy to read typography and well-organized layouts
- Sufficient contrast and whitespace
- Focus on content, minimize visual noise

## Color System

### Design Token Structure

We use a three-tier token system:

```
Primitive Tokens → Semantic Tokens → Component Tokens
(Base palette)   (Purposeful)      (Specific usage)
```

### Primitive Tokens (Base Palette)

#### Cool Spectrum - Computation & Logic

```css
/* Blue - Primary computational intelligence */
--blue-50: #f0f9ff;
--blue-100: #e0f2fe;
--blue-200: #bae6fd;
--blue-300: #7dd3fc;
--blue-400: #38bdf8;
--blue-500: #0ea5e9;
--blue-600: #0284c7; /* Primary */
--blue-700: #0369a1;
--blue-800: #075985;
--blue-900: #0c4a6e;

/* Slate - Structure & foundation */
--slate-50: #f8fafc;
--slate-100: #f1f5f9;
--slate-200: #e2e8f0;
--slate-300: #cbd5e1;
--slate-400: #94a3b8;
--slate-500: #64748b;
--slate-600: #475569;
--slate-700: #334155;
--slate-800: #1e293b;
--slate-900: #0f172a;
```

#### Warm Spectrum - Generation & Creativity

```css
/* Amber - Creative generation */
--amber-50: #fffbeb;
--amber-100: #fef3c7;
--amber-200: #fde68a;
--amber-300: #fcd34d;
--amber-400: #fbbf24;
--amber-500: #f59e0b; /* Generative */
--amber-600: #d97706;
--amber-700: #b45309;
--amber-800: #92400e;
--amber-900: #78350f;

/* Orange - Dynamic interaction */
--orange-50: #fff7ed;
--orange-100: #ffedd5;
--orange-200: #fed7aa;
--orange-300: #fdba74;
--orange-400: #fb923c;
--orange-500: #f97316;
--orange-600: #ea580c;
--orange-700: #c2410c;
--orange-800: #9a3412;
--orange-900: #7c2d12;
```

#### Semantic Colors

```css
/* Success - Task completion */
--green-50: #f0fdf4;
--green-500: #22c55e;
--green-600: #16a34a;

/* Warning - Attention needed */
--yellow-50: #fefce8;
--yellow-500: #eab308;
--yellow-600: #ca8a04;

/* Error - Critical states */
--red-50: #fef2f2;
--red-500: #ef4444;
--red-600: #dc2626;
```

### Semantic Tokens (Purposeful)

#### Brand Colors

```css
--color-primary: var(--blue-600); /* Computational intelligence */
--color-secondary: var(--amber-500); /* Generative creativity */
--color-accent: var(--orange-500); /* Interactive highlights */
```

#### UI Colors

```css
/* Backgrounds */
--color-bg-base: #ffffff;
--color-bg-elevated: var(--slate-50);
--color-bg-muted: var(--slate-100);
--color-bg-subtle: var(--slate-50);

/* Borders */
--color-border-default: var(--slate-200);
--color-border-muted: var(--slate-100);
--color-border-strong: var(--slate-300);

/* Text */
--color-text-primary: var(--slate-900);
--color-text-secondary: var(--slate-600);
--color-text-tertiary: var(--slate-500);
--color-text-inverse: #ffffff;
--color-text-link: var(--blue-600);

/* Interactive States */
--color-focus: var(--blue-500);
--color-hover: var(--slate-100);
--color-active: var(--slate-200);
--color-disabled: var(--slate-300);
```

#### Semantic Intent Colors

```css
--color-success: var(--green-600);
--color-success-bg: var(--green-50);
--color-warning: var(--yellow-600);
--color-warning-bg: var(--yellow-50);
--color-error: var(--red-600);
--color-error-bg: var(--red-50);
--color-info: var(--blue-600);
--color-info-bg: var(--blue-50);
```

### Component Tokens (Specific Usage)

Components inherit semantic tokens and may override for specific needs:

```css
/* Button */
--button-primary-bg: var(--color-primary);
--button-primary-text: var(--color-text-inverse);
--button-secondary-bg: var(--color-secondary);
--button-secondary-text: var(--slate-900);

/* Input */
--input-border: var(--color-border-default);
--input-focus-border: var(--color-focus);
--input-bg: var(--color-bg-base);

/* Badge */
--badge-default-bg: var(--slate-100);
--badge-default-text: var(--slate-700);
--badge-primary-bg: var(--blue-100);
--badge-primary-text: var(--blue-700);
--badge-secondary-bg: var(--amber-100);
--badge-secondary-text: var(--amber-700);
```

## Typography

### Font Families

```css
--font-sans:
  ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-mono: ui-monospace, "JetBrains Mono", "Fira Code", Consolas, monospace;
```

### Type Scale

```css
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
--text-3xl: 1.875rem; /* 30px */
--text-4xl: 2.25rem; /* 36px */
```

### Font Weights

```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Heights

```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

## Spacing System

Based on 4px baseline grid:

```css
--space-0: 0;
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-10: 2.5rem; /* 40px */
--space-12: 3rem; /* 48px */
--space-16: 4rem; /* 64px */
--space-20: 5rem; /* 80px */
--space-24: 6rem; /* 96px */
```

## Border Radius

```css
--radius-none: 0;
--radius-sm: 0.125rem; /* 2px */
--radius-base: 0.25rem; /* 4px */
--radius-md: 0.375rem; /* 6px */
--radius-lg: 0.5rem; /* 8px */
--radius-xl: 0.75rem; /* 12px */
--radius-2xl: 1rem; /* 16px */
--radius-full: 9999px;
```

## Shadows

```css
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
```

## Animation & Transitions

### Duration

```css
--duration-fast: 150ms;
--duration-base: 200ms;
--duration-slow: 300ms;
```

### Easing

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Transitions

```css
--transition-colors:
  color var(--duration-base) var(--ease-in-out),
  background-color var(--duration-base) var(--ease-in-out),
  border-color var(--duration-base) var(--ease-in-out);
--transition-opacity: opacity var(--duration-base) var(--ease-in-out);
--transition-transform: transform var(--duration-base) var(--ease-in-out);
--transition-all: all var(--duration-base) var(--ease-in-out);
```

## Visual Principles in Practice

### 60-30-10 Rule

Apply color proportions strategically:

- **60% - Neutral base** (Slate tones): Backgrounds, containers, structure
- **30% - Primary brand** (Blue): Key UI elements, primary actions
- **10% - Accent** (Amber/Orange): Highlights, CTAs, creative elements

### Contrast & Accessibility

All color combinations must meet WCAG 2.1 AA standards:

- **Normal text**: Minimum contrast ratio of 4.5:1
- **Large text**: Minimum contrast ratio of 3:1
- **UI components**: Minimum contrast ratio of 3:1

### Visual Hierarchy

Establish clear hierarchy through:

1. **Size**: Larger elements draw attention first
2. **Weight**: Bolder typography signals importance
3. **Color**: High-contrast colors create focal points
4. **Spacing**: Whitespace groups related elements

### Responsive Breakpoints

```css
--breakpoint-sm: 640px; /* Mobile landscape */
--breakpoint-md: 768px; /* Tablet portrait */
--breakpoint-lg: 1024px; /* Tablet landscape / Small desktop */
--breakpoint-xl: 1280px; /* Desktop */
--breakpoint-2xl: 1536px; /* Large desktop */
```

## Design Guidelines

### When to Use Cool Colors (Blue/Slate)

- **Computational features**: Code display, terminal output, system messages
- **Data-driven components**: Tables, charts, analytics
- **Structural elements**: Navigation, containers, layouts
- **Rational actions**: Save, export, settings

### When to Use Warm Colors (Amber/Orange)

- **Generative features**: AI responses, creative outputs, suggestions
- **Interactive elements**: Hover states, active selections
- **Creative actions**: Generate, create, compose
- **Highlights**: Important information, warnings, notifications

### Component Color Guidelines

#### Buttons

- **Primary (Blue)**: Main actions, computational tasks
- **Secondary (Amber)**: Creative actions, generative tasks
- **Ghost/Outline**: Subtle, non-committal actions

#### Badges

- **Default (Slate)**: Neutral status, metadata
- **Primary (Blue)**: System status, technical info
- **Secondary (Amber)**: AI-generated tags, dynamic content
- **Destructive (Red)**: Errors, warnings

#### Messages

- **User messages**: Cool tones (Blue accents)
- **AI messages**: Warm tones (Amber accents)
- **System messages**: Neutral (Slate)

## Implementation in Code

### Using CVA (Class Variance Authority)

```tsx
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700", // Computational
        secondary: "bg-amber-500 text-slate-900 hover:bg-amber-600", // Generative
        outline: "border border-slate-200 hover:bg-slate-100",
        ghost: "hover:bg-slate-100 hover:text-slate-900",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-9 px-4 text-base",
        lg: "h-10 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);
```

### Using Tailwind CSS

Configure `tailwind.config.js` to extend with design tokens:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0284c7",
          ...bluePalette,
        },
        secondary: {
          DEFAULT: "#f59e0b",
          ...amberPalette,
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        base: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
      },
    },
  },
};
```

## Accessibility

### Focus Indicators

All interactive elements must have visible focus states:

```css
.focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

### Color Blindness Considerations

- Never rely on color alone to convey information
- Use icons, patterns, or text labels alongside color
- Test with color blindness simulators

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Logical tab order following visual hierarchy
- Clear focus indicators at all times

## Resources

### Design Tools

- **Figma**: Use provided design token plugin
- **Storybook**: Visual component documentation
- **Tailwind CSS**: Utility-first styling

### Color Testing

- [Coolors.co](https://coolors.co): Palette generation
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/): WCAG compliance
- [Sim Daltonism](https://michelf.ca/projects/sim-daltonism/): Color blindness simulator

### Inspiration

- **Ant Design**: Enterprise-grade design system
- **Material Design**: Visual language principles
- **Radix UI**: Unstyled, accessible components
- **Vercel Design**: Modern, minimal aesthetics

## Changelog

### Version 1.0.0 (2024-01-14)

- Initial design system specification
- Defined dual-nature color philosophy (Computation & Generation)
- Established three-tier design token system
- Created comprehensive color palette
- Set typography, spacing, and animation standards
