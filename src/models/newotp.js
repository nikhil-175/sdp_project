const mongoose=require("mongoose");
const otpSchema=new mongoose.Schema({
    email: {
        type:String,
    },
    code:{
        type:String,
    },
    expirein:{
        type:Number
    }
});
const newotp=new mongoose.model("newotp",otpSchema);
module.exports=newotp;