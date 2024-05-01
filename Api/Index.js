const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const app = express();
const port = 8000;
const cors = require("cors");

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const jwt = require("jsonwebtoken");

mongoose
  .connect("mongodb+srv://anishpandey:anish@cluster1.qos4mg9.mongodb.net/")
  .then(() => {
    console.log("Connected to MongoDb");
  })
  .catch((err) => {
    console.log(" Error connecting to mongoDB", err);
  });

app.listen(port, () => {
  console.log("Server is running on port 8000");
});

const User = require("./Models/User");
const Order = require("./Models/Order");

//function to send verfication email to the user
const sendVerificationEmail = async (email, verificationToken) => {
  //create a nodemailer transport

  const transporter = nodemailer.createTransport({
    //configure the email service
    service: "gmail",
    auth: {
      user: "anishpandey6200@gmail.com",
      pass: "kflfjjzelebofaaq",
    },
  });

  //compose the email message

  const mailOptions = {
    from: "amazon.com",
    to: email,
    subject: "Email verfication",
    text: `please click the followinf link to verify your email: http://localhost:8000/verify/${verificationToken}`,
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Error sending verification email", error);
  }
};
//send the email

//endpoint to register in the app

app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    //create a new user

    const newUser = new User({ name, email, password });

    //generate and store  the verfication token

    newUser.verificationToken = crypto.randomBytes(20).toString("hex");

    //save the user to database
    await newUser.save();

    //send verification email to the user
    sendVerificationEmail(newUser.email, newUser.verificationToken);
    res.status(200).json({ message: "email is sended!" });
  } catch (error) {
    console.log("error registering user", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

//endpoint to verify the email

app.get("/verify/:token", async (req, res) => {
  try {
    const token = req.params.token;
    //find the user with the given verification token

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(404).json({ message: "Invalid verification token" });
    }
    //mark the user verified
    user.verified = true;
    user.verificationToken = undefined;

    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Email Verifcation Failed" });
  }
});


const generateSecretKey =()=>{
  const secretkey =crypto.randomBytes(32).toString("hex");
  return secretkey;
}
 const secretkey = generateSecretKey();


//endpoint to login the user!

app.post("/login", async(req, res) =>{
  try{
    const {email, password} = req.body;

   //check if the user exists
   const user = await User.findOne({email});
    if (!user){
      return res.status(401).json({message:"Invalid email or password"});
    }
    //check if the password is correct
    if ( user.password !== password){
      return res.status(401).json({message:"Invalid password"});
    }

    //generate a token
    const token = jwt.sign({userId:user._id},secretkey);

    res.status(200).json({token})

  }catch(error){
    res.status(500).json({message:"Login Failed"});
  }
})