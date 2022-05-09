const bcrypt = require("bcryptjs");
const mongoose=require("mongoose");
const jwt=require("jsonwebtoken");
const userSchema=new mongoose.Schema({
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
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }]
});
//generating tokens
userSchema.methods.generateAuthToken= function(){
    try{
        const token=jwt.sign({_id:this._id.toString()},process.env.SECRET_KEY);
        this.tokens=this.tokens.concat({token:token});
        //console.log(token);
        return token;
    }
    catch(err)
    {
        console.log(err);
    }
}
//hashing the password
userSchema.pre("save",async function(next){
    if(this.isModified("password"))
    {
        this.cpassword=await bcrypt.hash(this.cpassword,10);
        this.password=await bcrypt.hash(this.password,10);
    }
    next();
});
const Register=new mongoose.model("Register",userSchema);
module.exports=Register;

