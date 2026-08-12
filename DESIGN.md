---
name: Water Production Data Management System
description: A clear, trustworthy digital operations logbook for production-water recording and review.
colors:
  authority-navy: "#063b66"
  service-blue: "#087ac1"
  service-blue-hover: "#066aa9"
  water-wash: "#eaf6fd"
  canvas-blue-white: "#f4f9fc"
  paper: "#ffffff"
  document-line: "#cfe3ef"
  field-line: "#9bbdce"
  operational-ink: "#102a3b"
  slate-note: "#5b7180"
  verified-green: "#147a4a"
  exception-red: "#b42318"
  keyboard-amber: "#f6b900"
typography:
  headline:
    fontFamily: 'Tahoma, "Noto Sans Thai", sans-serif'
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: 'Tahoma, "Noto Sans Thai", sans-serif'
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: 'Tahoma, "Noto Sans Thai", sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: 'Tahoma, "Noto Sans Thai", sans-serif'
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.4
rounded:
  control: "8px"
  identity: "12px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  section: "24px"
  page: "28px"
components:
  button-primary:
    backgroundColor: "{colors.service-blue}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.service-blue-hover}"
    textColor: "{colors.paper}"
  button-confirm:
    backgroundColor: "{colors.verified-green}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.operational-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  nav-active:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.authority-navy}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
---

# Design System: Water Production Data Management System

## Overview

**Creative North Star: "The Modern Operations Logbook"**

The interface translates a public-utility operations record into a calm digital workspace. It combines the familiarity of an official document—clear dividers, labeled rows, transparent tables, and explicit confirmation—with the speed and legibility expected of a contemporary shift-work application. The visual system should feel accountable, practical, and freshly maintained rather than promotional.

The Provincial Waterworks blue identity anchors navigation and action on a blue-white canvas. Broad work areas keep the current round, previous reading, calculated difference, and validation state visible in one reading path. Content density is purposeful: information is grouped by workflow and ruled like a form, not scattered into a wall of interchangeable dashboard cards.

**Key Characteristics:**

- Public-service blue and white with restrained semantic green, red, and amber.
- Document-like rules, rows, tables, and section bands organize operational detail.
- Tabular numerals stabilize meter readings, time values, and calculated differences.
- Flat, wide work surfaces take precedence over decorative card collections.
- Every important state combines color with text, iconography, shape, or position.

## Colors

The palette pairs authoritative deep blue with bright utility blue and pale water-tinted surfaces; semantic colors are reserved for evidence and action state.

### Primary

- **Authority Navy:** Defines the persistent sidebar, major headings, active navigation text, and institutional identity.
- **Service Blue:** Marks the principal action, links, charts, and water-specific emphasis.
- **Service Blue Hover:** Deepens the primary action on pointer hover without changing its meaning.

### Secondary

- **Water Wash:** A pale blue section band for summaries, table headers, tags, and grouped form instructions.
- **Verified Green:** Communicates completed rounds, valid differences, and final confirmation.
- **Exception Red:** Communicates missing, duplicate, or decreasing meter values.

### Tertiary

- **Keyboard Amber:** A high-contrast focus outline reserved for keyboard navigation.

### Neutral

- **Canvas Blue-White:** The application background, keeping large work areas bright without stark glare.
- **Paper:** The working surface for forms, tables, charts, dialogs, and active navigation.
- **Document Line:** The recurring rule for section boundaries, rows, card edges, and table structure.
- **Field Line:** The stronger control border used where editability must remain obvious.
- **Operational Ink:** Default text for recorded and actionable information.
- **Slate Note:** Secondary instructions, timestamps, units, and supporting metadata.

### Named Rules

**The Operational Color Rule.** Blue establishes structure and action; green and red appear only when the interface has evidence of success or exception.

**The Never Color Alone Rule.** Status color must be accompanied by a label, icon, border, or positional change.

## Typography

**Display Font:** Tahoma (with Noto Sans Thai and generic sans-serif fallbacks)  
**Body Font:** Tahoma (with Noto Sans Thai and generic sans-serif fallbacks)

**Character:** A single pragmatic Thai-capable sans-serif keeps dense operational copy compact and familiar. Hierarchy comes from weight, size, and placement rather than font pairing; numerals use tabular figures wherever values must align or be compared.

### Hierarchy

- **Headline:** Bold and compact, used for page titles; it scales from 24px on smaller screens to 28px on larger screens.
- **Title:** Bold at 18px, used for chart, list, dialog, and major section headings.
- **Body:** Regular at 14px, used for descriptions, values, controls, and table content.
- **Label:** Usually bold at 12px, used for metadata, tags, table context, and compact status text.
- **Metric:** Bold at 30px with tabular figures, used sparingly for the latest high-value readings.

### Named Rules

**The Stable Reading Rule.** Meter readings, differences, dates, times, and numeric table cells use tabular numerals.

**The Weight Before Size Rule.** Prefer bold weight and clear placement to dramatic type-size jumps; this is a working record, not a campaign page.

## Layout

