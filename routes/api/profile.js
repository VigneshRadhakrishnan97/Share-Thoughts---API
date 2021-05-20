const express = require("express");
const route = express.Router();
const auth=require("../../midelware/auth");
const Profile=require('../../models/Profile');
const User = require("../../models/Users");
const { check, validationResult } = require("express-validator");
const config = require("config");
const request = require('request');

//@route Get api/profiles/me
//@desc  Get current user profile

route.get("/me",auth, async (req, res) => {
  try{
    const profile=await Profile.findOne({user:req.user.id}).populate('user',['name','avatar']);

    if(!profile)
    {
      return  res.status(400).json({msg : 'there is no profile for this user'});
    }



    res.send(profile);
  }catch(e){
    console.error(e.message);
    res.status(500).send("server error");
  }
  
});

//@route POST api/profiles/me
//@desc  create or update user profile

route.post('/',[auth, [
  check("status","Status is required...").not().isEmpty(),
  check("skills","Skills is required").not().isEmpty()
] ],async(req,res)=>{

  const errors=validationResult(req);
  if(!errors.isEmpty())
  {
    return res.status(400).json({errors:errors.array()});
  }
  
  const {company, website, location, bio, status, githubusername,
  skills, youtube, facebook, twitter, instagram, linkdin}=req.body;
    
  //Build Profile onject

  const profileFields={};
  profileFields.user=req.user.id;
  if(company) profileFields.company=company;
  if (website) profileFields.website = website;
  if (location) profileFields.company = location;
  if (bio) profileFields.bio = bio;
  if (status) profileFields.status = status;
  if (githubusername) profileFields.githubusername = githubusername;
  if(skills) {
    profileFields.skills=skills.split(',').map(skill=> skill.trim());
  }

  //Build Social object
  profileFields.social={};
  if (youtube) profileFields.social.youtube = youtube;
  if (twitter) profileFields.social.twitter = twitter;
  if (facebook) profileFields.social.facebook = facebook;
  if (linkdin) profileFields.social.linkdin = linkdin;
  if (instagram) profileFields.social.instagram = instagram;
  
try{
  
  let profile=await Profile.findOne({user:req.user.id});
  
  if(profile)
  {
    //Update Profile
    profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $set: profileFields },
      {new: true}
    );
    console.log("update");
     return res.json(profile);
  }

  //Create Profile
  profile = new Profile(
    profileFields
  );
  await profile.save();
  console.log("create");
  return res.json(profile);

}catch(err){
  console.error(err.message);
  res.status(500).send("server error");
}

  //console.log(profileFields.skills);
  //res.send(profileFields);

});

//@route GET api/profiles/me
//@desc  Get all Profiles

route.get('/',async(req,res)=>{

  try {
    const profile= await Profile.find().populate('user',['name','avatar']);
    res.json(profile);
    
  } catch (error) {
    console.error(error.message);
    res.status(500).send('server error')
  }

})

//@route GET api/profiles/user/:user_id
//@desc  Get all Profile by userid

route.get('/user/:user_id',async(req,res)=>{

  try {
    const profile= await Profile.findOne({user:req.params.user_id}).populate('user',['name','avatar']);

    if(!profile)
    {
      return res.status(400).json({ msg: "Profile not found" });
    }
    res.json(profile);
    
  } catch (error) {
    if(error.kind=='ObjectId')
    {
  
      return res.status(400).json({msg:'Profile not found'});
    }

    res.status(500).send('server error')
  }

});

//@route DELETE api/profiles
//@desc  Delete Profile 

route.delete('/',auth,async(req,res)=>{

  try {

    //Remove profile
    await Profile.findOneAndRemove({user:req.user.id});
    //Remove users
    await User.findOneAndRemove({ _id: req.user.id });
    
    res.json({msg:'User deleted'});
    
  } catch (error) {
   
    res.status(500).send('server error')
  }

});

//@route PUT api/profile/experience 
//@desc  Add experience

route.put("/experience",[auth,[
  check('title',"Title is required").not().isEmpty(),
  check('company',"Company is required").not().isEmpty(),
  check('from',"from date is required").not().isEmpty()
]],async (req,res)=>{

  const err=validationResult(req);

if(!err.isEmpty())
{
  return res.status(400).json({errors:err.array()});
}

const {title, company,location,from, to, current, description}=req.body;

const newExp = { title, company, location, from, to, current, description };

try {

  const profile=await Profile.findOne({user:req.user.id});
  profile.experience.unshift(newExp);
  await profile.save();
  res.json(profile);
} catch (error) {
  console.error(error.message)
  res.status(500).send('server error');
  
}
 

});

//@route DELETE api/profile/experience/:exp_id 
//@desc  Delete experience from profile

route.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);
    profile.experience.splice(removeIndex, 1);
    profile.save();
    
    return res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("server error");
  }
});

//@route PUT api/profile/education 
//@desc  Add education

route.put(
  "/education",
  [
    auth,
    [
      check("school", "school is required").not().isEmpty(),
      check("degree", "degree is required").not().isEmpty(),
      check("fieldofstudy", "field of study  is required").not().isEmpty(),
      check("from", "from date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const err = validationResult(req);

    if (!err.isEmpty()) {
      return res.status(400).json({ errors: err.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEdu);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("server error");
    }
  }
);

//@route DELETE api/profile/education/:exp_id 
//@desc  Delete education from profile

route.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);
    profile.education.splice(removeIndex, 1);
    profile.save();
    return res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("server error");
  }
});

//@route GET api/profile/github/:username
//@desc  get user repos from Github

route.get('/github/:username',async(req,res)=>{

  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&
      client_id=${config.get("githubclinetid")}&client_secret=${config.get(
        "githubsecret"
      )}`,
      method:'GET',
      headers:{'User-Agent':'node.js'}
    };
    request(options,(error,response,body)=>{
      if(error) console.log(error);
      if(response.statusCode != 200)
      {
       return res.status(404).json({msg:"No git hub profile fund"});
      }
      res.json(JSON.parse(body));

    })
    
  } catch (err) {

    console.error(err.message);
    res.status(500).send("server error");
  }

});

module.exports = route;
