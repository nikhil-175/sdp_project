const bcrypt = require("bcryptjs");
const jwt=require("jsonwebtoken");
const mongoose=require("mongoose");
const officerSchema=new mongoose.Schema({
    username: {
        type:String,
        required:true
    },
    email: {
        type:String,
        required:true,
        unique:true
    },
    password: {
        type:String,
        required:true
    },
    cpassword: {
        type:String,
        required:true
    },
    area: {
        type:String,
        required:true
    },
    department: {
        type:String,
        required:true
    },
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }]
});

officerSchema.methods.generateAuthToken= function(){
    try{
        const token=jwt.sign({_id:this._id.toString()},process.env.SECRET_KEYTWO);
        this.tokens=this.tokens.concat({token:token});
        //console.log(token);
        return token;
    }
    catch(err)
    {
        console.log(err);
    }
}

officerSchema.pre("save",async function(next){
    if(this.isModified("password"))
    {
        this.cpassword=await bcrypt.hash(this.cpassword,10);
        this.password=await bcrypt.hash(this.password,10);
    }
    next();
});
const Oregister=new mongoose.model("Oregister",officerSchema);
module.exports=Oregister;