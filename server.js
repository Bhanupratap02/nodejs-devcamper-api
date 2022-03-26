const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const morgan = require('morgan')
const cookieParser = require("cookie-parser")
const fileupload = require("express-fileupload")
const errorHandler = require("./middleware/error");
const path = require("path");
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require("helmet");
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const  cors = require('cors')
//load .env file
dotenv.config();


//initialize express application
const app =express()

//load middlewares
app.use(morgan('dev'))
app.use(express.json())
app.use(cookieParser())
//file uploading
app.use(fileupload());
//sanitize data
app.use(mongoSanitize());
//set security headers
app.use(helmet());
//Prevent xss attacks
app.use(xss());
// Rate limiting
const limiter = rateLimit({
  windowMs: 10*60*1000, //10 mins
  max:100
});
app.use(limiter);
// Prevent http param pollution
app.use(hpp());
//enable cors
app.use(cors());

//set staic folder
app.use(express.static(path.join(__dirname,"public")));



//defining routes
app.use('/api/v1/bootcamp', require('./routes/bootcamps'))
app.use('/api/v1/courses', require('./routes/courses'));
app.use('/api/v1/auth', require('./routes/auth'));
app.use("/api/v1/users",require("./routes/users"));
app.use("/api/v1/reviews",require("./routes/reviews"));
app.use(errorHandler);

//defining port for server
const port = process.env.PORT || 3000
mongoose
  .connect("mongodb://127.0.0.1:27017/DevCamper", {
    useNewUrlParser: true,
    useUnifiedTopology: true,

  })
  .then(() => {
    console.log("databse connected");
    app.listen(port,() => {
      console.log(`server is running on ${port}`)
    });
  })
  .catch((err) => {
    console.log("Error in connecting to DataBase", err.message);
  });



