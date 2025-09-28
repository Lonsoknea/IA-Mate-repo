import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

function App() {
  const [iaData, setIaData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const svgRef = useRef();

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

      const response = await fetch('http://localhost:3001/upload', {
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

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3001/ia');
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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!iaData || error) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 600;

    const tree = d3.tree().size([height, width - 160]);
    const root = d3.hierarchy(iaData);
    const treeData = tree(root);

    const g = svg.append('g')
      .attr('transform', 'translate(80,20)');

    // Links
    g.selectAll('.link')
      .data(treeData.links())
      .enter().append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x))
      .attr('stroke', '#999')
      .attr('fill', 'none');

    // Nodes
    const node = g.selectAll('.node')
      .data(treeData.descendants())
      .enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y},${d.x})`);

    node.append('circle')
      .attr('r', 5)
      .attr('fill', '#fff')
      .attr('stroke', '#000')
      .attr('stroke-width', 1.5);

    node.append('text')
      .attr('dy', '.35em')
      .attr('x', d => d.children ? -13 : 13)
      .attr('text-anchor', d => d.children ? 'end' : 'start')
      .text(d => d.data.name);
  }, [iaData, error]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>IA Tree Diagram</h1>
      <input
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        disabled={loading}
      />
      <button onClick={fetchData} disabled={loading} style={{ marginLeft: '10px' }}>
        Refresh
      </button>
      {loading && <p>Uploading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <svg ref={svgRef} width="800" height="600" style={{ border: '1px solid #ccc', marginTop: '20px' }} />
    </div>
  );
}

export default App;
