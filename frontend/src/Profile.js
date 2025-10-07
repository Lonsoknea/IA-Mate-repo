import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    phone: '',
  });
  // Removed unused showPassword and setShowPassword to fix unused variable warning
  // const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({ id: payload.id, email: payload.email });
      // Fetch full user profile data from backend
      fetch(`https://ia-mate-repo-y4ob.onrender.com/users/${payload.id}`)
        .then((res) => res.json())
        .then((data) => {
          setFormData({
            name: data.name || '',
            email: data.email || '',
            username: data.username || '',
            password: '************',
            phone: data.phone || '',
          });
        })
        .catch(() => {
          // fallback to token payload data if fetch fails
          setFormData({
            name: payload.name || '',
            email: payload.email || '',
            username: payload.username || '',
            password: '************',
            phone: payload.phone || '',
          });
        });
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
      await fetch('https://ia-mate-repo-y4ob.onrender.com/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      // Ignore errors on logout
    }
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const response = await fetch(`https://ia-mate-repo-y4ob.onrender.com/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          phone: formData.phone,
        }),
      });
      if (response.ok) {
        setEditing(false);
      } else {
        console.error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="text-gray-700 text-lg">Loading user information...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => window.location.href = '/'}
            className="text-gray-600 hover:text-gray-900 font-semibold"
            aria-label="Back to home"
          >
            &larr; Back
          </button>
          {editing ? (
            <button
              onClick={() => setEditing(false)}
              className="text-gray-600 hover:text-gray-900"
              aria-label="Cancel edit"
            >
              &#x2190;
            </button>
          ) : (
            <div />
          )}
          <h2 className="text-xl font-bold text-center flex-grow">Edit Profile</h2>
          {editing ? (
            <button
              onClick={handleSave}
              className="text-green-600 hover:text-green-800 font-bold"
              aria-label="Save profile"
            >
              &#x2713;
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-blue-600 hover:text-blue-800 font-bold"
              aria-label="Edit profile"
            >
              Edit
            </button>
          )}
        </div>

        <form>
          <label className="block text-gray-700 font-semibold mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={!editing}
            className={`w-full mb-4 px-4 py-2 rounded border bg-gray-100 cursor-not-allowed`}
          />
          <label className="block text-gray-700 font-semibold mb-1">E mail address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            disabled
            className="w-full mb-4 px-4 py-2 rounded border bg-gray-100 cursor-not-allowed"
          />
          <label className="block text-gray-700 font-semibold mb-1">User name</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            disabled
            className="w-full mb-4 px-4 py-2 rounded border bg-gray-100 cursor-not-allowed"
          />
          <label className="block text-gray-700 font-semibold mb-1">Password</label>
          <div className="relative">
            <input
              type="password"
              name="password"
              value={formData.password}
              disabled
              className="w-full mb-4 px-4 py-2 rounded border bg-gray-100 cursor-not-allowed"
            />
            <div className="absolute right-3 top-3 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
          <label className="block text-gray-700 font-semibold mb-1">Phone number</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            disabled
            className="w-full mb-4 px-4 py-2 rounded border bg-gray-100 cursor-not-allowed"
          />
        </form>

        <button
          onClick={handleLogout}
          className="w-full bg-red-500 text-white py-3 rounded hover:bg-red-600 transition-colors duration-200 font-semibold mt-4"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Profile;
