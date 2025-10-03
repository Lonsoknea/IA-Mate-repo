import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    // Decode token payload (simple base64 decode, no verification here)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({ id: payload.id, email: payload.email });
    } catch {
      setUser(null);
    }
  }, [navigate]);

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      await fetch('http://localhost:3003/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch (err) {
      // Ignore errors on logout
    }
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="text-gray-700 text-lg">Loading user information...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-900">User Profile</h2>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">User ID</label>
          <input
            type="text"
            value={user.id}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">Email</label>
          <input
            type="email"
            value={user.email}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
          />
        </div>
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 text-white py-3 rounded hover:bg-red-600 transition-colors duration-200 font-semibold"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Profile;
