const express = require("express");
const route = express.Router();
const auth = require("../../midelware/auth");
const User = require("../../models/Users");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

//@route GET api/auth

route.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    res.json(user);
  } catch (e) {
    console.log(e.message);
    res.status(500).send("server error");
  }
});


//@route POST api/auth
//@desc  Authendicate User
route.post(
  "/",
  [
    
    check("email", "Enter the valid email address").isEmail(),
    check(
      "password",
      "Please is required"
    ).exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {email,password}=req.body;
    try{

        //see if user exist
        let user =await User.findOne({email});
        if(!user)
        {
           return res
             .status(400)
             .json({ errors: [{ msg: "Invalid credentials" }] });
        }

        const isMatch=await bcrypt.compare(password,user.password);

        if (!isMatch) {
          return res
            .status(400)
            .json({ errors: [{ msg: "Invalid credentials" }] });
        }
        
        const payload = {
          user:{
            id:user.id
          }
        }

        jwt.sign(payload, config.get("jwtSecret"), {expiresIn:36000}, (err, token)=>{
          if(err) throw err;
          
          res.json({token});

        } );

    }catch(e)
    {
        return res.status(500).send(e.message);
    }
    
  }
);

module.exports = route;
