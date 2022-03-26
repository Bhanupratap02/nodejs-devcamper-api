const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// load env vars 
dotenv.config();

// load models 
const Bootcamp = require("./models/Bootcamp");
const Course = require("./models/Course");
const User = require("./models/User");
const Review = require("./models/Review");
//connect to Db 
mongoose
  .connect("mongodb://127.0.0.1:27017/DevCamper", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Read JSON  files 
  const bootcamps = JSON.parse(fs.readFileSync(`${__dirname}/_data/bootcamps.json`,"utf-8"));
  const courses = JSON.parse(fs.readFileSync(`${__dirname}/_data/courses.json`,"utf-8"));
  const users = JSON.parse(fs.readFileSync(`${__dirname}/_data/users.json`,"utf-8"));

  const reviews = JSON.parse(fs.readFileSync(`${__dirname}/_data/reviews.json`,"utf-8"));


  //Import into DB
  const importData = async ()=>{
      try {
          await Bootcamp.create(bootcamps);
          await Course.create(courses);
          await User.create(users);
          await Review.create(reviews);
          console.log("Data imported.....");
          process.exit();
      } catch (err) {
          console.error(err);
      }
  }
  
  // Delete data
  const deleteData = async () =>{
        try {
          await Bootcamp.deleteMany();
           await Course.deleteMany();
           await User.deleteMany();
           await Review.deleteMany();
           
         console.log("Data destroyed....");
          process.exit();
      } catch (err) {
          console.error(err);
      }
  }
  if(process.argv[2] === "-i"){
     importData();
  }else if(process.argv[2] ==="-d"){
      deleteData();
  }