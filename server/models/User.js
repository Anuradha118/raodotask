const mongoose = require('mongoose');
const jwt=require('jsonwebtoken');
const bcrypt=require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required:true
    },
    lastName: {
        type: String,
        required:true
    },
    username:{
        type:String,
        required:true
    },
    gender:{
        type:String,
        required:true
    },
    email: {
        type: String,
        required:true
    },
    mobile: {
        type: String,
        required:true
    },
    password: {
        type: String,
        required:true
    },
    active:{
        type:Boolean,
        default:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    tokens:[{
        access:{
            type:String,
            required:true
        },
        token:{
            type:String,
            required:true
        }
    }]
});

userSchema.methods.generateToken=function(){
    var user=this;
    var access='auth';
    var token=jwt.sign({_id:user._id.toHexString(),access},process.env.JWT_SECRET,{expiresIn:'10 days'});

    user.tokens.push({access,token});
    return user.save().then(()=>{
        return token;
    });
};

userSchema.methods.isValidPassword=function(password,callback){
    var user=this;
    if (!user.password)
      return false;
    bcrypt.compare(password,user.password,function(err,valid){
        if(err){
            throw err;
        }else{
            return callback(valid);
        }
    });
};

userSchema.pre('save',function(next){
    var user=this;
    if(user.isModified('password')){
        bcrypt.genSalt(10,(err,salt)=>{
            bcrypt.hash(user.password,salt,(err,hash)=>{
                user.password=hash;
                next();
            });
        });
    }else{
        next();
    }
});

userSchema.statics.findByToken=function(token){
    var User=this;
    var decoded;

    try{
       decoded= jwt.verify(token,process.env.JWT_SECRET);
    }catch(e){
        // return new Promise((resolve,reject)=>{
        //     reject();
        // });
        return Promise.reject();
    }

    return User.findOne({
        _id:decoded._id,
        'tokens.token':token,
        'tokens.access':'auth'
    });
};

userSchema.methods.removeToken=function(token){
    var user=this;
    return user.update({
        $pull:{
            tokens:{token}
        }
    });
};

var User = module.exports = mongoose.model('User', userSchema);