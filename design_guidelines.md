# Design Guidelines: Note Summarizer Application

## Design Approach
**Reference-Based Approach: Google Gemini**
This application will follow Google Gemini's clean, modern aesthetic characterized by generous whitespace, sophisticated typography hierarchy, and refined component design. Gemini emphasizes clarity, minimalism, and purposeful interactions.

## Typography System
- **Primary Font**: Google Sans (via Google Fonts CDN) for all interface text
- **Hierarchy**:
  - Hero/Page Titles: text-5xl md:text-6xl, font-medium, tracking-tight
  - Section Headers: text-3xl md:text-4xl, font-medium
  - Body Text: text-base md:text-lg, font-normal, leading-relaxed
  - Labels/Metadata: text-sm, font-medium, tracking-wide, uppercase
  - Parameter Controls: text-sm, font-normal
  - Button Text: text-base, font-medium

## Layout System
**Spacing Units**: Use Tailwind units of 4, 6, 8, 12, 16, 20, 24 (e.g., p-4, gap-6, my-12)
- Consistent container: max-w-4xl mx-auto for all three pages
- Generous padding: px-6 md:px-8, py-12 md:py-16
- Vertical rhythm: space-y-8 for major sections, space-y-4 for related elements

## Page Layouts

### 1. Landing/Upload Page
**Structure**:
- Clean header with subtle app branding (top-left, text-xl font-medium)
- Centered content area with generous top padding (pt-20 md:pt-32)
- Hero section:
  - Primary headline: "Summarize Your Notes" (text-5xl md:text-6xl)
  - Subheadline explaining 2000-word limit (text-lg, opacity-70)
  - spacing: space-y-6

**Upload Component**:
- Large drag-and-drop zone (min-h-64)
- Rounded corners (rounded-2xl)
- Dashed border when empty, subtle border when hovering
- Center-aligned icon (document icon from Heroicons, w-16 h-16)
- "Drag and drop or click to upload" text below icon
- File type and size limit text (text-sm, opacity-60)
- Spacing from hero: mt-12

**Parameter Controls Section**:
- Position: Below upload zone (mt-12)
- Layout: Two-column grid (grid grid-cols-1 md:grid-cols-2 gap-6)
- Each parameter control:
  - Label above input (text-sm font-medium, mb-2)
  - Input field with subtle background, rounded-lg, p-3
  - Helper text below (text-xs, opacity-60)
  - Recommended default values displayed

**Primary CTA**:
- Position: Below parameters (mt-8), centered
- Large button (px-8 py-4, rounded-full)
- Text: "Generate Summary"
- Disabled state when no file uploaded

### 2. Loading Page
**Structure**:
- Completely centered content (min-h-screen flex items-center justify-center)
- Vertical stack (space-y-8)

**Loading Spinner**:
- Custom rotating animation (subtle, smooth)
- Size: w-16 h-16
- Positioned centrally above text

**Dynamic Messages**:
- Rotating messages array: ["Analyzing your document...", "Processing chunks...", "Generating summary...", "Almost there...", "Finalizing results..."]
- Text style: text-xl md:text-2xl, font-medium, text-center
- Fade transition between messages (transition-opacity duration-500)
- Message rotation: Every 2.5 seconds

### 3. Summary View Page
**Header Section**:
- Back button (top-left, text-sm with arrow icon)
- "Your Summary" headline (text-4xl font-medium, mt-8)
- Original document metadata (text-sm, opacity-60, mt-2)
  - File name
  - Word count
  - Processing date/time

**Summary Content**:
- Container: mt-12, rounded-2xl, p-8 md:p-12
- Typography: text-lg leading-relaxed
- Paragraph spacing: space-y-6
- Clean, readable presentation with max-width constraint for optimal reading

**Action Buttons**:
- Position: Below summary (mt-12)
- Layout: Horizontal stack (flex gap-4)
- Actions: "Download", "Copy to Clipboard", "Summarize Another"
- Button style: rounded-full, px-6 py-3

## Component Design Principles

**Input Fields**:
- Subtle backgrounds, no heavy borders
- Focus state: slight scale and subtle outline
- Rounded corners: rounded-lg
- Padding: p-3 for standard inputs

**Buttons**:
- Primary: Filled, rounded-full, substantial padding
- Secondary: Outlined, rounded-full, matching padding
- Icons from Heroicons (outline variant, w-5 h-5)

**Cards/Containers**:
- Minimal shadows or borders
- Generous internal padding (p-8 md:p-12)
- Rounded corners: rounded-2xl
- Clean separation through whitespace, not heavy borders

**Upload Zone**:
- Interactive states: subtle scale on hover (hover:scale-[1.02])
- Transition: transition-all duration-200
- Clear visual feedback for drag-over state

## Responsive Behavior
- Mobile-first approach
- Breakpoints: md (768px), lg (1024px)
- Single column on mobile, strategic multi-column on desktop
- Consistent padding scaling (smaller on mobile, larger on desktop)
- Touch-friendly targets (minimum 44x44px)

## Icons
**Library**: Heroicons (outline variant) via CDN
- Document icon for upload zone
- Arrow icons for navigation
- Check/success icons for completion states
- Loading/spinner custom animation

## Accessibility
- Proper heading hierarchy (h1 → h2 → h3)
- ARIA labels for interactive elements
- Focus indicators on all interactive elements
- Sufficient contrast ratios
- Keyboard navigation support

**No Images Required**: This is a utility-focused application where clarity and functionality take precedence over decorative imagery.