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
  const [inputText, setInputText] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  // Store conversation history as array of { sender: 'user' | 'ai', message: string }
  const [conversation, setConversation] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  // Removed aiResponse and setAiResponse state
  const svgRef = useRef();
  const zoomRef = useRef();
  const gRef = useRef();

  const conversationEndRef = useRef(null);

  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollTop = conversationEndRef.current.scrollHeight;
    }
  }, [conversation]);

  const templates = useMemo(() => ({
    'e-commerce': {
      name: 'E-commerce Site',
      type: 'page',
      children: [
        { name: 'Home', type: 'page' },
        { 
          name: 'Browse Products', 
          type: 'action',
          children: [
            { name: 'Product Details', type: 'page' }
          ]
        },
        { name: 'Shopping Cart', type: 'page' },
        { 
          name: 'Checkout', 
          type: 'action',
          label: 'Proceed to payment'
        },
        { 
          name: 'Login Required?', 
          type: 'decision',
          children: [
            { name: 'Login', type: 'action', label: 'User authentication' },
            { name: 'Guest Checkout', type: 'page', linkType: 'related', label: 'Alternative path' }
          ]
        },
        { 
          name: 'Payment Method', 
          type: 'decision',
          children: [
            { name: 'Credit Card', type: 'page', label: 'Choose Card' },
            { name: 'PayPal', type: 'action', label: 'Redirect to PayPal' }
          ]
        },
        { name: 'Order Confirmation', type: 'page' },
        { name: 'User Profile', type: 'page', linkType: 'related' }
      ]
    },
    'portfolio': {
      name: 'Portfolio Site',
      type: 'page',
      children: [
        { name: 'Home', type: 'page' },
        { name: 'About Me', type: 'page' },
        { 
          name: 'Projects', 
          type: 'page',
          children: [
            { name: 'Project 1', type: 'page' },
            { name: 'Project 2', type: 'page' }
          ]
        },
        { name: 'Contact', type: 'page' },
        { name: 'Blog', type: 'page', linkType: 'related' }
      ]
    },
    'blog': {
      name: 'Blog Site',
      type: 'page',
      children: [
        { name: 'Home', type: 'page' },
        { 
          name: 'Posts List', 
          type: 'page',
          children: [
            { name: 'Single Post', type: 'page' }
          ]
        },
        { 
          name: 'Categories', 
          type: 'decision',
          children: [
            { name: 'Technology', type: 'page' },
            { name: 'Design', type: 'page' },
            { name: 'Lifestyle', type: 'page' }
          ]
        },
        { name: 'About', type: 'page' },
        { name: 'Comments Section', type: 'action', linkType: 'related' }
      ]
    },
    'restaurant': {
      name: 'Restaurant Site',
      type: 'page',
      children: [
        { name: 'Home', type: 'page' },
        { name: 'Menu', type: 'page' },
        { 
          name: 'Browse Dishes', 
          type: 'action',
          children: [
            { name: 'Dish Details', type: 'page' }
          ]
        },
        { 
          name: 'Order Online', 
          type: 'decision',
          children: [
            { name: 'Dine In', type: 'page', label: 'Reserve table' },
            { name: 'Takeaway', type: 'action', label: 'Quick order' }
          ]
        },
        { name: 'Reservations', type: 'page' },
        { name: 'Contact', type: 'page', linkType: 'related' },
        { name: 'Reviews', type: 'page' }
      ]
    },
    'university': {
      name: 'University Site',
      type: 'page',
      children: [
        { name: 'Home', type: 'page' },
        { 
          name: 'Admissions', 
          type: 'decision',
          children: [
            { name: 'Apply Online', type: 'action' },
            { name: 'Visit Campus', type: 'page', linkType: 'related' }
          ]
        },
        { name: 'Courses', type: 'page' },
        { 
          name: 'Enroll', 
          type: 'action',
          children: [
            { name: 'Course Details', type: 'page' }
          ]
        },
        { name: 'Library', type: 'page' },
        { name: 'Resources', type: 'page', linkType: 'related' },
        { name: 'Contact', type: 'page' }
      ]
    },
    'banking app': {
      name: 'Banking App',
      type: 'page',
      children: [
        { name: 'Login', type: 'action' },
        { name: 'Dashboard', type: 'page' },
        { 
          name: 'Transfer Funds', 
          type: 'decision',
          children: [
            { name: 'Internal Transfer', type: 'action' },
            { name: 'External Transfer', type: 'page', label: 'To other banks' }
          ]
        },
        { name: 'Account Details', type: 'page' },
        { name: 'Support', type: 'page', linkType: 'related' },
        { name: 'Transactions', type: 'page' }
      ]
    }
  }), []);

  const genericTemplate = useMemo(() => ({
    name: 'Generic Site',
    type: 'page',
    children: [
      { name: 'Home', type: 'page' },
      { name: 'Services', type: 'page' },
      { 
        name: 'Service Selection', 
        type: 'decision',
        children: [
          { name: 'Basic Service', type: 'action' },
          { name: 'Premium Service', type: 'page' }
        ]
      },
      { name: 'Blog', type: 'page', linkType: 'related' },
      { name: 'Login', type: 'action' },
      { name: 'Contact', type: 'page' },
      { 
        name: 'Checkout', 
        type: 'decision',
        children: [
          { name: 'Payment Methods', type: 'page' },
          { name: 'Order Review', type: 'action' }
        ]
      },
      { name: 'Payment', type: 'page' }
    ]
  }), []);

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
        links.push({ 
          source: nodes[parentId], 
          target: nodes[id], 
          label: d.data.label || '', 
          type: d.data.linkType || 'direct' 
        });
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
      setIaData(jsonData);
      setError('');
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
      const response = await fetch('http://localhost:3003/ia');
      if (response.ok) {
        const data = await response.json();
        setIaData(data);
        setError('');
      } else {
        setIaData(null);
        setError('');
      }
    } catch (err) {
      setError('Failed to fetch data.');
    }
  };

  const zoomIn = useCallback(() => {
    if (zoomRef.current) {
      zoomRef.current.scaleBy(d3.select(svgRef.current), 1.2);
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (zoomRef.current) {
      zoomRef.current.scaleBy(d3.select(svgRef.current), 0.8);
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
      zoomRef.current.transform(d3.select(svgRef.current), d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    }
  }, [width, height]);

  const resetView = useCallback(() => {
    if (zoomRef.current) {
      zoomRef.current.transform(d3.select(svgRef.current), d3.zoomIdentity);
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

  const generateIA = useCallback(() => {
    const keyword = inputText.trim().toLowerCase();
    if (!keyword) {
      setError('Please enter a keyword');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let generated;
      if (templates[keyword]) {
        generated = templates[keyword];
      } else {
        generated = genericTemplate;
        setError('Keyword not recognized. Using generic template. Try "e-commerce", "portfolio", or "blog".');
      }
      setIaData(generated);
      // Auto-fit after generation
      setTimeout(() => fitToScreen(), 100);
    } catch (err) {
      setError('Failed to generate IA.');
      setIaData(genericTemplate);
      setTimeout(() => fitToScreen(), 100);
    } finally {
      setLoading(false);
    }
  }, [inputText, templates, genericTemplate, fitToScreen]);

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
      .attr('stroke-dasharray', d => d.type === 'related' ? '5,5' : 'none')
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
          .property('value', editingText)
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
  }, [graphData, error, width, height, colors, snapToGrid, selectedNodeName, startEditing, saveEditing, cancelEditing, editingNodeId, editingText, getNodePath]);

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
        <div className="flex flex-col items-end space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={loading}
              className="w-64 px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none text-sm placeholder-gray-500"
              placeholder="Enter a keyword, e.g., 'e-commerce'"
            />
            <button 
              onClick={generateIA} 
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              Generate from Keyword
            </button>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              disabled={loading}
              className="file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <button 
            onClick={fetchData} 
            disabled={loading} 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 self-end"
          >
            Refresh
          </button>
        </div>
      </div>
      {loading && <p className="p-2 text-blue-500 text-center">Uploading...</p>}
      {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded border border-red-400 text-center" role="alert">{error}</div>}
      <div className="flex-1 relative">
        <svg ref={svgRef} width={width} height={height} className="absolute inset-0 w-full h-full bg-white">
        </svg>
        {/* Floating Toolbar */}
        <div className="absolute top-4 left-4 bg-white shadow-lg rounded-lg p-2 border flex flex-col space-y-1 z-10">
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
        {/* AI Box */}
        <div className="absolute top-0 right-0 h-full w-1/4 bg-white shadow-lg border-l border-gray-200 z-10 flex flex-col p-4 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Box</h3>
          <div ref={conversationEndRef} className="flex flex-col flex-1 overflow-y-auto mb-4 border border-gray-300 bg-white p-2 space-y-2 rounded-md">
            {conversation.map((entry, index) => {
              // Function to parse code blocks in message
              const parseCodeBlocks = (text) => {
                const regex = /```(\w+)?\n([\s\S]*?)```/g;
                const parts = [];
                let lastIndex = 0;
                let match;
                while ((match = regex.exec(text)) !== null) {
                  if (match.index > lastIndex) {
                    parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
                  }
                  parts.push({ type: 'code', lang: match[1] || '', content: match[2] });
                  lastIndex = regex.lastIndex;
                }
                if (lastIndex < text.length) {
                  parts.push({ type: 'text', content: text.substring(lastIndex) });
                }
                return parts;
              };

              // Render code block UI
              const CodeBlock = ({ lang, content }) => {
                const copyCode = () => {
                  navigator.clipboard.writeText(content);
                };
                return (
                  <div className="relative bg-gray-900 text-gray-100 rounded-md p-4 font-mono text-sm overflow-auto my-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold">{lang || 'code'}</span>
                      <button
                        onClick={copyCode}
                        className="text-gray-400 hover:text-white text-xs flex items-center space-x-1"
                        aria-label="Copy code"
                        title="Copy code"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                          <rect x="8" y="8" width="12" height="12" strokeLinecap="round" strokeLinejoin="round" />
                          <rect x="4" y="4" width="12" height="12" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Copy code</span>
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap">{content}</pre>
                  </div>
                );
              };

              if (entry.sender === 'ai') {
                const parts = parseCodeBlocks(entry.message);
                return (
                  <div
                    key={index}
                    className="max-w-full break-words rounded-lg px-4 py-2 whitespace-pre-wrap self-start bg-gray-300 text-gray-900 flex flex-col"
                  >
                    {parts.map((part, i) => {
                      if (part.type === 'code') {
                        return <CodeBlock key={i} lang={part.lang} content={part.content} />;
                      } else {
                        return <span key={i}>{part.content}</span>;
                      }
                    })}
                  </div>
                );
              } else {
                return (
                  <div
                    key={index}
                    className="max-w-full break-words rounded-lg px-4 py-2 whitespace-pre-wrap self-end bg-blue-500 text-white"
                  >
                    <span>{entry.message}</span>
                  </div>
                );
              }
            })}

          </div>
          <div className="relative w-full rounded border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 flex items-center">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="flex-grow p-3 focus:outline-none pr-12 bg-transparent rounded-l text-gray-700"
              placeholder="Send a message"
              disabled={aiLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !aiLoading) {
                  e.preventDefault();
                  if (!aiPrompt.trim()) {
                    setError('Please enter a prompt for AI.');
                    return;
                  }
                  setAiLoading(true);
                  setError('');
                  // Add user message to conversation (append to bottom)
                  setConversation(prev => [...prev, { sender: 'user', message: aiPrompt }]);
                  fetch('http://localhost:3003/ai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: aiPrompt }),
                  })
                    .then(response => {
                      if (!response.ok) {
                        throw new Error('Failed to get AI response');
                      }
                      return response.json();
                    })
                    .then(data => {
                      // Add AI response to conversation (append to bottom)
                      setConversation(prev => [...prev, { sender: 'ai', message: data.response }]);
                      setAiPrompt(''); // Clear input after sending
                    })
                    .catch(() => {
                      setError('Error fetching AI response.');
                    })
                    .finally(() => {
                      setAiLoading(false);
                    });
                }
              }}
            />
            <button
              onClick={async () => {
                if (!aiPrompt.trim()) {
                  setError('Please enter a prompt for AI.');
                  return;
                }
                setAiLoading(true);
                setError('');
                // Add user message to conversation (append to bottom)
                setConversation(prev => [...prev, { sender: 'user', message: aiPrompt }]);
                try {
                  const response = await fetch('http://localhost:3003/ai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: aiPrompt }),
                  });
                  if (!response.ok) {
                    throw new Error('Failed to get AI response');
                  }
                  const data = await response.json();
                  // Add AI response to conversation (append to bottom)
                  setConversation(prev => [...prev, { sender: 'ai', message: data.response }]);
                  setAiPrompt(''); // Clear input after sending
                } catch (err) {
                  setError('Error fetching AI response.');
                } finally {
                  setAiLoading(false);
                }
              }}
              disabled={aiLoading}
              className="p-3 text-gray-600 rounded-r hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center"
              aria-label="Send to AI"
            >
              {aiLoading ? '⏳' : '➤'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
