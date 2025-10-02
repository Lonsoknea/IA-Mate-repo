const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ia-mate', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

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

const PORT = 3003;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
