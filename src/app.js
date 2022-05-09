require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();
require("./db/conn");
const hbs = require("hbs");
const multer=require('multer');
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const CookieParser=require("cookie-parser");
const Register = require("./models/register");
const oregister = require("./models/oregister");
const newcomplain = require("./models/newcomplain");
const admin = require("./models/admin");
const newotp = require("./models/newotp");
const auth=require("./middleware/auth");
const authtwo=require("./middleware/authtwo");
const port = process.env.PORT || 3000;
const static_path = path.join(__dirname, "../public");
const templatepath = path.join(__dirname, "../templates/views");
const partialpath = path.join(__dirname, "../templates/partials");
const nodemailer = require('nodemailer');
var sendgridTransport = require('nodemailer-sendgrid-transport');
const { isValidObjectId } = require("mongoose");
const { Router } = require("express");
app.use(CookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }))
app.set("view engine", "hbs");
app.set("views", templatepath);
hbs.registerPartials(partialpath);
app.use(express.static(static_path));
const storage=multer.diskStorage({
    destination:function(req,file,callback) {
        callback(null,'./public/img2');
    },
    filename: function(req,file,callback) {
        callback(null,Date.now()+file.originalname);
    },
});
const upload=multer({
    storage:storage,
});
app.get("/", (req, res) => {
    res.render('index');
});

app.get("/forgotpass", (req, res) => {
    res.render('forgotpass');
});

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: process.env.API_KEY
    }
}));

//register validation
app.post("/register", async (req, res) => {
    try {
        const password = req.body.password;
        const cpassword = req.body.cpassword;
        if (password == cpassword) {
            const registeruser = new Register({
                username: req.body.username,
                email: req.body.email,
                password: req.body.password,
                cpassword: req.body.cpassword,
            });
            const token=registeruser.generateAuthToken();
            res.cookie('jwt',token,{
                expires:new Date(Date.now()+600000),
                httpOnly:true
            });
            // console.log("generated token is "+token);
            const registered = await registeruser.save();
            // console.log(registered);
            res.render("index",{
                success:"successfull"
            });
        }
        else {
            res.render("index", {
                messager: "oops password are not matching",
                messageClass: 'alert-danger'
            });
        }
    }
    catch (error) {
        res.render('index', {
            messager: 'User already registered.',
            messageClass: 'alert-danger'
        });
    }
});

//login validation
var email;
app.post("/userlogin", async (req, res) => {
    try {
        email = req.body.email;
        const password = req.body.password;
        const useremail = await Register.findOne({ email: email });
        const ismatch=await bcrypt.compare(password,useremail.password);
        if (ismatch) {
            const token=useremail.generateAuthToken();
            //console.log(token);
            res.cookie('jwt',token,{
                expires:new Date(Date.now()+3600000),
                httpOnly:true
            });
            res.status(201).render("user");
        }
        else {
            res.render("index", {
                message: 'invalid email id or password.',
                messageClass: 'alert-danger'
            });
        }
    }
    catch (error) {
        res.render('index', {
            message: 'invalid email id or password.'
        });
    }
});

app.get("/gotohome",(req,res)=>{
    res.redirect("/");
});

app.get("/complain",auth, (req, res) => {
    //console.log(req.cookies.jwt);
    var dt=new Date().toLocaleString('en-IN');
    res.render('complain',{
        email:email,
        dateandtime:dt,
    });
});

//admin view feedback
app.get('/viewfeedback',async (req,res)=>{
    var feedback=await newcomplain.find({status:"completed", feedback:{$ne:"null"}});
    var officer;
    var record=[];
    var feedrecord=[];
    for(var i=0; i<feedback.length; i++)
    {
        officer=await oregister.findOne({area:feedback[i].area,department:feedback[i].department});
        record={
            "officerusername":officer.username,
            "officeremail":officer.email,
            "officerarea":officer.area,
            "officerdepartment":officer.department,
            "email":feedback[i].email,
            "status":feedback[i].status,
            "description":feedback[i].feedback,
        };
        feedrecord.push(record);
        //record.push(officer);
    }
    res.render("viewfeedback",{
        feedrecord:feedrecord
    });
})

//feedback
app.get("/feedback",auth, async (req,res)=>{
    try{
        var usercomplain=await newcomplain.find({email:email, status:"completed", feedback:"null"});
        var usercomplain2=await newcomplain.find({email:email, status:"completed", feedback:{$ne:"null"}});
        res.render("feedback",{
            usercomplain:usercomplain,
            usercomplain2:usercomplain2
        });
    }
    catch(err)
    {
        console.log(err);
    }
});

