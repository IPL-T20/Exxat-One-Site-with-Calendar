**Add your own guidelines here**

# Accessibility Guidelines (WCAG AA Standard)

All components and interfaces must follow WCAG 2.1 Level AA accessibility standards to ensure the application is usable by everyone, including people with disabilities.

## Icon Accessibility

### Decorative Icons
Icons that are purely decorative (paired with text labels or serving visual purposes only) must include `aria-hidden="true"` to hide them from screen readers.

**Example:**
```tsx
<FontAwesomeIcon name="tableCells" className="text-[#6D28D9]" aria-hidden="true" />
<span>All Sites</span>
```

### Functional Icons
Icons that convey meaning or trigger actions without accompanying text must include:
- `aria-label` with descriptive text
- `role="button"` or appropriate role if interactive

**Example:**
```tsx
<FontAwesomeIcon 
  name="bell" 
  className="cursor-pointer" 
  aria-label="Notifications"
  role="button"
  tabIndex={0}
/>
```

## Color Contrast
- Text and interactive elements must have a contrast ratio of at least **4.5:1** for normal text
- Large text (18pt+ or 14pt+ bold) must have a contrast ratio of at least **3:1**
- Primary brand color #3F51B5 has been tested and meets AA standards on white backgrounds

## Keyboard Navigation
- All interactive elements must be keyboard accessible
- Focus indicators must be clearly visible
- Tab order must follow logical reading order

## Form Labels
- All form inputs must have associated labels
- Use proper `<label>` elements with `htmlFor` attributes
- Error messages must be announced to screen readers

## Semantic HTML
- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<header>`, etc.)
- Heading hierarchy must be logical (h1 → h2 → h3, no skipping levels)
- Use ARIA landmarks when semantic HTML is not sufficient

<!--

System Guidelines

Use this file to provide the AI with rules and guidelines you want it to follow.
This template outlines a few examples of things you can add. You can add your own sections and format it to suit your needs

TIP: More context isn't always better. It can confuse the LLM. Try and add the most important rules you need

# General guidelines

Any general rules you want the AI to follow.
For example:

* Only use absolute positioning when necessary. Opt for responsive and well structured layouts that use flexbox and grid by default
* Refactor code as you go to keep code clean
* Keep file sizes small and put helper functions and components in their own files.

--------------

# Design system guidelines
Rules for how the AI should make generations look like your company's design system

Additionally, if you select a design system to use in the prompt box, you can reference
your design system's components, tokens, variables and components.
For example:

* Use a base font-size of 14px
* Date formats should always be in the format “Jun 10”
* The bottom toolbar should only ever have a maximum of 4 items
* Never use the floating action button with the bottom toolbar
* Chips should always come in sets of 3 or more
* Don't use a dropdown if there are 2 or fewer options

You can also create sub sections and add more specific details
For example:


## Button
The Button component is a fundamental interactive element in our design system, designed to trigger actions or navigate
users through the application. It provides visual feedback and clear affordances to enhance user experience.

### Usage
Buttons should be used for important actions that users need to take, such as form submissions, confirming choices,
or initiating processes. They communicate interactivity and should have clear, action-oriented labels.

### Variants
* Primary Button
  * Purpose : Used for the main action in a section or page
  * Visual Style : Bold, filled with the primary brand color
  * Usage : One primary button per section to guide users toward the most important action
* Secondary Button
  * Purpose : Used for alternative or supporting actions
  * Visual Style : Outlined with the primary color, transparent background
  * Usage : Can appear alongside a primary button for less important actions
* Tertiary Button
  * Purpose : Used for the least important actions
  * Visual Style : Text-only with no border, using primary color
  * Usage : For actions that should be available but not emphasized
-->