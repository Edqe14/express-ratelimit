const express = require('express');
const limit = require('../src/limiter.js');
const app = express();

const limiter = limit({
    max: 10,
    timer: 10,
    expire: 20
})
app.use(limiter)

app.get('/', (req, res) => {
    res.status(200).send('Hello World');
});

app.listen(3000, (e) => {
    if(e) throw e;
    console.log('Listening to port 3000')
})