//feedback submit
app.post("/feedbackaction", async (req, res) => {
    try {
        const id = req.body.complainid;
        const feed = req.body.description;
        const feeddescription = await newcomplain.findOne({ _id: id });
        feeddescription.feedback=feed;
        feeddescription.save();
        res.render("user");
    }
    catch (error) {
        res.send("Sorry something went wrong");
    }
});

//user profile
app.get("/userprofile",auth, async (req, res) => {
    const myprofiles = await Register.findOne({ email: email });
    const complaines = await newcomplain.findOne({
      email: email,
    });
    // console.log(complaines);
    try {
      if (myprofiles) {
        res.render("prof", {
          myprofiles: myprofiles,
          complaines: complaines,
        });
      }
    } catch(err) {
      console.log(err);
    }
  });

//user view complain
app.get("/userviewcomplain",auth, async (req, res) => {
    try {
        var usercomplain= await newcomplain.find({ email: email,status:"pending"});
        var usercomplain2= await newcomplain.find({ email: email,status:"OnProgress"});
        var usercomplain3= await newcomplain.find({ email: email,status:"completed"});
            res.render(("user_view"), {
                usercomplain: usercomplain,
                usercomplain2:usercomplain2,
                usercomplain3:usercomplain3
            });
    }
    catch (err) {
            res.send("complain is not available right now");
        }
    });

//edit complain
app.get("/useredit/:id",auth, async (req, res) => {
    try {
        const usercomplain = await newcomplain.findById(req.params.id);
        if (usercomplain) {
            res.render("edit_complain", {
                complain: usercomplain,
                dateandtime:new Date().toLocaleString('en-IN'),
            });
        }
    }
    catch (err) {
        console.log(err);
    }
});

//admin login validation
var aemail;
app.post("/adminlogin", async (req, res) => {
    try {
        aemail = req.body.email;
        const password = req.body.password;
        const adminemail = await admin.findOne({ email: aemail });
        if (adminemail.password == password) {
            res.status(201).render("admin");
        }
        else {
            res.render("index", {
                messagea: 'invalid email id or password.',
                messageClass: 'alert-danger'
            });
        }
    }
    catch (error) {
        res.render('index', {
            messagea: 'invalid email id or password.',
            messageClass: 'alert-danger'
        });
    }
});

//admin profile
app.get("/aprofile", async (req, res) => {
    const myprofiles = await admin.findOne({email:aemail});
    // console.log(complaines);
    try {
      if (myprofiles) {
        res.render("adminprof", {
          myprofiles: myprofiles,
        });
      }
    } catch(err) {
      console.log(err);
    }
  });

//forgot password
var email;
app.post("/forgotpassword", async (req, res) => {
    try {
        email = req.body.email;
        const useremail = await Register.findOne({ email: email });
        if (useremail.email === email) {
            let otpcode = Math.floor((Math.random() * 10000) + 1);
            let otpdata = new newotp({
                email: email,
                code: otpcode,
                expirein: new Date().getTime() + 300 * 1000
            });
            let otpresponse = await otpdata.save();
            transporter.sendMail({
                to: useremail.email,
                from: "nikhil6645@gmail.com",
                subject: "forgot password",
                html: "<h3>OTP for reset password is </h3>"+"<h1 style='font-weight:bold;'>"+otpcode+"</h1>"
            });

            res.render('otp', {
                message: 'otp has been sent to your registered email'
            });
        }
        else {
            res.render('forgotpass', {
                mes: 'invalid email id',
                messageClass: 'alert-danger'
            });
        }
    }
    catch (error) {
        res.render('forgotpass', {
            mes: 'invalid email id',
            messageClass: 'alert-danger'
        });
    }
});

//otp validation

app.post("/otp", async (req, res) => {
    try {
        const userotp = await newotp.findOne({ code: req.body.otp });
        const diff = new Date().getTime() - newotp.expirein;
        console.log(new Date().getTime);
        if (userotp.code) {
            let ct = new Date().getTime();
            let diff = userotp.expirein - ct;
            if (diff < 0) {
                res.render('otp', {
                    mes: 'otp expired',
                    messageClass: 'alert-danger'
                });
            }
            else {
                res.render('reset');
            }
        }
        else {
            res.render('otp', {
                mes: 'invalid otp',
                messageClass: 'alert-danger'
            });
        }
    }
    catch (error) {
        res.render('otp', {
            mes: 'invalid otp',
            messageClass: 'alert-danger'
        });
    }
});

//reset password

