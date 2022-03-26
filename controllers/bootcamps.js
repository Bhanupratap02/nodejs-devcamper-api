const asyncHandler = require("../middleware/async");
const Bootcamp = require("../models/Bootcamp");
const ErrorResponse = require("../utils/errorResponse");
const geocoder = require("../utils/geocoder");
const path = require("path");


//@desc   get all bootcamps
//@route  Get /api/v1/bootcamps
//@access   public
exports.getBootcamps = asyncHandler( async (req,res,next) =>{
    res.status(200).json(res.advancedResults);
});
//@desc   get single bootcamps
//@route  Get /api/v1/bootcamps/:id
//@access   public
exports.getBootcamp =asyncHandler( async (req,res,next) =>{

    const bootcamp = await Bootcamp.findById(req.params.id);
    if(!bootcamp){
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`,404));
    }
    res.status(200).json({success:true,data:bootcamp})
});
 //@desc   create a new  bootcamp
//@route  Get /api/v1/bootcamps
//@access   private
exports.createBootcamp =asyncHandler( async (req,res,next) =>{
req.body.user = req.user.id

 //check for published bootcamp
 const publishedBootcamp = await Bootcamp.findOne({user:req.user.id});
 // if the user is an admin , they can only add one bootcamp
 if(publishedBootcamp && req.user.role !== "admin"){
  return next( new ErrorResponse(`The user with ID ${req.user.id} has already publisheda bootcamp`,400));
 }
 const newBootcamp = await Bootcamp.create(req.body)
return res.status(201).json({
    message:"Success",
    status:"0",
    data:newBootcamp
}) 

});
 //@desc   update a bootcamp
//@route  Get /api/v1/bootcamps/:id
//@access   private
exports.updateBootcamp =asyncHandler( async  (req,res,next) =>{
   
         let  bootcamp = await Bootcamp.findById(req.params.id);
  if(!bootcamp){
         return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`,404));
    }
    // make sure  user is bootcamp owner
    if(bootcamp.user.toString() !== req.user.id && req.user.role !== "admin"){
          return next(new ErrorResponse(`User ${req.params.id} is not authoriaze to update this bootcamp`,401));
    }
     bootcamp = await Bootcamp.findOneAndUpdate(req.params.id,req.body,{
      new:true,
      runValidators:true
  });
    res.status(200).json({success:true,data:bootcamp});
});
 //@desc   delete a bootcamp
//@route  Get /api/v1/bootcamps/:id
//@access   private
exports.deleteBootcamp =asyncHandler( async  (req,res,next) =>{
 
const bootcamp = await Bootcamp.findById(req.params.id);
  if(!bootcamp){
         return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`,404));
    }
    // make sure  user is bootcamp owner
    if(bootcamp.user.toString() !== req.user.id && req.user.role !== "admin"){
          return next(new ErrorResponse(`User ${req.params.id} is not authoriaze to delete this bootcamp`,401));
    }
    bootcamp.remove();
    res.status(200).json({success:true,msg:"bootcamp deleted"}) ;

});

//@desc   get  bootcamps within a radius
//@route  Get /api/v1/bootcamps/radius/:zipcode/:distance
//@access   public
exports.getBootcampsInRadius = asyncHandler( async (req,res,next) =>{
 const {zipcode,distance} = req.params;

 // get lat/lang from geocoder
 const loc = await geocoder.geocode(zipcode);
 const lat = loc[0].latitude;
 const lng = loc[0].longitude;
 
 // cacl radius using radians 
//divide dist by  radius of earth
// earth radius = 3,963 mi / 6,378 km 
const radius = distance / 3963;
const bootcamps = await Bootcamp.find({
    location:{$geoWithin:{$centerSphere: [[lng,lat],radius] } }
});
  res.status(200).json({
      success:true,
      count:bootcamps.length,
      data: bootcamps
  });

});
 //@desc   upload photo for  bootcamp
//@route  Get /api/v1/bootcamps/:id/photo
//@access   private
exports.bootcampPhotoUpload =asyncHandler( async  (req,res,next) =>{
 
         const bootcamp = await Bootcamp.findById(req.params.id);
  if(!bootcamp){
         return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`,404));
    }
     // make sure  user is bootcamp owner
    if(bootcamp.user.toString() !== req.user.id && req.user.role !== "admin"){
          return next(new ErrorResponse(`User ${req.params.id} is not authoriaze to update this bootcamp`,401));
    }
   if(!req.files){
       return next(
           new ErrorResponse("please upload a files",400)
       );
   }
   const file = req.files.file;
   //make sure that image start is  photo
   if(!file.mimetype.startsWith("image")){
     return next(new ErrorResponse("please upload an image file",400));
   }
   // check filesize
   if(file.size > process.env.MAX_FILE_UPLOAD){
      return next(new ErrorResponse(`please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,400));
   }
   //create custom filename
   file.name =`photo_${bootcamp._id}${path.parse(file.name).ext}`;
   file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`,async err=>{
       if(err){
         console.log(err);
       return next(new ErrorResponse(`problem with file upload`,500));
       }
       await Bootcamp.findByIdAndUpdate(req.params.id,{photo:file.name});
       res.status(200).json(
        { success:true,
        data:file.name}
       );
   });
});