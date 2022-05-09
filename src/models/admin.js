const mongoose=require("mongoose");
const adminschema=new mongoose.Schema({
    email: {
        type:String,
        required:true,
        unique:true
    },
    password: {
        type:String,
        required:true
    }
});
const admin=new mongoose.model("admin",adminschema);
module.exports=admin;