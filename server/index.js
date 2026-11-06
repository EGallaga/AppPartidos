const express = require('express');
const app = express();
const partidos = require('./data/partidos.json');

// Middleware básico
app.use(express.json());

app.get('/api/partidos', (req, res) => {
  res.json(partidos);
});

app.get('/api/', (req, res) => {
  res.send('Hello World!');
});

//app.listen(port, () => {
//  console.log(`Example app listening on port ${port}`);
//});

module.exports = app;