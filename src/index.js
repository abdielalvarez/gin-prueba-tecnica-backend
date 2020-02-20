const express = require('express');
const cors = require('cors');
const app = express();
// const { config } = require('./config');
// const { port } = config
// const authApi = require('./routes/auth');
// const candiesApi = require('./routes/candies');

// BodyParser
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
})

app.use(cors())

app.get('/', (req, res) => {
    const userInfo = req.header('user-agent');
    res.send(`UserInfo: ${userInfo}`);
});

// Routes

// authApi(app)
// candiesApi(app)

app.get('/result/:palindromic', (req, res) => {
  const { palindromic } = req.params
  const array = [];
  for (var i = 0; i <= palindromic; i++) {     
    const reversed = parseFloat(i.toString().split('').reverse().join('')) * Math.sign(i);    
      if (reversed === i) {
        const object = {}
        object['pal'] = i
        array.push(object)
      }
  }
  res.send(array)
})

const port = 3001
app.listen(port, err => {
    if (err) {
        console.error('Error: ', err);
        return;
    }
    console.log(`Listening http://localhost:${port}`);
});