# TODO: Improve UI Design of IA Flowchart Diagram

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

## New Task: UI Design Enhancements
- [ ] Update node fills for color coding: light blue (#dbeafe) for 'page', light green (#dcfce7) for 'action', light orange (#fed7aa) for 'decision'
- [ ] Enhance shadows and hovers: Ensure soft shadow on all nodes, subtle glow on hover
- [ ] Update link rendering to curved bezier paths for smoother edges
- [ ] Improve link labels: Increase font-size to 12px, position above lines with offset
- [ ] Update legend to semi-transparent background (bg-white/90) with rounded border
- [ ] Enhance contrast/spacing: Increase node and link stroke-width to 2.5 default
- [ ] Test visual improvements with sample data (colors, curves, labels, legend)
- [ ] Verify all functionality: zoom/pan, drag, add/delete/edit, refresh
- [ ] Check responsiveness on desktop/laptop sizes
