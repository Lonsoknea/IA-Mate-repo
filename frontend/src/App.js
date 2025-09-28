import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';

function App() {
  const [iaData, setIaData] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [linkCreation, setLinkCreation] = useState({active: false, sourceId: null});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());
  const svgRef = useRef();
  const zoomRef = useRef();
  const gRef = useRef();
  const simulationRef = useRef();

  const colors = useMemo(() => ['#dbeafe', '#dcfce7', '#f3e8ff', '#fef3c7', '#f0f9ff'], []); // Pastel colors for levels

  const hierarchyToGraph = useCallback((data, collapsed) => {
    const nodes = [];
    const links = [];
    const nodeMap = new Map();

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
      nodeMap.set(d.data.name, id);

      if (parentId !== null) {
        links.push({ source: parentId, target: id, label: d.data.label || '' });
      }

      if (d.children && !collapsed.has(parentId)) {
        d.children.forEach(child => traverse(child, id, depth + 1));
      }
    };

    traverse(root);
    return { nodes, links };
  }, [width, height]);

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
      setGraphData(hierarchyToGraph(iaData, collapsedNodes));
    }
  }, [iaData, hierarchyToGraph, collapsedNodes]);

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

  const toggleCollapse = useCallback((nodeId) => {
    setCollapsedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const addNode = useCallback(() => {
    const newId = graphData.nodes.length;
    const newNode = {
      id: newId,
      name: `New Node ${newId}`,
      x: width / 2 + Math.random() * 100 - 50,
      y: height / 2 + Math.random() * 100 - 50,
      depth: 0,
      fx: null,
      fy: null,
    };
    const newLinks = [...graphData.links];
    if (selectedNodeId !== null) {
      newLinks.push({ source: selectedNodeId, target: newId });
    }
    setGraphData({ nodes: [...graphData.nodes, newNode], links: newLinks });
  }, [graphData, selectedNodeId, width, height]);

  const deleteNode = useCallback(() => {
    if (selectedNodeId === null) return;
    const newNodes = graphData.nodes.filter(n => n.id !== selectedNodeId);
    const newLinks = graphData.links.filter(l => l.source.id !== selectedNodeId && l.target.id !== selectedNodeId);
    setGraphData({ nodes: newNodes, links: newLinks });
    setSelectedNodeId(null);
  }, [graphData, selectedNodeId]);

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

  const startLinkCreation = useCallback((sourceId) => {
    setLinkCreation({ active: true, sourceId });
  }, []);

  const updateDragLine = useCallback((event) => {
    if (!linkCreation.active) return;
    const [x, y] = d3.pointer(event, svgRef.current);
    const sourceNode = graphData.nodes.find(n => n.id === linkCreation.sourceId);
    if (sourceNode && gRef.current) {
      const path = d3.select(gRef.current).select('.drag-line');
      path.attr('d', `M${sourceNode.x},${sourceNode.y}L${x},${y}`);
    }
  }, [linkCreation, graphData]);

  const endLinkCreation = useCallback((event) => {
    if (!linkCreation.active) return;
    const [x, y] = d3.pointer(event, svgRef.current);
    const targetNode = graphData.nodes.find(n => {
      const dx = x - (n.x || width / 2);
      const dy = y - (n.y || height / 2);
      return Math.sqrt(dx * dx + dy * dy) < 60; // Within 60px radius
    });
    if (targetNode && targetNode.id !== linkCreation.sourceId) {
      setGraphData(prev => ({
        ...prev,
        links: [...prev.links, { source: linkCreation.sourceId, target: targetNode.id }]
      }));
    }
    setLinkCreation({ active: false, sourceId: null });
    if (gRef.current) {
      d3.select(gRef.current).select('.drag-line').attr('d', 'M0,0L0,0');
    }
  }, [linkCreation, graphData, width, height]);

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
      .attr('stdDeviation', 3)
      .attr('result', 'coloredBlur');

    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Drag line for edge creation
    g.append('path')
      .attr('class', 'drag-line')
      .attr('stroke', '#999')
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('d', 'M0,0L0,0')
      .style('pointer-events', 'none');

    // Smooth curved links
    const link = g.selectAll('.link')
      .data(graphData.links)
      .enter().append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('marker-end', 'url(#arrowhead)')
      .attr('stroke', '#9ca3af')
      .attr('stroke-width', 2)
      .style('transition', 'stroke 0.3s ease, stroke-width 0.3s ease');

    // Link labels
    const linkLabel = g.selectAll('.link-label')
      .data(graphData.links)
      .enter().append('text')
      .attr('class', 'link-label')
      .attr('font-size', 10)
      .attr('fill', '#6b7280')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('pointer-events', 'none')
      .text(d => d.label || '');

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
        if (d.hasChildren) {
          toggleCollapse(d.id);
        } else {
          setSelectedNodeId(d.id);
        }
      })
      .on('dblclick', (event, d) => {
        event.stopPropagation();
        startEditing(d);
      })
      .on('mouseover', function(event, d) {
        d3.select(this).select('rect')
          .attr('filter', 'url(#glow)')
          .attr('stroke', '#3b82f6')
          .attr('stroke-width', 4);
        // Highlight outgoing links
        g.selectAll('.link').filter(l => l.source.id === d.id)
          .attr('stroke', '#3b82f6').attr('stroke-width', 3);
      })
      .on('mouseout', function(event, d) {
        d3.select(this).select('rect')
          .attr('filter', 'url(#shadow)')
          .attr('stroke', selectedNodeId === d.id ? '#3b82f6' : colors[d.depth % colors.length])
          .attr('stroke-width', selectedNodeId === d.id ? 3 : 2);
        g.selectAll('.link').attr('stroke', '#9ca3af').attr('stroke-width', 2);
      });

    // Animate nodes in with fade and scale up
    node
      .attr('opacity', 0)
      .attr('transform', d => `translate(${(d.x || width / 2)}, ${(d.y || height / 2)}) scale(0.5)`)
      .transition()
      .duration(500)
      .attr('opacity', 1)
      .attr('transform', d => `translate(${(d.x || width / 2)}, ${(d.y || height / 2)}) scale(1)`);

    node.append('rect')
      .attr('width', 140)
      .attr('height', 50)
      .attr('x', -70)
      .attr('y', -25)
      .attr('rx', 10)
      .attr('ry', 10)
      .attr('fill', d => d.type === 'action' ? '#dbeafe' : '#ffffff')
      .attr('stroke', d => selectedNodeId === d.id ? '#3b82f6' : colors[d.depth % colors.length])
      .attr('stroke-width', d => selectedNodeId === d.id ? 3 : 2)
      .attr('filter', 'url(#shadow)');

    node.each(function(d) {
      const group = d3.select(this);
      if (d.id === editingNodeId) {
        const foreignObject = group.append('foreignObject')
          .attr('x', -60)
          .attr('y', -10)
          .attr('width', 120)
          .attr('height', 20);

        foreignObject.append('xhtml:input')
          .attr('type', 'text')
          .attr('value', editingText)
          .style('width', '100%')
          .style('height', '100%')
          .style('border', 'none')
          .style('outline', 'none')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .style('text-align', 'center')
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
          .attr('font-size', '12px')
          .attr('font-weight', 'bold')
          .attr('fill', '#1f2937')
          .text(d => d.name)
          .style('pointer-events', 'none');
      }
    });

    // Force simulation
    simulationRef.current = d3.forceSimulation(graphData.nodes)
      .force('link', d3.forceLink(graphData.links).id(d => d.id).distance(150).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY(height / 2).strength(0.1))
      .force('collide', d3.forceCollide(80))
      .on('tick', ticked);

    function ticked() {
      link.attr('d', linkArc);
      linkLabel
        .attr('x', d => {
          const pathLength = linkArc(d).length;
          const midPoint = pathLength / 2;
          const pathNode = link.node();
          if (pathNode) {
            const point = pathNode.getPointAtLength(midPoint);
            return point.x;
          }
          return (d.source.x + d.target.x) / 2;
        })
        .attr('y', d => {
          const pathLength = linkArc(d).length;
          const midPoint = pathLength / 2;
          const pathNode = link.node();
          if (pathNode) {
            const point = pathNode.getPointAtLength(midPoint);
            return point.y;
          }
          return (d.source.y + d.target.y) / 2;
        });
      node.attr('transform', d => `translate(${d.x || width / 2},${d.y || height / 2})`);
    }

    function linkArc(d) {
      const source = d.source;
      const target = d.target;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dr = Math.hypot(dx, dy) / 2;
      return dr > 0 ? `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}` : `M${source.x},${source.y}L${target.x},${target.y}`;
    }

    function dragstarted(event, d) {
      if (!event.active) simulationRef.current.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = snapToGrid ? Math.round(event.x / 20) * 20 : event.x;
      d.fy = snapToGrid ? Math.round(event.y / 20) * 20 : event.y;
      simulationRef.current.alpha(0.3);
    }

    function dragended(event, d) {
      if (!event.active) simulationRef.current.alphaTarget(0);
      // Keep fixed after drag for now
    }
  }, [graphData, error, width, height, colors, snapToGrid, selectedNodeId]);

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
          <button onClick={zoomIn} className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-700">+</button>
          <button onClick={zoomOut} className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-700">-</button>
          <button onClick={fitToScreen} className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-700">Fit</button>
          <button onClick={resetView} className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-700">Reset</button>
          <button onClick={addNode} className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded text-blue-700">Add</button>
          <button onClick={deleteNode} disabled={selectedNodeId === null} className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 rounded text-red-700 disabled:opacity-50">Del</button>
          <button onClick={() => setSnapToGrid(!snapToGrid)} className={`px-3 py-1 text-sm rounded text-gray-700 ${snapToGrid ? 'bg-green-100' : 'bg-gray-100 hover:bg-gray-200'}`}>Grid</button>
        </div>
      </div>
    </div>
  );
}

export default App;
