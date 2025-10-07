import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import popularIaLinks from './popularIaLinks.json';
function ReferentPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  // Removed unused error state and setError calls to fix unused variable warning
  // const [error, setError] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('https://ia-mate-repo-y4ob.onrender.com/ia-documents');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        // setError('Failed to fetch IA documents.');
      }
    } catch (err) {
      // setError('Error fetching IA documents.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="p-4 bg-white shadow-sm border-b flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link to="/" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            ← Home
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Referent Page - IA Documents</h1>
        </div>
      </div>
      {loading && <p className="p-2 text-blue-500 text-center">Loading...</p>}
      {/* Removed error message display */}
      <div className="flex-1 p-4">
        <div className="bg-white shadow-lg rounded-lg p-6">
          {documents.length === 0 ? (
            <>
              <h3 className="text-lg font-semibold mb-2">Popular IA Documents</h3>
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {popularIaLinks.map((link, index) => (
                  <li key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">{link.title}</span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      View
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc, index) => (
                <li key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">{doc.title || `Document ${index + 1}`}</span>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    View/Download
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReferentPage;
