const jwt = require("jsonwebtoken");
const config =require('config');

module.exports = function(req, res, next){

//Get token from header
const token = req.header('x-auth-token');

// check if token
if(!token)
{
    return res.status(401).json({msg:'No token, authorization denied'});
}

//verify token

try{
    //decode token
    const decode = jwt.verify(token, config.get("jwtSecret"));

    req.user=decode.user;
    next();

}catch(err){

    return res.status(401).json({msg:'Not valid Token'})
}

}