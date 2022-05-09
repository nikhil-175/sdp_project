const jwt=require("jsonwebtoken");
const oregister = require("../models/oregister");
const authtwo=async(req,res,next)=>{
    try{
        const token=req.cookies.jwt;
        const verifyuser=jwt.verify(token,process.env.SECRET_KEYTWO);
        //console.log(verifyuser);
        const officer=await oregister.findOne({_id:verifyuser._id});
        //console.log(officer);
        req.officer=officer;
        req.token=token;
        next();
    }
    catch(err)
    {
       res.render("pagenotfound");
    }
};
module.exports=authtwo;