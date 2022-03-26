//@desc 
const logger = (req,res,next) =>{
 console.log(`hello world`);
 next()
}
module.exports = logger;