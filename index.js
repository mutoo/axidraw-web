const express = require('express');
const https = require('https');
const fs = require('fs');

const app = express();

app.use(express.static('src'));

const options = {
  key: fs.readFileSync('assets/cert/localhost.key'),
  cert: fs.readFileSync('assets/cert/localhost.crt'),
};

https.createServer(options, app).listen(443);
