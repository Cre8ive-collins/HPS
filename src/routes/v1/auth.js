require('dotenv').config()
const { Router } = require('express')
const jwt = require('jsonwebtoken')
const { Users, Admin, Admission_officers } = require('../../database/connection')
const bcrypt = require('bcrypt');
const saltRounds = process.env.SALT;




const route = Router()

// route.use('/v1', require('./v1'))
route.post('/login', (req, res) => {
    // CHECK IF EMAIL EXIST AND COMAPARE PASSWORD WITH ENCRYTPED STORED PASSWORD
    // IF VALID ASSIGN TOKEN ELSE THROW ERROR 
    let user = {
        email : "wilsoncollins4@yahoo.com",
        id : 1,
        firt_name : 'Collins',
        lats_name : 'Wilson',
        phone_number : '09096849272'

    }
    const token = jwt.sign({ id: user.id}, process.env.TOKEN_SECRET)
    res.status(200).json({
        data : token,
        message : "Login Successful"
    })
})

route.post('/admin', (req, res) => {
  console.log(req.body, saltRounds)
  bcrypt.hash(req.body.password, 10, (err, hash) => {
    if(err){
        res.status(400).json({
          err : err,
          message : 'Invalid'
      })
    }else {
      Admin.create(
        { 
          first_name: req.body.first_name , 
          last_name: req.body.last_name ,  
          email : req.body.email,
          role : 5,
          pass : hash,
        }).then(async (admin) => {
          let link = jwt.sign({ id: admin.id}, process.env.TOKEN_SECRET)
          let data = {
            "data" : {admin, link},
            message : "Application added successfully"
          }
          res.status(200).json(data)
        }).catch(err=> {
          res.status(400).json({
            message : err.errors && err.errors[0].message.includes("email must be unique") ? "Email has already been used" : err.errors[0].message
          })
        }
        )
    }
  })
})

route.post('/admin/login', (req, res) => {
  console.log(req.body)
  Admin.findOne({ where: { email : req.body.email } }).then((admin) => {
    if(!admin){
      res.status(400).json({
        data : req.body,
        message : "No user with this enail identifier"
      })
    }else{
      console.log(admin.pass)
      let password = req.body.password
      bcrypt.compare(password, admin.pass, (err, result) => {
        // console.log(err, result)
        if(!result){
          res.status(400).json({
            data : req.body,
            message : "Incorrect email and password combination"
          })
        }else{
          let token = jwt.sign({ id: admin.id}, process.env.TOKEN_SECRET, { expiresIn : '12h' })
          res.status(200).json({
            data : {admin, token},
            message : "Login successful"
          })
        }
      })
    }
  })
})

route.post('/reset', (req, res) => {
    // CHECK IF EMAIL EXISTS CREATE A ONE TIME RESET TOKEN VALID FOR 30 MINUTES
    // SEND TOKEN AS URL VIA EMAIL TO USER 
    res.status(200).json({
        data : req.body,
        message : `Password reset instruction sent to ${req.body.email}`
    })
})

route.get('*', function(req, res){
    res.status(404).json({
      message : 'Invalid route'
    })
  })
  
  route.post('*', function(req, res){
      console.log("auth erro")
    res.status(404).json({
      message : 'Invalid route'
    })
  })
  

module.exports = route