const asyncHandler = require("../middleware/async");
const Course = require("../models/Course");
const ErrorResponse = require("../utils/errorResponse");
const Bootcamp = require("../models/Bootcamp");

//@desc   get Courses
//@route  Get /api/v1/course
//@route  Get /api/v1/bootcamp/:bootcampId/courses
//@access   public
exports.getCourses= asyncHandler( async (req,res,next) =>{
if(req.params.bootcampId){
 const courses   = Course.find({bootcamp:req.params.bootcampId});
 return res.status(200).json({
     success:true,
     count:courses.length,
     data: courses
 });
}else{
   res.status(200).json(res.advancedResults);
}
 
});

//@desc   get  a single course
//@route  Get /api/v1/courses/:id
//@access   public
exports.getCourse= asyncHandler( async (req,res,next) =>{
const course = await Course.findById(req.params.id).populate({
    path:'bootcamp',
    select:'name description'
});
if(!course){
 return next(
     new ErrorResponse(`No course with the id of ${req.params.id}`),404
 );
}
 

 res.status(200).json({
success:true,
count:course.length,
data:course
});
});

//@desc   get   add a course
//@route post /api/v1/bootcamp/:bootcampId/courses
//@access   Private
exports.addCourse= asyncHandler( async (req,res,next) =>{
    req.body.bootcamp = req.params.bootcampId;
    req.body.user = req.user.id;
const bootcamp = await Bootcamp.findById(req.params.bootcampId);
if(!bootcamp){
 return next(
     new ErrorResponse(`No bootcamp with the id of ${req.params.bootcampId}`),404
 );
}
   // make sure  user is bootcamp owner
    if(bootcamp.user.toString() !== req.user.id && req.user.role !== "admin"){
          return next(new ErrorResponse(`User ${req.user.id} is not authoriaze to add a course to bootcamp ${bootcamp._id}`,401));
    }
const course = await Course.create(req.body);
 res.status(200).json({
success:true,
data:course
});
});



//@desc     update course
//@route   put  /api/v1/courses/:id
//@access   Private
exports.updateCourse= asyncHandler( async (req,res,next) =>{
let  course = await Course.findById(req.params.id);
if(!course){
 return next(
     new ErrorResponse(`No course  with the id of ${req.params.id}`),404
 );
}
// make sure  user is course owner
    if(course.user.toString() !== req.user.id && req.user.role !== "admin"){
          return next(new ErrorResponse(`User ${req.user.id} is not authoriaze to update this course ${course._id}`,401));
    }

 course = await Course.findByIdAndUpdate(req.params.id,req.body,{
new: true,
runValidators:true
 });
 res.status(200).json({
success:true,
data:course
});
});


//@desc     delete course
//@route   delete  /api/v1/courses/:id
//@access   Private
exports.deleteCourse= asyncHandler( async (req,res,next) =>{
const  course = await Course.findById(req.params.id);
if(!course){
 return next(
     new ErrorResponse(`No course  with the id of ${req.params.id}`),404
 );
}
// make sure  user is bootcamp owner
    if(course.user.toString() !== req.user.id && req.user.role !== "admin"){
          return next(new ErrorResponse(`User ${req.user.id} is not authoriaze to  delete this course with${course._id}`,401));
    }

 await course.remove();
res.status(200).json({
success:true,
msg:"Course deleted"
});
});