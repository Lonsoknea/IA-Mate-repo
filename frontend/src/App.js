import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';

function App() {
  const [iaData, setIaData] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [selectedNodeName, setSelectedNodeName] = useState(null);
  const svgRef = useRef();
  const zoomRef = useRef();
  const gRef = useRef();

  const colors = useMemo(() => ['#f8fafc', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b'], []);

  const hierarchyToGraph = useCallback((data) => {
    const nodes = [];
    const links = [];

    // Use tree layout for initial positions to avoid random overlaps
    const treeLayout = d3.tree().size([height - 100, width - 200]);
    const root = d3.hierarchy(data);
    treeLayout(root);

    const traverse = (d, parentId = null, depth = 0) => {
      const id = nodes.length;
      const hasChildren = d.children && d.children.length > 0;
      nodes.push({
        id,
        name: d.data.name,
        type: d.data.type || 'action',
        x: d.y + width / 2, // Horizontal tree
        y: d.x + height / 2,
        depth,
        fx: d.y + width / 2,
        fy: d.x + height / 2,
        hasChildren,
      });

      if (parentId !== null) {
        links.push({ source: nodes[parentId], target: nodes[id], label: d.data.label || '' });
      }

      if (d.children) {
        d.children.forEach(child => traverse(child, id, depth + 1));
      }
    };

    traverse(root);
    return { nodes, links };
  }, [width, height]);

  // Define recursive functions using useCallback to avoid parsing issues
  const addChildToNode = useCallback((root, parentName, newChild) => {
    if (root.name === parentName) {
      root.children = root.children || [];
      root.children.push(newChild);
      return root;
    }
    if (root.children) {
      for (let i = 0; i < root.children.length; i++) {
        const updated = addChildToNode(root.children[i], parentName, newChild);
        if (updated) {
          root.children[i] = updated;
          return root;
        }
      }
    }
    return null;
  }, []);

  const removeNodeByName = useCallback((root, targetName) => {
    if (root.name === targetName) {
      return null; // Remove this node
    }
    if (root.children) {
      root.children = root.children.map(child => removeNodeByName(child, targetName)).filter(Boolean);
      return root;
    }
    return root;
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth - 40);
      setHeight(window.innerHeight - 200);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError('Please select a JSON file.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      const response = await fetch('http://localhost:3002/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData),
      });

      if (response.ok) {
        setIaData(jsonData);
        fetchData();
      } else {
        setError('Failed to upload JSON.');
      }
    } catch (err) {
      setError('Invalid JSON file.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (iaData) {
      setGraphData(hierarchyToGraph(iaData));
    }
  }, [iaData, hierarchyToGraph]);

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3002/ia');
      if (response.ok) {
        const data = await response.json();
        setIaData(data);
        setError('');
      } else {
        setIaData(null);
        setError('No IA data uploaded yet.');
      }
    } catch (err) {
      setError('Failed to fetch data.');
    }
  };

  const zoomIn = useCallback(() => {
    if (zoomRef.current) {
      zoomRef.current.scaleBy(svgRef.current, 1.2);
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (zoomRef.current) {
      zoomRef.current.scaleBy(svgRef.current, 0.8);
    }
  }, []);

  const fitToScreen = useCallback(() => {
    if (gRef.current && svgRef.current) {
      const bounds = gRef.current.getBBox();
      const fullWidth = width;
      const fullHeight = height;
      const midX = (bounds.x + bounds.width / 2);
      const midY = (bounds.y + bounds.height / 2);
      const scale = 0.85;
      const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];
      zoomRef.current.transform(svgRef.current, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    }
  }, [width, height]);

  const resetView = useCallback(() => {
    if (zoomRef.current) {
      zoomRef.current.transform(svgRef.current, d3.zoomIdentity);
    }
  }, []);

  const addNode = useCallback(() => {
    if (!selectedNodeName || !iaData) return;

    const newChild = {
      name: `New Node ${Date.now()}`,
      type: 'action',
      children: []
    };

    const newIaData = JSON.parse(JSON.stringify(iaData)); // Deep copy
    addChildToNode(newIaData, selectedNodeName, newChild);
    setIaData(newIaData);
    setSelectedNodeName(null);
  }, [iaData, selectedNodeName, addChildToNode]);

  const deleteNode = useCallback(() => {
    if (!selectedNodeName || !iaData) return;

    const newIaData = JSON.parse(JSON.stringify(iaData)); // Deep copy
    const updatedRoot = removeNodeByName(newIaData, selectedNodeName);
    if (updatedRoot) {
      setIaData(updatedRoot);
    } else {
      setIaData(null);
    }
    setSelectedNodeName(null);
  }, [iaData, selectedNodeName, removeNodeByName]);

  const startEditing = useCallback((d) => {
    setEditingNodeId(d.id);
    setEditingText(d.name);
  }, []);

  const saveEditing = useCallback(() => {
    if (editingNodeId !== null) {
      setGraphData(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => n.id === editingNodeId ? { ...n, name: editingText } : n)
      }));
      setEditingNodeId(null);
      setEditingText('');
    }
  }, [editingNodeId, editingText]);

  const cancelEditing = useCallback(() => {
    setEditingNodeId(null);
    setEditingText('');
  }, []);

  const getNodePath = useCallback((d) => {
    const w = 80; // half width 160
    const h = 30; // half height 60
    const rx = 8;
    const ry = 8;

    switch (d.type) {
      case 'action':
        // Oval (ellipse)
        return `M ${-w} 0 A ${w} ${h} 0 1 1 ${w} 0 A ${w} ${h} 0 1 1 ${-w} 0 Z`;
      case 'decision':
        // Diamond
        return `M 0 ${-h} L ${w} 0 L 0 ${h} L ${-w} 0 Z`;
      case 'page':
      default:
        // Rounded rectangle
        return `M ${-w + rx} ${-h} h ${w - 2 * rx} a ${rx} ${ry} 0 0 1 ${rx} ${ry} v ${h - 2 * ry} a ${rx} ${ry} 0 0 1 -${rx} ${ry} h ${-(w - 2 * rx)} a ${rx} ${ry} 0 0 1 -${rx} -${ry} v ${-(h - 2 * ry)} a ${rx} ${ry} 0 0 1 ${rx} -${ry} z`;
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!graphData.nodes.length || error) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');
    gRef.current = g.node();

    // Add zoom and pan with smooth transitions
    zoomRef.current = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        if (gRef.current) d3.select(gRef.current).attr('transform', event.transform);
      });

    svg.call(zoomRef.current);

    // Enhanced defs for arrow markers, shadow, and glow
    const defs = svg.append('defs');

    // Arrowhead
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('xoverflow', 'visible')
      .append('path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#6b7280')
      .attr('stroke', 'none');

    // Soft shadow
    const shadowFilter = defs.append('filter')
      .attr('id', 'shadow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    shadowFilter.append('feDropShadow')
      .attr('dx', 1)
      .attr('dy', 1)
      .attr('stdDeviation', 3)
      .attr('flood-color', 'rgba(0,0,0,0.2)');

    // Glow for hover
    const glowFilter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    glowFilter.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', 3)
      .attr('result', 'blur');

    glowFilter.append('feOffset')
      .attr('in', 'blur')
      .attr('dx', 0)
      .attr('dy', 0)
      .attr('result', 'offsetBlur');

    glowFilter.append('feFlood')
      .attr('flood-color', '#3b82f6')
      .attr('flood-opacity', '0.8')
      .attr('result', 'glowColor');

    glowFilter.append('feComposite')
      .attr('in', 'glowColor')
      .attr('in2', 'offsetBlur')
      .attr('operator', 'in')
      .attr('result', 'glowShape');

    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'glowShape');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Curved links for smoother appearance
    const link = g.selectAll('.link')
      .data(graphData.links)
      .enter().append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('marker-end', 'url(#arrowhead)')
      .attr('stroke', '#9ca3af')
      .attr('stroke-width', 2.5)
      .attr('d', linkArc)
      .style('transition', 'stroke 0.3s ease, stroke-width 0.3s ease');

    // Link labels (hidden if empty)
    const linkLabel = g.selectAll('.link-label')
      .data(graphData.links)
      .enter().append('text')
      .attr('class', 'link-label')
      .attr('font-size', 12)
      .attr('fill', '#6b7280')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('x', d => (d.source.x + d.target.x) / 2)
      .attr('y', d => Math.min(d.source.y, d.target.y) - 15)
      .style('pointer-events', 'none')
      .text(d => d.label || '')
      .style('display', d => d.label ? 'block' : 'none')
      .style('text-shadow', '1px 1px 2px rgba(255,255,255,0.8)');

    // Nodes with animations, hover glow
    const node = g.selectAll('.node')
      .data(graphData.nodes)
      .enter().append('g')
      .classed('node', true)
      .attr('opacity', 0)
      .style('transition', 'opacity 0.5s ease')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      )
      .on('click', (event, d) => {
        if (editingNodeId !== null) {
          saveEditing();
        }
        setSelectedNodeName(d.name);
      })
      .on('dblclick', (event, d) => {
        event.stopPropagation();
        startEditing(d);
      })
      .on('mouseover', function(event, d) {
        d3.select(this).select('path')
          .attr('filter', 'url(#glow)')
          .attr('stroke', '#3b82f6')
          .attr('stroke-width', 4);
        // Highlight outgoing links
        g.selectAll('.link').filter(l => l.source.id === d.id)
          .attr('stroke', '#3b82f6').attr('stroke-width', 3.5);
      })
      .on('mouseout', function(event, d) {
        d3.select(this).select('path')
          .attr('filter', 'url(#shadow)')
          .attr('stroke', selectedNodeName === d.name ? '#3b82f6' : colors[d.depth % colors.length])
          .attr('stroke-width', selectedNodeName === d.name ? 4 : 2.5);
        g.selectAll('.link').attr('stroke', '#9ca3af').attr('stroke-width', 2.5);
      });

    // Set node positions directly from tree layout
    node
      .attr('opacity', 0)
      .attr('transform', d => `translate(${d.x}, ${d.y}) scale(0.5)`)
      .transition()
      .duration(500)
      .attr('opacity', 1)
      .attr('transform', d => `translate(${d.x}, ${d.y}) scale(1)`);

    node.append('path')
      .attr('d', getNodePath)
      .attr('fill', d => {
        switch (d.type) {
          case 'page': return '#dbeafe';
          case 'action': return '#dcfce7';
          case 'decision': return '#fed7aa';
          default: return '#f8fafc';
        }
      })
      .attr('stroke', d => selectedNodeName === d.name ? '#3b82f6' : colors[d.depth % colors.length])
      .attr('stroke-width', d => selectedNodeName === d.name ? 4 : 2.5)
      .attr('filter', 'url(#shadow)');

    node.each(function(d) {
      const group = d3.select(this);
      if (d.id === editingNodeId) {
        const foreignObject = group.append('foreignObject')
          .attr('x', -80)
          .attr('y', -30)
          .attr('width', 160)
          .attr('height', 60);

        foreignObject.append('xhtml:input')
          .attr('type', 'text')
          .attr('value', editingText)
          .style('width', '100%')
          .style('height', '100%')
          .style('border', 'none')
          .style('outline', 'none')
          .style('font-size', '14px')
          .style('font-family', 'Inter, system-ui, sans-serif')
          .style('font-weight', 'bold')
          .style('text-align', 'center')
          .style('display', 'flex')
          .style('align-items', 'center')
          .style('justify-content', 'center')
          .on('input', function(event) {
            setEditingText(event.target.value);
          })
          .on('keydown', function(event) {
            if (event.key === 'Enter') {
              saveEditing();
            } else if (event.key === 'Escape') {
              cancelEditing();
            }
          })
          .on('blur', saveEditing);
      } else {
        group.append('text')
          .attr('text-anchor', 'middle')
          .attr('x', 0)
          .attr('y', 0)
          .attr('dy', '.35em')
          .attr('font-size', '14px')
          .attr('font-family', 'Inter, system-ui, sans-serif')
          .attr('font-weight', 'bold')
          .attr('fill', '#1f2937')
          .text(d => d.name)
          .style('pointer-events', 'none');
      }
    });

    function linkArc(d) {
      const source = d.source;
      const target = d.target;
      // Curved bezier line for smoother appearance
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const cp1x = source.x + dx / 3;
      const cp1y = source.y + dy / 2 - 20;
      const cp2x = source.x + 2 * dx / 3;
      const cp2y = target.y - dy / 2 + 20;
      return `M ${source.x} ${source.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${target.x} ${target.y}`;
    }

    function dragstarted(event, d) {
      // No simulation, just start drag
    }

    function dragged(event, d) {
      // Constrain both x and y
      d.x = snapToGrid ? Math.round(event.x / 20) * 20 : event.x;
      d.y = snapToGrid ? Math.round(event.y / 20) * 20 : event.y;
      d3.select(this).attr('transform', `translate(${d.x}, ${d.y})`);
      // Update links
      link.attr('d', linkArc);
      linkLabel
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => Math.min(d.source.y, d.target.y) - 15);
    }

    function dragended(event, d) {
      // No simulation to stop
    }
  }, [graphData, error, width, height, colors, snapToGrid, selectedNodeName, startEditing, saveEditing, cancelEditing, editingNodeId, editingText]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable) {
        return; // Don't interfere with input fields
      }

      switch (event.key) {
        case '+':
        case '=':
          event.preventDefault();
          zoomIn();
          break;
        case '-':
          event.preventDefault();
          zoomOut();
          break;
        case 'f':
        case 'F':
          event.preventDefault();
          fitToScreen();
          break;
        case 'r':
        case 'R':
        case '0':
          event.preventDefault();
          resetView();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, fitToScreen, resetView]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="p-4 bg-white shadow-sm border-b flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">IA Flowchart Diagram</h1>
        <div className="flex items-center space-x-2">
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            disabled={loading}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button 
            onClick={fetchData} 
            disabled={loading} 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>
      {loading && <p className="p-2 text-blue-500 text-center">Uploading...</p>}
      {error && <p className="p-2 text-red-500 text-center">{error}</p>}
      <div className="flex-1 relative">
        <svg ref={svgRef} width={width} height={height} className="absolute inset-0 w-full h-full bg-white">
        </svg>
        {/* Floating Toolbar */}
        <div className="absolute top-4 right-4 bg-white shadow-lg rounded-lg p-2 border flex flex-col space-y-1 z-10">
          <button onClick={zoomIn} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 shadow-sm">+</button>
          <button onClick={zoomOut} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 shadow-sm">-</button>
          <button onClick={fitToScreen} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 shadow-sm">↔</button>
          <button onClick={resetView} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 shadow-sm">⟲</button>
          <button onClick={addNode} className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded text-blue-700 shadow-sm">+</button>
          <button onClick={deleteNode} disabled={selectedNodeName === null} className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 rounded text-red-700 disabled:opacity-50 shadow-sm">×</button>
          <button onClick={() => setSnapToGrid(!snapToGrid)} className={`px-2 py-1 text-xs rounded text-gray-700 shadow-sm ${snapToGrid ? 'bg-green-100' : 'bg-gray-100 hover:bg-gray-200'}`}>⊞</button>
        </div>
        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-white/90 shadow-lg rounded-lg p-4 border border-gray-200 z-10 max-w-xs backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Legend</h3>
          <div className="space-y-1 text-xs text-gray-700">
            <div className="flex items-center space-x-2">
              <span className="text-lg">□</span>
              <span className="text-blue-600">Rectangle = Page / Screen</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">○</span>
              <span className="text-green-600">Oval = Process / Action</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">◇</span>
              <span className="text-orange-600">Diamond = Decision</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono">———</span>
              <span>Solid line = Direct navigation</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono">- - -</span>
              <span>Dashed line = Related link</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
