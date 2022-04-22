const express = require('express');
const cors = require('cors');
const mailers = require('./src/services/mailer')
require('dotenv').config()
const auth = require('./src/middlewares/auth')


const {db, initialize} = require('./src/database/connection');
const app = express();


const port = process.env.PORT || 3030



// app.get('/', (req, res) => {
//   res.json('Hello World!') 
// })
app.use(cors({
  origin: '*'
}));
app.use(express.json());       
app.use(express.urlencoded({ extended: true }))
app.use(auth.keys)


const routes = require('./src/routes')
app.use('/' , routes)

app.use(function(err, req, res, next) {
  res.status(err.status || 500).json({
    message : "Internal server Error"
  })
});
app.get('*', function(req, res){
  res.send('what???', 404);
});
app.post('*', function(req, res){
  res.status(404)
  res.send('what???');
});


// app.listen(port, () => {
//   console.log(`Example app listening on port ${port} ${process.env.FE_URL}`)
// })
 

initialize().then(() => {
  app.listen(port, () => {
        console.log(`Example app listening on port ${port}`)
      })
}).catch(err => {
    console.log(err)
  })