The desktop shell uses a fixed 276px authority-navy sidebar and a flexible main workspace. A 76px station header persists across the top of the workspace. Page content is centered within task-specific maximum widths: approximately 1280px for the overview, 1200px for reports, 980px for recording forms, and 900px for simple administrative placeholders.

The spacing rhythm is based on 4px increments, with 20–24px internal surface padding and 24px between major content groups. Wide status and form sections are divided into rows and columns with visible rules. At large widths, overview content may form asymmetric two-column arrangements; at smaller widths it collapses into a single vertical reading path. The sidebar becomes an off-canvas drawer below the large breakpoint, while report tables retain their minimum width and scroll horizontally.

**The One Reading Path Rule.** Arrange round context, prior value, input, calculated difference, review, and confirmation in the order the operator must inspect them.

**The Wide Surface Rule.** Prefer a ruled full-width section or table when information belongs to one record; do not fragment a single task into decorative cards.

## Elevation & Depth

The system is flat by default. Depth is conveyed primarily through pale tonal bands, borders, dividers, and the contrast between the blue-white canvas and white paper surfaces. Most working containers use a one-pixel document-line ring rather than a shadow. Strong elevation is reserved for the confirmation dialog over a dark navy scrim, making the final commitment unmistakably modal.

### Shadow Vocabulary

- **Confirmation Lift** (`box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25)`): Used only for the final confirmation dialog.

### Named Rules

**The Flat Record Rule.** Routine forms, charts, lists, and reports use lines and tonal grouping; shadows do not decorate ordinary content.

## Shapes

Controls use gently curved 8px corners for reliable affordance without making the interface playful. The product identity tile uses a slightly rounder 12px corner. Pills and circles are reserved for compact tags, avatar marks, progress rounds, and semantic status. Major work surfaces, tables, and dialogs remain square-edged so they read as documents rather than floating consumer-app cards.

**The Curves Mark Controls Rule.** Rounded corners identify things to click, choose, or scan quickly; the record itself stays rectilinear.

## Components

### Buttons

- **Shape:** Gently curved control corners (8px) with compact 10px vertical padding.
- **Primary:** Service blue with white bold text; used for the next workflow action.
- **Confirm:** Verified green with white bold text; reserved for the final save after review.
- **Secondary:** White with an outlined field-blue border and authority-navy text; used to return and edit.
- **Hover / Focus:** Primary blue deepens on hover. Every button receives the shared 3px keyboard-amber focus outline with a 2px offset.

### Chips

- **Style:** Fully rounded pale-blue tags with service-blue bold text communicate informational context such as sample data.
- **State:** Semantic status chips pair green text with a check icon; chips are not used as large navigation controls.

### Cards / Containers

- **Corner Style:** Square for task surfaces, tables, charts, and dialogs.
- **Background:** Paper white over the canvas blue-white page; water-wash bands divide contextual headers.
- **Shadow Strategy:** Flat at rest; use a one-pixel document-line ring or border.
- **Internal Padding:** 20px on compact screens and 24px on medium screens and above.

### Inputs / Fields

- **Style:** White fill, 1px field-line border, 8px radius, and 10px by 12px padding.
- **Numeric Fields:** Right-aligned with tabular figures; the adjacent calculated result receives its own tonal status block.
- **Focus:** Shared keyboard-amber outline is visible outside the control.
- **Error:** Exception-red border, pale red fill where relevant, alert icon, and explicit Thai help text.
- **Disabled:** Reduced opacity and a non-interactive cursor.

### Navigation

The persistent sidebar is authority navy with white and pale-blue text. Items use compact icons and 8px corners. The active route inverts to a paper-white background with authority-navy bold text; hover uses a translucent white wash. Nested station items are tied together with a fine pale-blue vertical rule. Mobile navigation uses the same sidebar as an off-canvas drawer over a navy scrim.

### Record Status Rail

The four scheduled raw-water rounds form a horizontal sequence of circular markers. Completed rounds are filled verified green with a check mark; pending rounds remain white with a stronger blue-gray outline and retain their time label. The rail communicates both completion and schedule without relying on color alone.

### Confirmation Dialog

The dialog is a square paper surface over a navy scrim. It repeats the date and time in a water-wash band, then presents current readings and differences as aligned tabular rows. A brief 220ms clipped reveal gives the transition a procedural, decisive quality and is suppressed when reduced motion is requested.

## Do's and Don'ts

### Do:

- **Do** keep the operator's previous value and calculated difference visible before confirmation.
- **Do** use document lines and pale section bands to group dense operational information.
- **Do** reserve green for validated or completed states and red for actionable exceptions.
- **Do** use tabular numerals for every reading, delta, date, and time comparison.
- **Do** preserve visible keyboard focus and pair semantic colors with text or icons.

### Don't:

- **Don't** turn the overview or forms into a wall of independently floating dashboard cards.
- **Don't** round major record surfaces or add shadows to routine working containers.
- **Don't** use semantic green or red as decorative accents.
- **Don't** hide validation behind a final submit; show issues beside the field and in the calculated result.
- **Don't** introduce oversized display typography, gradients, or promotional imagery into the operations shell.
