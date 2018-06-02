const responseGenerator=require('./../utils/responsegenerator');

var User=require('./../models/User');

module.exports.auth=(req,res,next)=>{

    var token=req.body.token||req.query.token||req.headers['x-auth'];

    if(token){
        User.findByToken(token).then((user)=>{
            if(!user){
                // return Promise.reject();
                var response=responseGenerator.generate(true,"Authentication Failed",401,null);
                res.json(response);
            }else{
                req.user=user;
                req.token=token;
                next();
            }
        }).catch((e)=>{
            var response=responseGenerator.generate(true,"Some Error",500,null);
            res.json(response);
        });

    }
};