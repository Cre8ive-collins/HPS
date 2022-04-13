const { Router } = require('express')
const mailers = require('../../services/mailer') 
const auth = require('../../middlewares/auth')
const bcrypt = require('bcrypt');
const { Users, Admin, Admission_officers } = require('../../database/connection')
const jwt = require('jsonwebtoken')



const route = Router()

function resolve (res) {
  res.json({
    "data" : {
      "Hilton Parker API": {
        "Language": 'JavaScript',
        "Framework": "NodeJs",
        "Author": "Collins Wilson",
        "Server" : "Express",
  
        "link": 'https://collinswilson.tech'
      }
    },
    "message" : "Successfull"
    
  })
}

route.get('/', auth.auth, (req, res) => {
  setTimeout(resolve, 100, res)
 
})

route.use('/auth', require('./auth'))

route.post('/apply',  (req, res) => {
    Users.create(
      { 
        first_name: req.body.first_name , 
        last_name: req.body.last_name ,  
        email : req.body.email,
        phone : req.body.phone,
        application_status : 0
      }).then(async (user) => {
        let link = jwt.sign({ id: user.id}, process.env.TOKEN_SECRET)
        await mailers.newApplication(req.body, link).catch(err => console.log(err))
        let data = {
          "data" : {user, link},
          message : "Application Successfull, Check your email for futher instructions "
        }
        res.status(200).json(data)
      }).catch(err=> {
        res.status(400).json({
          message : err.errors && err.errors[0].message.includes("email must be unique") ? "Email has already been used" : err.errors[0].message
        })
      }
      )
})

route.put('/apply',  (req, res) => {
    let data = req.body.data
    let id = req.body.id
    console.log(req.body)
    Users.update( data , 
      { where : {
        id : id
      }})
      .then((resu) => {
        Users.findOne({ where: { id: id } }).then((user) => {
          res.status(200).json({
            data : {user},
            message : "Application Updated"
          })
        }).catch(err => {
          console.log(err)
          res.status(401).json({
            message : "bad query"
          })
        })
      }).catch(err=> {
        console.log(err)
        res.status(400).json({
          message : err
        })
      }
      )
})

route.post('/resend-verification' , (req, res) => {
  let email = req.body
  Users.findOne({email}).then( async (user) => {
      let link = jwt.sign({ id: user.id}, process.env.TOKEN_SECRET)
      await mailers.newApplication(user , link).catch(err => console.log(err))
      res.status(200).json({
        data : user,
        message : "Verification email sent "
      })

  })
})

route.post('/verify-code', (req, res) => {
       try {
        let id = jwt.verify(req.body.code, process.env.TOKEN_SECRET).id
        Users.findOne({ where: { id: id } }).then((user) => {
          if(user){
            res.status(200).json({
              data : {user},
              message : ""
            })
          }else{
            res.status(400).json({
              data : {user},
              message : "User not found"
            })
          }
        }).catch(err => {
          console.log(err)
          res.status(401).json({
            message : "bad query"
          })
        })
      } catch(err) {
        res.status(401).json({
          message : ""
        })
      }
    })

route.use('/admin', auth.adminAuth)
route.get('/admin',  (req, res) => {
  let id = res.locals.id
  Admin.findOne({where : {id : id}}).then((admin) => {
    if(admin){
      res.status(200).json({
        data : admin,
        message : "fetched"
      })
    }else{
      res.status(402).json({
        message : "Unathorized request"
      })
    }
  })
})

route.post('/admin/newAdmissionOfficer', (req, res) => {
  console.log(req.body)
  Admission_officers.create(req.body).then( async (response) => {
    let link = jwt.sign({ id: response.id}, process.env.TOKEN_SECRET)
    await mailers.newAdmissionOfficer(req.body, link)
    res.status(200).json({
      data : response,
      message : `Set up instruction sent to ${response.email} `
    })
  }).catch((err) => {
    res.status(400).json({
      message : err.message
    })
  })
  
})

route.get('/officer', (req, res) => {
  try {
    let decoded = jwt.verify(req.query.id, process.env.TOKEN_SECRET)
    Admission_officers.findOne({ where : { id : decoded.id}}).then(result => {
      res.status(200).json({
        admission_officer : result,
        message : "Code verified"
      })
    }).catch(err => {
      res.status(500).json({
        message : err.message
      })
    })
    
  } catch (error) {
    res.status(401).json({
      message : "Unathorized access"
    })
  }
})

route.post('/officer/setpassword', (req, res) => {
    bcrypt.hash(req.body.password, 10, (err, hash) => {
    if(err){
      res.status(400).json({
        err : err,
        message : 'Invalid'
    })
    }else{
      Admission_officers.update( { pass : hash, role :  req.body.role } ,{ where : { id : req.body.id }}).then(result => {
        res.status(200).json({
          data : result,
          message : "Password setup complete"
        })
      }).catch(err => {
        console.log(err.message)
      })
    }
  })
})

route.get('*', function(req, res){
  res.send('what???', 404);
});

route.post('*', function(req, res){
  res.status(404).json({
    message : 'Invalid route'
  })
})

module.exports = route