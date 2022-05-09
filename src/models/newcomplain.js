const mongoose=require("mongoose");
const newcomplainSchema=new mongoose.Schema({
    firstname: {
        type:String,
        // required:true
    },
    lastname: {
        type:String,
        // required:true,
    },
    gender: {
        type:String,
        // required:true
    },
    dateandtime: {
        type:String,
    },
    email: {
        type:String,
        // required:true
    },
    number: {
        type:Number,
        // required:true
    },
    address: {
        type:String,
        // required:true
    },
    area: {
        type:String,
        // required:true
    },
    department: {
        type:String,
        // required:true
    },
    description: {
        type:String,
        // required:true
    },
    status: {
        type:String,
    },
    feedback: {
        type:String,
        default:'null',
    },
    img: {
        type:String,
        default: 'placeholder.jpg',
    }
});
const newcomplain=new mongoose.model("newcomplain",newcomplainSchema);
module.exports=newcomplain;