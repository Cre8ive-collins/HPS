const { Router } = require('express')

const route = Router()

route.use('/v1', require('./v1'))
route.get('*', function(req, res){
    res.send('what???', 404);
  });
route.post('*', function(req, res){
    res.status(404)
    res.send('what???');  });

module.exports = route