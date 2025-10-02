const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let iaData = null;

app.post('/upload', (req, res) => {
  iaData = req.body;
  res.json({ message: 'IA uploaded successfully' });
});

app.get('/ia', (req, res) => {
  if (iaData) {
    res.json(iaData);
  } else {
    res.status(404).json({ error: 'No IA data uploaded yet' });
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
