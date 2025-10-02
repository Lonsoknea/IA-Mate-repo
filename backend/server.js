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

const PORT = 3003;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
