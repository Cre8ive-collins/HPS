const { Router } = require('express')
const mailers = require('../../services/mailer') 
const auth = require('../../middlewares/auth')
const bcrypt = require('bcrypt');
const { Users, Admin, Admission_officers } = require('../../database/connection')
const jwt = require('jsonwebtoken')
const { Op } = require("sequelize");
require('dotenv').config()





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

const admissionOfficerLogic = (req) => {
  Admission_officers.findAll({
  }).then(results => {
    results.sort((a, b) => {
      return a.clients - b.clients; 
  })
  mailers.admissionOfficerNotification(req.body, results[0])
  Admission_officers.update({
    clients : results[0].clients + 1
  }, {where : { id : results[0].id}})
  Users.update({ admission_officer : results[0].id}, { where : { email : req.body.email}})
}).catch(err => {
    console.log(err)  
  })
}

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
        admissionOfficerLogic(req)
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

route.post('/hazard/create/admin', (req, res) => {
  // HAZARDCODE1332211185FAUX
  if(req.headers.harzad_code !== process.env.HAZARD_CODE){
    res.status(402).json({
      message : "YOU DO NOT HAVE THE RIGHT PERMISSION TO PERFORM THIS ACTION"
  })
  }else{
    bcrypt.hash(req.body.password, 10, async (err, hash) => {
      Admin.create({
        first_name: req.body.first_name , 
        last_name: req.body.last_name ,  
        email : req.body.email,
        role : 5,
        pass : hash
      }).then(admin => {
        res.status(200).json({
          admin , 
          message : `New Admin ${req.body.first_name} Created`
        })
      })
      .catch(err => { 
        res.status(403).json({ 
          err,
          message : err?.errors[0]?.message
        })
        return 
      })
    })
  }
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

route.get('/user/:id', (req, res) => {
  console.log(req.params.id)
  Users.findOne({ where : { id : req.params.id }, raw : false}).then(result => {
    if(!result){
      res.status(400).json({
        message : "Selected id is invalid "
      })
    }else{
      res.status(200).json({
        data : {user : result},
      })
    }
  }).catch(err => {
    res.status(500).json({
      message : "Server Error"
    })
  })
})

route.get('/officer', (req, res) => {
  try {
    if(!req.query.id){
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
    }else{
      console.log(req.headers)
    }
    
  } catch (error) {
    res.status(401).json({
      message : "Unathorized access"
    })
  }
})

route.get('/officers', (req, res) => {
  try {
    let decoded = jwt.verify(req.headers.officer_token, process.env.TOKEN_SECRET)
    console.log(decoded)
    Admission_officers.findOne({ where : { id : decoded.id}}).then(result => {
      res.status(200).json({
        admission_officer : result
      })
    })
  } catch (error) {
    console.log(error)
  }
})

route.post('/officer/login', (req, res) => {
  console.log(req.body)
  Admission_officers.findOne({ where : { email : req.body.email}}).then(result => {
    if(!result){
      res.status(401).json({
        message : `No user found with the email ${req.body.email}`
      })
    }else{
      bcrypt.compare(req.body.password, result.pass, ( err, response  ) => {
        if(!response){
          console.log(response)
          res.status(401).json({
            message : `Incorrect password`
          })
        }else{
          const token = jwt.sign({ id: result.id}, process.env.TOKEN_SECRET)
          res.status(200).json({
            admission_officer : result,
            token : token,
            message : `Login successfull`
          })
        }
      })
    }

  })
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

route.get('/officer/clients', auth.admission_officers,async  (req, res) => {
  console.error(req.query, "Qp")
  let id = res.locals.id
  let { param, search } = req.query
  if(search){
    let result = await Users.findAll({ where : { 
      admission_officer : id, 
      [Op.or] : [
        {email : {[Op.like] : `%${search}%`}},
        {first_name : {[Op.like] : `%${search}%`}},
        {last_name : {[Op.like] : `%${search}%`}},
      ]
    }})
    res.status(200).json({
      data : result
    })
    return
  }
  if (param == 'pending'){
    let result = await Users.findAll({ where : { 
      admission_officer : id, 
      applications_status : null
    }})
    res.status(200).json({
      data : result
    })
    return
  }else if(param == 'applied'){
    let result = await Users.findAll({ where : {
      admission_officer : id, 
      applications_status : {[Op.or] : [3],}
    }})
    res.status(200).json({
      data : result
    })
    return
  }else if(param == 'success'){
    let result = await Users.findAll({ where : {
      admission_officer : id, 
      applications_status : {[Op.or] : [4],}
    }})
    res.status(200).json({
      data : result
    })
    return
  }else if(param == 'document'){
    let result = await Users.findAll({ where : {
      admission_officer : id, 
      applications_status : {[Op.or] : [2, 1],}
    }})
    res.status(200).json({
      data : result
    })
    return
  }else{
    Users.findAll({ where : { admission_officer : res.locals.id 
    }}).then( result => {
      res.status(200).json({
        data : result
      })
    }).catch(err => {
      console.log(err)
    })
  }
})

route.post('/officer/send_reminder', auth.admission_officers, (req, res) => {
  let status =  req.body.status
  Users.findOne({ where : { id : req.body.id }}).then(async user => {
    if(!user){
      res.status(400).json({
        message : "Selected id is invalid "
      })
    }else{
      const link = jwt.sign({ id: user.id}, process.env.TOKEN_SECRET)
      if(status){
        status == 2 ? await mailers.doc_reminder(user, link) : status == 3 ? await mailers.payment_reminder() : console.log('extra')
        res.status(200).json({
          message : `Reminder sent to ${user.first_name} ${user.last_name}`
        })
      }else{
        await mailers.send_reminder(user, link)
        res.status(200).json({
          message : `Reminder sent to ${user.first_name} ${user.last_name}`
        })
      }
    }
  }).catch(err => {
    console.log(err)
    res.status(500).json({
      message : "Server Error"
    })
  })

})

route.get('/officer/dashboard',auth.admission_officers, async (req, res) => {
  let id = res.locals.id
  try {
    let pending = await Users.findAll({ where : { 
      admission_officer : id, 
      applications_status : null
    }})
    let document = await Users.findAll({ where : {
      admission_officer : id, 
      applications_status : {[Op.or] : [2, 1],}
    }})
    let applied = await Users.findAll({ where : {
      admission_officer : id, 
      applications_status : {[Op.or] : [3],}
    }})
    let success = await Users.findAll({ where : {
      admission_officer : id, 
      applications_status : {[Op.or] : [4],}
    }})
    let data = {
      pending : pending.length,
      document : document.length,
      applied : applied.length,
      success : success.length
    }
    res.status(200).json({
      data 
    })
  } catch (error) {
    res.status(500).json({
      message : "Server Error"
    })
  }
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