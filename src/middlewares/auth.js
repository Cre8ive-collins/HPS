require('dotenv').config()
const API_KEY = process.env.API_KEY
const jwt = require('jsonwebtoken')



const auth = (req, res, next) => {
    if(req.headers.user_token){
        let token = req.headers.user_token
        try {
            var decoded = jwt.verify(token, process.env.TOKEN_SECRET);
            // console.log(decoded)
            next()
          } catch(err) {
            let data = {
                "data" : err,
                message : "Unauthorized Access"
                }
            res.status(401).json(data)
          }
        // jwt.verify(token, process.env.TOKEN_SECRET, function(err, decoded) {
        //     if(err){
        //         console.log(err)
        //         let data = {
        //             "data" : err,
        //             message : "Unauthorized Access"
        //           }
        //           res.status(401).json(data)
        //     }else{
        //         next()
        //     }
        //   });

    }else{
        let data = {
            "data" : req.headers.api_key,
            message : "Unauthorized Access"
          }
          res.status(401).json(data)
    }
    // if(req.headers.api_key != API_KEY){
    //     // res.send('UnAuthorised access' , 401)
    //     let data = {
    //         "data" : req.headers.api_key,
    //         message : "Unauthorized Access"
    //       }
    //       res.status(401).json(data)
    // }else{
    //     next()
    // }
}
const keys = (req, res, next) => {
    if(req.headers.api_key != API_KEY){
        // res.send('UnAuthorised access' , 401)
        let data = {
            "data" : req.headers.api_key,
            message : "Unauthorized Access"
          }
          res.status(401).json(data)
    }else{
        next()
    }
}

const adminAuth = (req, res, next) => {
    // res.send(200)
    if(!req.headers.admin_token){
        res.status(402).json({
            message : "Unauthorized request"
        })
    }else{
        try {
            let decoded = jwt.verify(req.headers.admin_token, process.env.TOKEN_SECRET)
            console.log("sess", decoded)
            res.locals.id = decoded.id
            next()
        } catch (error) {
            console.log(error, "gggsess err")
            res.status(401).json({
                message : "Session expired"
            })
        }
    }
}

module.exports = {
    auth,
    keys,
    adminAuth
}