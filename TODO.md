# TODO: Enhance IA Flowchart Diagram with Comprehensive Keyword Templates and Dashed Links

## Previous Tasks (Completed)
### Add Legend Box
- [x] Add fixed legend panel to App.js with bottom-right positioning and clean card styling
- [x] Populate legend with explanations for shapes and lines using Unicode symbols
- [x] Ensure legend is non-blocking and does not interfere with diagram interactions

### Apply Legend to Nodes and Edges
- [x] Update node rendering in App.js to use dynamic paths based on type: rectangle for 'page', oval for 'action', diamond for 'decision'
- [x] Adjust text positioning and editing input for new shapes to maintain centering
- [x] Keep links as solid lines for direct navigation (default); prepare for dashed if link types added later
- [x] Ensure hover, selection, drag, zoom, and other interactions work with new shapes
- [x] Test rendering with sample data containing different node types
- [x] Verify shapes display correctly, text is centered, and interactions function without issues

### UI Design Enhancements
- [x] Update node fills for color coding: light blue (#dbeafe) for 'page', light green (#dcfce7) for 'action', light orange (#fed7aa) for 'decision'
- [x] Enhance shadows and hovers: Ensure soft shadow on all nodes, subtle glow on hover
- [x] Update link rendering to curved bezier paths for smoother edges
- [x] Improve link labels: Increase font-size to 12px, position above lines with offset
- [x] Update legend to semi-transparent background (bg-white/90) with rounded border
- [x] Enhance contrast/spacing: Increase node and link stroke-width to 2.5 default
- [x] Test visual improvements with sample data (colors, curves, labels, legend)
- [x] Verify all functionality: zoom/pan, drag, add/delete/edit, refresh
- [x] Check responsiveness on desktop/laptop sizes

### Text Input for Auto-Generating IA
- [x] Add state for input text in App.js
- [x] Replace file input with textarea and "Generate IA" button in top bar
- [x] Implement parseTextToIA function to detect types and build JSON tree
- [x] On generate button click: Parse text, setIaData, clear errors
- [x] Keep file upload optional for manual JSON
- [x] Style textarea and button with Tailwind for clean UX
- [x] Test parser with examples (e.g., 'Home page, browse products, if logged in go to profile')
- [x] Verify generation → diagram rendering with shapes/colors/links
- [x] Check full functionality on generated diagram (zoom, drag, add/delete, edit)
- [x] UX validation: Error handling for empty/invalid text, responsive input

### Single-Keyword Input for Predefined Templates
- [x] Replace textarea with single input field for keywords
- [x] Define templates object for keywords like 'e-commerce', 'portfolio', 'blog' with JSON trees
- [x] Update generateIA to lookup keyword, setIaData from template or generic fallback
- [x] Adjust button text to "Generate from Keyword"
- [x] Ensure error handling for unrecognized keywords (use generic template)
- [x] Test templates with inputs (e.g., "e-commerce" → full e-commerce tree renders)
- [x] Verify rendering: Mixed types, labels, shapes/colors/links correct
- [x] Test functionality: Generate → zoom/pan/drag/add/delete on template nodes
- [x] Integration: File upload/refresh overrides generated data
- [x] UX: Responsive input, loading states, no interference with existing features

## New Task: Comprehensive Templates with Dashed Links
- [x] Expand templates: Add 'restaurant', 'university', 'banking app'; enhance existing with linkType 'related' for dashed
- [x] Update genericTemplate to full-featured tree with mixed types and linkTypes
- [x] Modify hierarchyToGraph: Include link type from child.data.linkType in links
- [x] Update D3 link rendering: Apply stroke-dasharray '5,5' for 'related' type
- [x] Test new templates: Input 'restaurant' → renders with solid/dashed links, shapes/colors
- [x] Verify dashed links: Appear dashed, update on drag, interactions preserved
- [x] Test generic fallback: Unrecognized → full generic tree with Checkout/Payment decision
- [x] Full functionality: Zoom/pan/add/delete on complex trees, file upload overrides
- [x] UX: Error shows for unknown, responsive with larger trees, no crashes
