require('./../configs/config');
const router=require('express').Router();
const mongoose=require('./../db/mongoose');
const events=require('events');
const randomString=require('random-string');
const sendotp=require('sendotp');
const _=require('lodash');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const nodemailer=require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const User=require('./../models/User');
const responseGenerator=require('./../utils/responsegenerator');
const custValidator=require('./../middlewares/validator');
const authenticate=require('./../middlewares/authenticate');

var eventEmitter = new events.EventEmitter();
var myResponse={};

eventEmitter.on('send_otp',function(info){

    // send otp to the registered mobile number and email address.
    const send_otp=new sendotp(process.env.MSG91_AUTHKEY,"OTP for resetting the password is {{otp}}. Please donot share it with anybody");
    send_otp.send(info.mobile,"EdAcademy",info.id,function(error,data,response){
        console.log(data);
    });
    var options = {
        auth: {
            api_user: process.env.SENDGRID_USER,
            api_key: process.env.SENDGRID_SECRET
        }
    };
    var client = nodemailer.createTransport(sgTransport(options));

    const email = {
        from: 'Raodo <support@raodo.com>', // sender address
        to: info.email, // list of receivers
        subject: 'Password Reset', // Subject line
        html: `<p>You have initiated a password reset.<br/>OTP for resetting the password : <b style="color:red">${info.id}</b>.Never share the OTP with anyone.</p>` // plain text body
    };

    client.sendMail(email, function (err, info) {
        if (err)
            console.log(err);
        else
            console.log("huh " + info);
    });
});

router.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
});

//api for sign up
router.post('/signup',custValidator.signup,(req,res)=>{
    User.findOne({$or:[{'username':req.body.username},{'email':req.body.email}
    ]}).then((user)=>{
        if(user){
            myResponse=responseGenerator.generate(true,'User already exist!',409,null);
            res.send(myResponse);
        }else{
            var newUser=new User();
            newUser.firstName=req.body.firstname;
            newUser.lastName=req.body.lastname;
            newUser.email=req.body.email;
            newUser.mobile=req.body.mobile;
            newUser.gender=req.body.gender;
            newUser.password=req.body.password;
            newUser.username=req.body.username;
            newUser.save().then(()=>{
                console.log('successfully saved');
                myResponse=responseGenerator.generate(false,"Account created successfully! Now you can Login!!", 200, null);
                res.send(myResponse);
            }).catch((err)=>{
                myResponse=responseGenerator.generate(true,"Some error",500,null);
                res.send(myResponse);
            })
        }
    })
});

//API for signin
router.post('/login',custValidator.signin,(req,res)=>{
    var body=_.pick(req.body,['username','password']);
    User.findOne({'username':body.username}).then((user)=>{
        if(user==null){
            myResponse=responseGenerator.generate(true, "Invalid username", 400, null);
            res.send(myResponse);
        }else if(user){
            user.isValidPassword(body.password,function(valid){
                if(valid){
                    user.generateToken().then((token)=>{
                        myResponse=responseGenerator.generate(false,"Login Successful.",200,{token:token});
                        res.send(myResponse); 
                    });
                }else{
                    myResponse=responseGenerator.generate(true,"Wrong Password or Password didn't match",400,null);
                    res.send(myResponse);
                }
            });
        }}).catch((err)=>{
            myResponse=responseGenerator.generate(true, "Some error", 500, null);
            res.send(myResponse); 
        })
    });

//API to change password
router.post('/changePassword', authenticate.auth,custValidator.resetPassword,(req, res)=> {
    var password = req.body.password;
    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(password,salt,(err,hash)=>{
            password=hash;
            // console.log(req.session.email);
            User.findOneAndUpdate({
                'email': req.session.email
            }, {
                $set: {
                    'password': password
                }
            }).then((doc) =>{
                myResponse = responseGenerator.generate(false, "Password changed successfully", 200, null);
                res.send(myResponse);
                }).catch((err)=>{
                    myResponse = responseGenerator.generate(true, "Some Internal Error", 500, null);
                    res.send(myResponse);   
                });
            });
        });
    });

//API for forgot password
router.post('/forgotPassword', custValidator.forgotPassword,(req, res)=>{
    var email = req.body.email;
    req.session.email = email;
    req.session.shortid = randomString({length:6,numeric:true,letters:false,special:false});
    User.findOne({'email':email}).then((user)=>{
        // console.log(user);
            eventEmitter.emit('send_otp', {
                email: email,
                mobile:user.mobile,
                id: req.session.shortid
            });
            var response = responseGenerator.generate(false, "OTP sent successfully to your registered mobile number and email id", 200, req.session.shortid);
            res.json(response);
        }).catch((err)=>{
            var response = responseGenerator.generate(true, "Some Error Occurred", 500, null);
            res.json(response);
        });
});

// API to verify the OTP
router.post('/verifyCode',(req, res)=>{
    var id = req.body.otp;
    var email=req.body.email;
    User.findOne({'email':email}).then((user)=>{
            if(id==req.session.shortid){
                user.generateToken().then((token)=>{
                    var response = responseGenerator.generate(false, "OTP Verification Successful", 200, token);
                    res.json(response);
                });
            }else {
                myResponse = responseGenerator.generate(true, "OTP Verification Failed", 400, null);
                res.json(myResponse);
            }
        }).catch((err)=>{
                console.log(err);
            });
});


//api to logout of the session
router.get('/signout', authenticate.auth, (req, res)=>{
    req.user.removeToken(req.token).then(()=>{
        myResponse=responseGenerator.generate(false,"User Logout successful",200,null);
        res.send(myResponse);
    },()=>{
        myResponse=responseGenerator.generate(true,"Cannot LogOut User",400,null);
        res.send(myResponse);
    })
  
});

// api to get details of logged-in user
router.get('/details',authenticate.auth,(req,res)=>{
    User.findOne({_id:req.user.id}).then((user)=>{
        if(!user){
            myResponse=responseGenerator.generate(false,'No such user have registered yet',200,null);
            res.send(myResponse);
        }else{
            var userDetail=user.toObject();
            delete userDetail.password;
            delete userDetail.tokens;
            
            myResponse=responseGenerator.generate(false,'User Details',200,{user:userDetail});
            res.send(myResponse);
        }
    }).catch((err)=>{
        myResponse=responseGenerator.generate(true,'Some Internal Error',500,null);
        res.send(myResponse);
    });
});

module.exports = router;