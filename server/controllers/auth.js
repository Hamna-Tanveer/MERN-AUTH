import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../model/userModel.js";
import transporter from "../config/nodemailer.js";
import {
  EMAIL_VERIFY_TEMPLATE,
  PASSWORD_RESET_TEMPLATE,
} from "../config/emailTemplates.js";
//Registeration or Signup Controller...
export const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.json({ succsess: false, message: "Missing Details" });
  }
  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new userModel({ name, email, password: hashedPassword });
    await user.save(); /* here we use another method to save user in data base
    we do not use .create() method here we just simply create new insatance of user model add data in it
    and call the save() function that's it */

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      /*jb local chly ga http py chly ga agr live server py hoga tha https py chly ga abhi
        env me development he jo k production k equal ni which means false tu http jb live hoga tu 
        production which means true tu https*/
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "strict" /*iska mtlb he k jab app local chlary app
      tu apka backend oor frontend dono same hi domain k sath chly ga tu app sameSite strict rakho gy else live server k
      case me app none dono alag alag domains k sath chlynn gy tu agrr env production k equal ni he tu strict else none*/,
      maxAge: 7 * 24 * 60 * 60 * 1000, //expiration time in milisecs
    });
    // Sending Welcom Email...

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: "Welcome From Hamna Tanveer",
      text: `Welcome ${name}! Your account has been created with email id:${email} `,
    };

    await transporter.sendMail(mailOptions);

    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

//Logic Controller...
export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({
      succsess: false,
      message: "Email and Password are required",
    });
  }
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "Invalid Email" });
    }
    const isMatched = await bcrypt.compare(password, user.password);

    if (!isMatched) {
      return res.json({ success: false, message: "Invalid Password" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

//Logout Controller...
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });

    return res.json({ success: true, message: "Logged Out" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

//Generate and Send OTP Controller...
export const sendVerifyOtp = async (req, res) => {
  try {
    const userId = req.userId;

    // console.log("🔍 Model is using collection:", userModel.collection.name);
    //console.log("📂 typeof userId:", typeof req.userId);
    //console.log( "🔍 Is valid ObjectId:",mongoose.Types.ObjectId.isValid(req.userId));

    const user = await userModel.findById(userId);
    // const user = await userModel.findOne({ _id: userId });
    // const user = await userModel.findById(new mongoose.Types.ObjectId(userId));
    //console.log(user);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    if (user.isAccountVerified) {
      return res.json({ success: false, message: "Account Already Verified" });
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000)); //6 digit otp

    user.verifyOtp = otp;

    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: "Account Verification OTP",
      //text: `Your OTP is ${otp}.OTP has been sent to your email.`,
      html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace(
        "{{email}}",
        user.email
      ),
    };
    await transporter.sendMail(mailOptions);
    res.json({
      success: true,
      message: "Verification OTP has been sent to your email.",
    });
  } catch (error) {
    return res.json({
      success: false,
      message: `${error.message} : from catch block of sendVerifyEmail `,
    });
  }
};

//OTP/Email Verifiction Controller...

export const verifyEmail = async (req, res) => {
  const { otp } = req.body;
  const userId = req.userId;
  console.log("userID:", userId);
  console.log("OTP:", otp);
  if (!userId || !otp) {
    return res.json({ success: false, message: "Missing Details" });
  }
  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    if (user.verifyOtp === "" || user.verifyOtp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }
    if (user.verifyOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP Expired" });
    }

    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = 0;
    await user.save();
    return res.json({ success: true, message: "Email Verified Successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

//Authentication of user

export const isAuthenticated = async (req, res) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    return res.json({
      success: false,
      message: `${error.message} : from catch block of isAuthenticated `,
    });
  }
};

//Password reset otp...
export const sendResetOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.json({ success: false, message: "Email is required" });
  }
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found!" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() * 15 * 60 * 1000; //15mins
    await user.save();

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: "Password Reset OTP",
      // text: `Your OTP for resetting your password is ${otp}.Use this OTP to proceed with resetting your password.`,
      html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace(
        "{{email}}",
        user.email
      ),
    };
    await transporter.sendMail(mailOptions);
    return res.json({
      success: true,
      message: "Reset OTP has been sent to your email.",
    });
  } catch (error) {
    return res.json({
      success: false,
      message: `${error.message} : from catch block of sendResetOtp `,
    });
  }
};
// Reset User Password
export const resetPassword = async (req, res) => {
  const { email, newpassword, otp } = req.body;
  console.log("Email:", email);
  console.log("Password:", newpassword);
  console.log("OTP:", otp);
  if (!email || !newpassword || !otp) {
    return res.json({
      success: false,
      message: "All Input fields are required",
    });
  }
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found!" });
    }
    if (user.resetOtp === "" || user.resetOtp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }
    if (user.resetOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP Expired" });
    }
    const hashPass = await bcrypt.hash(newpassword, 10);
    user.password = hashPass;
    user.resetOtp = "";
    user.resetOtpExpireAt = 0;
    await user.save();
    return res.json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    return res.json({
      success: false,
      message: `${error.message} : from catch block of resetPassword `,
    });
  }
};
