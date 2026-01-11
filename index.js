const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const app = express();
const port = process.env.PORT || 5050;
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
	res.status(200).send('OK');
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
