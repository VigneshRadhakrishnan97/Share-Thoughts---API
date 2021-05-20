const express = require("express");
const route = express.Router();
const auth=require("../../midelware/auth");
const { check, validationResult } = require("express-validator");
const Posts=require("../../models/Post");
const User = require("../../models/Users");
const Profile = require("../../models/Profile");

//@route POST api/post
//@desc  create posts

route.post("/",[auth,[
  check('text',"Text is required").not().isEmpty()
]], async (req, res) => {

  const errors=validationResult(req);
  if(!errors.isEmpty())
  {
    return res.status(400).json({errors:errors.array()});
  }

  try {
    const user= await User.findById(req.user.id).select('-password');

    const newPost=new Posts({
      text:req.body.text,
      name:user.name,
      avatar:user.avatar,
      user:req.user.id
    });

    const post=await  newPost.save();

    return res.json(post);
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('server error');
  }

});

//@route GET api/post
//@desc  Get all posts

route.get('/',auth,async(req,res)=>{

  try {
    const post=await Posts.find().sort({date:-1});
    res.json(post);
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('server error');
  }

});

//@route GET api/post/:id
//@desc  Get  post by id

route.get('/:id',auth,async(req,res)=>{

  try {
    const post=await Posts.findById(req.params.id);
    if(!post)
    {
      return res.status(404).json({msg:'Post not found'});
    }
    res.json(post);
    
  } catch (err) {
    
    console.error(err.message);
    if (err.kind=='ObjectId') {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.status(500).send('server error');
  }

});

//@route DELETE api/post/:id
//@desc  delete a post by id

route.delete('/:id',auth,async(req,res)=>{

  try {
    const post=await Posts.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    //check user
    if(post.user.toString() !== req.user.id){
      return res.status(401).json({msg:"User Not authorized"});

    }
   
    await post.remove();

    res.json({ msg: "Post removed" });
    
  } catch (err) {
    
    console.error(err.message);
    if (err.kind=='ObjectId') {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.status(500).send('server error');
  }

});

//@route PUT api/post/like/:id
//@desc  like post

route.put('/like/:id',auth,async(req,res)=>{

  try {

    const post =await Posts.findById(req.params.id);

    //check if usesr already liked this post
    if(post.likes.filter( like => like.user.toString()===req.user.id).length>0)
    {
      return res.status(400).json({msg:"Post already liked"});
    }

    post.likes.unshift({user:req.user.id});
    await post.save();
    
    return res.json(post.likes);
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send("server error");
  }

});

//@route PUT api/post/unlike/:id
//@desc  unlike post

route.put('/unlike/:id',auth,async(req,res)=>{

  try {

    const post =await Posts.findById(req.params.id);

    //check if usesr already liked this post
    if(post.likes.filter( like => like.user.toString()===req.user.id).length===0)
    {
      return res.status(400).json({msg:"Post has not been lliked yet"});
    }

    //Get remove index
    const removeindex=post.likes.map(like=>like.user.toString()).indexOf(req.user.id);

    post.likes.splice(removeindex,1);

    await post.save();
    
    return res.json(post.likes);
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send("server error");
  }

});


//@route POST api/post/comments/:id
//@desc  create posts

route.post("/comments/:id",[auth,[
  check('text',"Text is required").not().isEmpty()
]], async (req, res) => {

  const errors=validationResult(req);
  if(!errors.isEmpty())
  {
    return res.status(400).json({errors:errors.array()});
  }

  try {
    const user= await User.findById(req.user.id).select('-password');
    const post=await Posts.findById(req.params.id);
    const newComments={
      text:req.body.text,
      name:user.name,
      avatar:user.avatar,
      user:req.user.id
    };

    post.comments.unshift(newComments);


    await post.save();

    return res.json(post.comments);
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('server error');
  }

});

//@route Delete api/post/comments/:id/:comment_id
//@desc  Delete comments

route.delete("/comments/:id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Posts.findById(req.params.id);

    //pull out comments
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    //check comment exist
    if (!comment) {
      return res.status(404).json({ msg: "Comment does not exist" });
    }

    //check same user created the comment
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    //Get remove index
    const removeindex = post.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id);

    post.comments.splice(removeindex, 1);

    await post.save();
    return res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("server error");
  }
});

module.exports = route;
