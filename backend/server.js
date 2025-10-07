const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors({
  origin: [
    'https://ia-mate-repo-y4ob.onrender.com',
  ],
  credentials: true
}));
app.options('*', cors()); // Handle preflight requests for all routes
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Use environment variable

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ia-mate';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define schema for User (authentication and profile)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  username: { type: String },
  phone: { type: String },
  picture: { type: String }
});

const User = mongoose.model('User', UserSchema);

// Define schema for IA data
const IaDataSchema = new mongoose.Schema({
  data: Object,
  createdAt: { type: Date, default: Date.now }
});

const IaData = mongoose.model('IaData', IaDataSchema);

// Define schema for conversations
const ConversationSchema = new mongoose.Schema({
  messages: [{ sender: String, message: String, timestamp: { type: Date, default: Date.now } }],
  createdAt: { type: Date, default: Date.now }
});

const Conversation = mongoose.model('Conversation', ConversationSchema);

app.post('/upload', async (req, res) => {
  try {
    const newIaData = new IaData({ data: req.body });
    await newIaData.save();
    res.json({ message: 'IA uploaded successfully' });
  } catch (error) {
    console.error('Error saving IA data:', error);
    res.status(500).json({ error: 'Failed to save IA data' });
  }
});

app.get('/ia', async (req, res) => {
  try {
    const latest = await IaData.findOne().sort({ createdAt: -1 });
    if (latest) {
      res.json(latest.data);
    } else {
      res.status(404).json({ error: 'No IA data uploaded yet' });
    }
  } catch (error) {
    console.error('Error fetching IA data:', error);
    res.status(500).json({ error: 'Failed to fetch IA data' });
  }
});

app.post('/ai', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyA1blU2ODecZC0caeT2VITn-4MaeuDiVpM`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;
    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Error calling AI API:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});


// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Authentication routes
app.post('/register', async (req, res) => {
  const { email, password, name, username, phone } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    // Check for existing user in MongoDB
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    // Hash password and create user in MongoDB
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      password: hashedPassword,
      name: name || '',
      username: username || '',
      phone: phone || '',
      picture: ''
    });
    await newUser.save();
    const token = jwt.sign({ id: newUser._id, email: newUser.email, name: newUser.name, username: newUser.username, phone: newUser.phone }, JWT_SECRET);
    res.json({ token });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET);
    res.json({ token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.post('/logout', authenticateToken, (req, res) => {
  // In a real app, you might blacklist the token, but for simplicity, just respond
  res.json({ message: 'Logged out successfully' });
});

app.get('/users/:id', authenticateToken, async (req, res) => {
  const userId = req.params.id;
  if (req.user.id !== userId && req.user._id !== userId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  try {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.put('/users/:id', authenticateToken, async (req, res) => {
  const userId = req.params.id;
  if (req.user.id !== userId && req.user._id !== userId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { name, username, phone } = req.body;
  try {
    const updated = await User.findByIdAndUpdate(userId, { name, username, phone }, { new: true });
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Removed OAuth routes as per user request

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const PORT = process.env.PORT || 3003;

app.post('/user/profile-picture', authenticateToken, upload.single('picture'), (req, res) => {
  try {
    const userId = req.user.id;
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // Save the file path relative to server
    const picturePath = `/uploads/${req.file.filename}`;
    users[userIndex].picture = picturePath;
    writeUsers(users);
    res.json({ message: 'Profile picture updated', picture: picturePath });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ error: 'Failed to update profile picture' });
  }
});

app.delete('/user/profile-picture', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    const picturePath = users[userIndex].picture;
    if (!picturePath) {
      return res.status(400).json({ error: 'No profile picture to delete' });
    }
    // Remove picture path from user data
    users[userIndex].picture = '';
    writeUsers(users);
    res.json({ message: 'Profile picture deleted' });
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    res.status(500).json({ error: 'Failed to delete profile picture' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