app.post('/reset', async (req, res) => {
    try {
        const password = req.body.password;
        const cpassword = req.body.cpassword;
        const useremail = await Register.findOne({ email: email });
        if (password == cpassword) {
            useremail.password = password;
            useremail.cpassword = cpassword;
            useremail.save();
            res.render('index');
        }
        else {
            res.render('reset', {
                mes: 'oops password are not matching',
                messageClass: 'alert-danger'
            });
        }
    }
    catch (error) {

        res.render('reset', {
            mes: 'invalid email id',
            messageClass: 'alert-danger'
        });

    }
});

app.get('/registerofficer', async (req, res) => {
    res.render('officerregister');
});

//officer registration validation
app.post("/oregister", async (req, res) => {
    try {
        const password = req.body.password;
        const cpassword = req.body.cpassword;
        if (password == cpassword) {
            const registeruser = new oregister({
                username: req.body.username,
                email: req.body.email,
                password: req.body.password,
                cpassword: req.body.cpassword,
                area: req.body.area,
                department: req.body.department,
            });
            const token=registeruser.generateAuthToken();
            res.cookie('jwt',token,{
                expires:new Date(Date.now()+3600000),
                httpOnly:true
            });
            const registered = await registeruser.save();
            res.status(201).render("admin");
        }
        else {
            res.render('officerregister', {
                mes: 'oops password are not matching',
                messageClass: 'alert-danger'
            });
        }
    }
    catch (error) {
        res.render('officerregister', {
            mes: 'officer already registered',
            messageClass: 'alert-danger'
        });
    }
});

//officer login validation
var department;
var area;
app.post("/officerlogin", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        department = req.body.department;
        area = req.body.area;
        const officeremail = await oregister.findOne({ email: email, department: department, area: area });
        const ismatch=await bcrypt.compare(password,officeremail.password);
        if (ismatch) {
            const token=officeremail.generateAuthToken();
            //console.log(token);
            res.cookie('jwt',token,{
                expires:new Date(Date.now()+3600000),
                httpOnly:true
            });
            res.status(201).render("officer");
        }
        else {
            res.render("index", {
                messageo: 'invalid email id, department, area or password.',
                messageClass: 'alert-danger'
            });
        }
    }
    catch (error) {
        res.render('index', {
            messageo: 'invalid email id, department, area or password.',
            messageClass: 'alert-danger'
        });
    }
});
//officer profile
app.get("/officerprofile",authtwo, async (req, res) => {
    const myprofiles = await oregister.findOne({area:area,department:department});
    const complaines = await newcomplain.findOne({
      area:area,
      department:department
    });
    // console.log(complaines);
    try {
      if (myprofiles) {
        res.render("offiprofile", {
          myprofiles: myprofiles,
          complaines: complaines,
        });
      }
    } catch(err) {
      console.log(err);
    }
  });

//officer update proof
app.get("/updateproof", async (req,res)=>{
    try{
        var usercomplain=await newcomplain.find({area:area, department:department, status:"completed",img:"placeholder.jpg"});
        var usercomplain2=await newcomplain.find({area:area, department:department, status:"completed",img:{$ne:"placeholder.jpg"}});
        res.render("updateproof",{
            usercomplain:usercomplain,
            usercomplain2:usercomplain2
        });
    }
    catch(err)
    {
        console.log(err);
    }
});

//officer add proof
app.post('/addproof',upload.single('image'),async(req,res)=>{
    try{
    const id=req.body.id;
    const img=req.file.filename;
    const updateproof=await newcomplain.findOne({_id:id});
    updateproof.img=img;
    updateproof.save();
    res.render("officer");
    }
    catch(err)
    {
        console.log(err);
    }
})

//view complain
app.get("/viewcomplain",authtwo, async (req, res) => {
    try {
        const complain = await newcomplain.find({ area: area, department: department });
        if (complain)
            res.render(("viewcomplain"), {
                complain: complain
            });
    }
    catch (error) {
        res.send("complain is not available right now");
    }
});


app.post("/complainsecond", async (req, res) => {
    // try {


    const registercomplain = new newcomplain({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        gender: req.body.gender,
        dateandtime: req.body.dateandtime,
        email: req.body.email,
        number: req.body.number,
        address: req.body.address,
        area: req.body.area,
        department: req.body.department,
        description: req.body.description,
        status: "pending"
    });
    const registered = await registercomplain.save();
    res.status(201).render("user");
});

//edit complain
app.post("/editcomplain", async (req, res) => {
    try {
        const id = req.body.id;
        var editcomplain = await newcomplain.findOne({ _id: id });
        if (editcomplain) {
            editcomplain.firstname = req.body.firstname;
            editcomplain.lastname = req.body.lastname;
            editcomplain.dateandtime = req.body.dateandtime;
            editcomplain.email = req.body.email;
            editcomplain.number = req.body.number;
            editcomplain.address = req.body.address;
            editcomplain.area = req.body.area;
            editcomplain.department = req.body.department;
            editcomplain.description = req.body.description;
            editcomplain.save();
            res.render("user");
        }
    }
    catch (err) {
        res.render("user", {
            message: "sorry something went wrong"
        });
    }

});

