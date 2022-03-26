const ErrorResponse = require("../utils/errorResponse");

const errorHandler = (err,req,res,next) =>{
    let error = {...err}
    error.messsge = err.message;
//log to console for dev 
console.log(err);
//mongoose bad ObjectId
if(err.name ==="CastError"){
    const message = `Resource not found `;
    error = new ErrorResponse(message,400);
}
// mongoose duplicate key 
if(err.code ===11000){
const message ="Duplicate field value entered";
error = new ErrorResponse(message,400);
}
// mongoose validation error 
 if (err.name === 'ValidatorError') {
     console.log("I reach to validation error");
    const message = Object.values(err.errors).map(val => val.message);
    
    error = new ErrorResponse(message, 400);
  }
res.status(err.statusCode || 500).json({
    success:false,
    error:err.message || "Server Error"
});
};
module.exports = errorHandler;
