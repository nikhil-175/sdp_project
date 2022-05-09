const jwt=require("jsonwebtoken");
const Register = require("../models/register");
const auth=async(req,res,next)=>{
    try{
        const token=req.cookies.jwt;
        const verifyuser=jwt.verify(token,process.env.SECRET_KEY);
        //console.log(verifyuser);
        const user=await Register.findOne({_id:verifyuser._id});
        //console.log(user);
        req.user=user;
        req.token=token;
        next();
    }
    catch(err)
    {
        res.render("pagenotfound");
    }
};
module.exports=auth;