import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

function AIChat() {
  const [aiPrompt, setAiPrompt] = useState('');
  const [conversation, setConversation] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');

  const conversationEndRef = useRef(null);

  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollTop = conversationEndRef.current.scrollHeight;
    }
  }, [conversation]);

  useEffect(() => {
    // Load conversations from DB on mount
    fetch('http://localhost:3003/conversations')
      .then(res => res.json())
      .then(data => setConversation(data.messages || []))
      .catch(err => console.error('Failed to load conversations', err));
  }, []);

  // Function to render text with clickable links
  const renderTextWithLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{part}</a>;
      } else {
        return <span key={index}>{part}</span>;
      }
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="p-4 bg-white shadow-sm border-b flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link to="/app" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            ← Diagram
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">AI Chat</h1>
        </div>
      </div>
      {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded border border-red-400 text-center" role="alert">{error}</div>}
      <div className="flex-1 flex flex-col p-4">
        <div ref={conversationEndRef} className="flex flex-col flex-1 overflow-y-auto mb-4 border border-gray-300 bg-white p-4 space-y-2 rounded-md">
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
              // Remove ** signs from AI message
              const cleanedMessage = entry.message.replace(/\*\*/g, '');
              // Replace specific text pattern in AI message
              const modifiedMessage = cleanedMessage.replace(
                /Python is a popular and powerful computer programming language\./g,
                'Python is a " popular and powerful computer programming language" .'
              );
              const parts = parseCodeBlocks(modifiedMessage);
              return (
                <div
                  key={index}
                  className="max-w-full break-words rounded-lg px-4 py-2 whitespace-pre-wrap self-start bg-gray-300 text-gray-900 flex flex-col"
                >
                  {parts.map((part, i) => {
                    if (part.type === 'code') {
                      return <CodeBlock key={i} lang={part.lang} content={part.content} />;
                    } else {
                      return renderTextWithLinks(part.content);
                    }
                  })}
                  <button
                    onClick={() => navigator.clipboard.writeText(modifiedMessage)}
                    className="self-start mt-2 flex items-center space-x-1 text-gray-600 hover:text-gray-900 text-xs"
                    aria-label="Copy AI answer"
                    title="Copy AI answer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <rect x="8" y="8" width="12" height="12" strokeLinecap="round" strokeLinejoin="round" />
                      <rect x="4" y="4" width="12" height="12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Copy</span>
                  </button>
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
  );
}

export default AIChat;