//officer logout
app.get('/ologout',authtwo, async (req, res) => {
    try{
        //console.log(req.user);
        res.clearCookie("jwt");
        await req.officer.save();
        res.redirect('/');
    }
    catch(err)
    {
        res.status(401).send(err);
    }
});

//admin logout
app.get('/alogout', async (req, res) => {
    res.redirect('/');
});

//user logout
app.get('/ulogout',auth, async (req, res) => {
    try{
        //console.log(req.user);
        res.clearCookie("jwt");
        await req.user.save();
        res.redirect('/');
    }
    catch(err)
    {
        res.status(401).send(err);
    }
});

//view account for admin
app.get('/viewaccount', async (req, res) => {
    try {
        const account = await oregister.find();
        res.render(("viewaccount"), {
            account: account
        });
    }
    catch (error) {
        res.send("No account is available right now");
    }
});

//view complain report
app.get("/viewcomplainreport", async (req, res) => {
    try {
        const pending = await newcomplain.find({status:"pending"});
        const onprogress = await newcomplain.find({status:"OnProgress"});
        const completed = await newcomplain.find({status:"completed"});
        res.render(("viewcomplainreport"), {
            pending:pending,
            onprogress:onprogress,
            completed:completed
        });
    }
    catch (error) {
        res.send("No complain is available right now");
    }
});

//edit officer account
app.get("/editaccount/:email", async (req, res) => {
    try {
        // res.send(req.params.email);
        const officeraccount = await oregister.findOne({ email: req.params.email });
        if (officeraccount) {
            res.render("editaccount", {
                account: officeraccount
            });
        }
    }
    catch (err) {
        console.log(err);
    }
});

//edit account validation admin side
app.post("/editaccount", async (req, res) => {
    try {
        const id = req.body.id;
        var editaccount = await oregister.findOne({ _id: id });
        if (editaccount) {
            if (req.body.password == req.body.cpassword) {
                editaccount.username = req.body.username;
                editaccount.email = req.body.email;
                editaccount.password = req.body.password;
                editaccount.cpassword = req.body.cpassword;
                editaccount.area = req.body.area;
                editaccount.department = req.body.department;
                editaccount.save();
                res.render("admin");
            }
            else {
                res.render('editaccount', {
                    mes: 'oops password are not matching',
                    messageClass: 'alert-danger'
                });
            }
        }
    }
    catch (err) {
        res.render("admin", {
            message: "sorry something went wrong"
        });
    }

});

//delete officer account
app.get("/deleteaccount/:email", async (req, res) => {
    try {
        // res.send(req.params.email);
        oregister.findOneAndDelete({ email: req.params.email }, function (err, docs) {
            if (!err) {
                res.render("admin");
            }
            else {
                console.log("error in delteting the officer " + err);
            }
        });
    }
    catch (err) {
        console.log(err);
    }
});

//update status
app.get("/pending/:id", async (req, res) => {
    try {
        var id = req.params.id;
        var usercomplain = await newcomplain.findOne({ _id: id });
        if (usercomplain) {
            usercomplain.status = "pending";
            usercomplain.save();
            res.render("officer");
            // console.log(usercomplain._id);
            // res.send(usercomplain);
        }
    }
    catch (err) {
        res.render("officer");
    }
});

app.get("/onprogress/:id", async (req, res) => {
    try {
        var usercomplain = await newcomplain.findById(req.params.id);
        if (usercomplain) {
            usercomplain.status = "OnProgress";
            usercomplain.save();
            res.render("officer");
        }
    }
    catch (err) {
        res.render("officer");
    }
});

app.get("/completed/:id", async (req, res) => {
    try {
        var usercomplain = await newcomplain.findById(req.params.id);
        if (usercomplain) {
            usercomplain.status = "completed";
            usercomplain.save();
            res.render("officer")
        }
    }
    catch (err) {
        res.render("officer");
    }
});

//feedback form
app.get("/userfeedback/:id",auth, async (req, res) => {
    try {
        // res.send(req.params.email);
        const feedback = await newcomplain.findOne({ _id: req.params.id });
        const officeremail=await oregister.findOne({area:feedback.area,department:feedback.department});
            if(feedback)
            {
                res.render("feedbacktwo",{
                    feedback:feedback,
                    officeremail:officeremail
                });
            }
    }
    catch (err) {
        console.log(err);
    }
});

app.listen(port, () => {
    console.log(`server is running at port no ${port}`);
});