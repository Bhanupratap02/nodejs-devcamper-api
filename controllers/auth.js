const asyncHandler = require("../middleware/async");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const sendEmails = require("../utils/sendEmails");
const crypto =require("crypto");


//@desc   Register user
//@route  post  /api/v1/auth/register
//@access   public

exports.register = asyncHandler( async (req,res,next) =>{
   const {name,email,password,role } = req.body;
   //create user
   const user = await User.create({
       name,
       email,
       password,
       role
   });
   sendTokenResponse(user,200,res);
});

//@desc   login 
//@route  post  /api/v1/auth/login
//@access   public

exports.login = asyncHandler( async (req,res,next) =>{
   const {email,password} = req.body;
  //validate email and password
   if(!email || !password){
    return next(new ErrorResponse(`Please provide an email and password`,400));
   }
   //check for user
    const user = await User.findOne({email}).select('+password');
    if(!user){
        return next(new ErrorResponse(`Invalid credentials`,401));
    }
 //check if password matches
 const isMatch = await user.matchPassword(password);
 if(!isMatch){
     return next(new ErrorResponse(`Invalid credentials`,401));
 }
   sendTokenResponse(user,200,res);
});

//@desc   log user out / clear cookie
//@route  get   /api/v1/auth/me
//@access   private
exports.logout = asyncHandler( async (req,res,next) =>{
res.cookie("token","none",{
  expires:new Date(Date.now() + 10*1000),
  httpOnly:true
});
 res.status(200).json({
   success:true,
   data:{}
 });
});





//@desc   get current login user
//@route  post  /api/v1/auth/me
//@access   private
exports.getMe = asyncHandler( async (req,res,next) =>{
 const user = await User.findById(req.user.id);

 res.status(200).json({
   success:true,
   data:user
 });
});

//@desc   update user deatils
//@route  put  /api/v1/auth/updatedetails
//@access   private
exports.updateDetails = asyncHandler( async (req,res,next) =>{
  const fieldsToUpdate = {
    name:req.body.name,
    email:req.body.email
  }
 const user = await User.findByIdAndUpdate(req.user.id,fieldsToUpdate,{
   new:true,
   runValidators:true
 });

 res.status(200).json({
   success:true,
   data:user
 });
});


//@desc       Updatev password
//@route  put  /api/v1/auth/updatepassword
//@access   private
exports.updatePassword = asyncHandler( async (req,res,next) =>{
 const user = await User.findById(req.user.id).select("+password");
 // check current password
  if(!await user.matchPassword(req.body.currentPassword)){
    return next(new ErrorResponse(`Password is incorrect`,401));
  }
  user.password = req.body.newPassword;
  await user.save();
sendTokenResponse(user,200,res);

});


//@desc   Forgot password
//@route  post  /api/v1/auth/forgotpassword
//@access   public
exports.forgotPassword = asyncHandler( async (req,res,next) =>{
 const user = await User.findOne({email:req.body.email});
 if(!user){
   return next(new ErrorResponse(`There is no user with that email`,404));
 }
 // get reset token 
 const resetToken = user.resetpasswordToken();
//  console.log(resetToken);
 await user.save({validateBeforeSave:false});
 //create reset url
 const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/auth/resetpassword/${await resetToken}`;
const message = `You are receiving this email becasuse this email because you has requested the reset of a password,please make a put request to: \n\n ${resetUrl}`;
try {
  await sendEmails({
    email:user.email,
    subject:"Password reset token",
    message

  });
   res.status(200).json({
   success:true,
   data:"Email has sent"
 });
} catch (error) {
  console.log(error)
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save({validateBeforeSave:false});
  return next(new ErrorResponse("Email could not be sent",500));
}
});

//@desc   Reset password
//@route  put  /api/v1/auth/resetpassword/:resettoken
//@access   public
exports.resetPassword = asyncHandler( async (req,res,next) =>{
// get hashed token 
const resetPasswordToken = crypto
.createHash("sha256")
.update(req.params.resettoken)
.digest("hex");

 const user = await User.findOne({
resetPasswordToken,
resetPasswordExpire:{$gt:Date.now()}
 });
 if(!user){
   return next(new ErrorResponse("Invalid token",400));
 }
 //set new password
 user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  sendTokenResponse(user,200,res);
});












//get token from model and create cookie and send response

const sendTokenResponse = (user,statusCode,res)=>{
 //create token 
   const token = user.getSignedJwtToken();

   const options = {
       expires : new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly:true 
   };
   if(process.env.NODE_ENV === "production"){
     options.secure = true;
   }
   res.status(statusCode)
   .cookie('token',token,options)
   .json({
    success:true,
    token,
    msg:"here the token with cookie"

   });
}


