const _ = require("lodash")
const jwt = require('jsonwebtoken')
const User = require('../models/user.model')
const bcrypt = require('bcryptjs')
// const twilio = require('twilio')
// const  redisClient  = require("../../config/redis")
const returnError = require("./dto.service")
const { sendMailFunc } = require("../services/nodemailerService/nodemailer.service")
const { otpMailTemplate, forgotPasswordOtpTemplate } = require("../services/nodemailerService/templates")
const redisClient = require("../config/redis")
const { default: mongoose } = require("mongoose")
const { USER_ROLES, ADMIN_ROLES } = require("../constants")
const {
    buildUserPayloadFromBody,
    findUserByLoginIdentifier,
} = require("../utils/user.helpers")
const userCtlr = {}

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
};

userCtlr.register = async ({ body }) => {
    const userCount = await User.countDocuments({});

    if (userCount > 0) {
        throw returnError(403, 'Initial setup is complete. Ask an administrator to create your account.');
    }

    const existingRejectedUser = await User.findOne({
        $or: [
            { 'email.address': body.email?.address },
            { 'phone.number': body.phone?.number },
            { 'phone.countryCode': body.phone?.countryCode }
        ],
        isBlocked: true
    });

    const assignedRole = USER_ROLES.ADMINISTRATOR;

    let user;
    if (existingRejectedUser) {
        const encryptedPassword = await hashPassword(body.password);

        const updateData = {
            ...buildUserPayloadFromBody(body, {
                role: assignedRole,
                isApproved: true,
                isBlocked: false,
            }),
            password: encryptedPassword,
        };

        user = await User.findByIdAndUpdate(existingRejectedUser._id, updateData, { new: true });
    } else {
        user = new User(buildUserPayloadFromBody(body, {
            role: assignedRole,
            isApproved: true,
        }));

        user.password = await hashPassword(body.password);
        user = await user.save();
    }

    return { message: "Administrator account created successfully", user };
};

userCtlr.createStaff = async ({ body }) => {
    const existingUser = await User.findOne({
        $or: [
            { 'email.address': body.email?.address },
            { 'phone.number': body.phone?.number },
        ],
    });

    if (existingUser) {
        throw returnError(400, 'A user with this email or phone already exists');
    }

    const user = new User(buildUserPayloadFromBody(body, {
        role: body.role || USER_ROLES.VIEWER,
        isApproved: true,
    }));

    user.password = await hashPassword(body.password);
    const savedUser = await user.save();
    const safeUser = await User.findById(savedUser._id).select({ password: 0 });

    return {
        message: 'Staff user created successfully',
        data: safeUser,
    };
};

userCtlr.login  = async ({
    body,
    res
    })=> {
        let user = await findUserByLoginIdentifier(User, body.username)

        if(!user){
            throw returnError(400, "No such account");
        }
        if (user.isBlocked) {
            throw returnError(403, "Your account has been blocked");
        }
        if (!user.isApproved) {
            throw returnError(403, "Your account is pending approval");
        }
        const checkPassword = await bcrypt.compare(body.password,user.password)
        if (!checkPassword){
            throw returnError(400, "Invalid Credentials");
        }
        await user.save();
        const tokenData = {
            id: user._id, 
            role: user.role,
            email: user.email.address,
            number: user.phone.number
        }
        const token = jwt.sign(tokenData, process.env.JWT_SECRET,{expiresIn:'7d'})
        const safeUser = await User.findById(user._id).select({ password: 0 })
        return ({token: token, user: safeUser })
    }

userCtlr.account = async ({
    user
    })=>{
        // console.log('hi server')
        const userData = await(User.findById(user.id).select({password:0}))
        if(!userData) {
            throw returnError(400, "No such account")
        } else {
            return userData
        }
    }

userCtlr.list = async ({}) => {
    const users = await User.find().select({ password:0 })

    if(!users) {
        throw returnError(400, "No users found")
    }
    return { data: users}
}

userCtlr.updateUser = async ({ body, file }) => {
    const { _id } = body;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        throw new Error('Invalid user ID');
    }

    const existingUser = await User.findById(_id);
    if (!existingUser) {
        throw new Error('User not found');
    }

    // Build update data, excluding password and nested fields that will be set separately
    const updateData = {
        firstName: body.firstName,
        lastName: body.lastName,
    };

    // Handle email update
    const emailAddress = body['email.address'] ?? body.email?.address;
    if (emailAddress !== undefined) {
        updateData.email = {
            ...existingUser.email,
            address: emailAddress,
        };
    }

    // Handle phone update - preserve existing phone properties like isVerified
    const phoneNumber = body['phone.number'] ?? body.phone?.number;
    const countryCode = body['phone.countryCode'] ?? body.phone?.countryCode;
    if (phoneNumber !== undefined || countryCode !== undefined) {
        updateData.phone = {
            ...existingUser.phone,
            number: phoneNumber !== undefined ? phoneNumber : existingUser.phone?.number,
            countryCode: countryCode !== undefined ? countryCode : existingUser.phone?.countryCode,
        };
    }

    // Add any other fields from body that are not nested (excluding password, _id, and phone/email nested fields)
    Object.keys(body).forEach(key => {
        if (key !== '_id' && 
            key !== 'password' && 
            key !== 'email.address' && 
            key !== 'phone.number' && 
            key !== 'phone.countryCode' &&
            !['firstName', 'lastName'].includes(key)) {
            updateData[key] = body[key];
        }
    });

    const updatedUser = await User.findByIdAndUpdate(_id, updateData, { new: true }).select({ password: 0 });

    return { message: "Profile updated successfully", data: updatedUser };
};

userCtlr.toggleApproveUser = async ({ params: { userId }, body }) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw { status: 400, message: "Invalid user ID" };
    }

    const user = await User.findById(userId);
    if (!user) {
        throw { status: 404, message: "User not found" };
    }

    // Option 1: Set based on body value (recommended)
    if (typeof body.isApproved !== 'boolean') {
        throw { status: 400, message: "Missing or invalid isBlocked value in body" };
    }

    user.isApproved = body.isApproved;
    await user.save();

    return {
        message: `User has been ${body.isApproved ? 'Approved' : 'disapproved'} successfully`,
        data: user
    };
};

userCtlr.toggleBlockUser = async ({ params: { userId }, body }) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw { status: 400, message: "Invalid user ID" };
    }

    const user = await User.findById(userId);
    if (!user) {
        throw { status: 404, message: "User not found" };
    }

    // Option 1: Set based on body value (recommended)
    if (typeof body.isBlocked !== 'boolean') {
        throw { status: 400, message: "Missing or invalid isBlocked value in body" };
    }

    user.isBlocked = body.isBlocked;
    await user.save();

    return {
        message: `User has been ${body.isBlocked ? 'blocked' : 'unblocked'} successfully`,
        data: user
    };
};

userCtlr.delete = async ({ params: { userId } }) => {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw { status: 400, message: "Valid User ID is required" };
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
        throw { status: 404, message: "User not found" };
    }

    return { message: "User deleted Successfully", data: user };
};


userCtlr.sendPhoneOtp = async ({ body: { countryCode, number } }) => {
    const phoneNumber = countryCode + number;
    
    // Check for existing non-rejected user
    // const isPhoneExist = await User.findOne({ 
    //     'phone.countryCode': countryCode, 
    //     'phone.number': number,
    //     isRejected: { $ne: true }  // Changed to allow rejected users
    // });

    // if (isPhoneExist) {
    //     throw returnError(400, "Phone Number already exists");
    // }

    const redisPhoneData = await redisClient.get(phoneNumber);
    if (redisPhoneData && redisPhoneData.count > 5) {
        throw returnError(400, "Too many requests, try again after some time");
    }

    const otp = Math.floor(Math.random() * 900000) + 100000;

    const response = await redisClient.set(
        phoneNumber,
        JSON.stringify({
            otp,
            count: (redisPhoneData?.count ?? 0) + 1,
            createdAt: redisPhoneData?.createdAt ?? new Date(),
            lastSentAt: new Date(),
        }),
        60 * 10
    );

    console.log("Response", response)

    // const smsData = await sendSmsFunc({
    //   to: phoneNumber,
    //   message: `Your OTP for SAG signup is: ${otp}`,
    // });

    if (!response) {
        throw returnError(400, "Unable to send OTP to phone");
    }

    return { isSent: true, otp: otp };
};

userCtlr.verifyPhoneOtp = async ({ body: { countryCode, number, otp } }) => {
    const phoneNumber = countryCode + number;
    const storedOtpDataString = await redisClient.get(phoneNumber);
    console.log("📦 Stored OTP Data from Redis:", storedOtpDataString);

    if (!storedOtpDataString) {
        throw returnError(400, "Phone number not found or OTP expired");
    }

    let storedOtpData;
    try {
        storedOtpData = JSON.parse(storedOtpDataString);
    } catch (err) {
        throw returnError(500, "OTP data corrupted");
    }

    if (storedOtpData.otp != otp) {
        throw returnError(400, "Incorrect OTP");
    }

    console.log("number", number)
    console.log("countryCode", countryCode)
    const user = await User.findOneAndUpdate(
        { 'phone.countryCode': countryCode, 'phone.number': number },
        { $set: { 'phone.isVerified': true } },
        { new: true }
    );

    if (!user) {
        throw returnError(404, "User not found");
    }

    await redisClient.del(phoneNumber);

    return {
        isVerified: true,
        verificationToken: jwt.sign(
        { phoneNumber },
        process.env.JWT_SECRET,
        { expiresIn: "10m" }
        ),
        user: user,
    };
};

userCtlr.sendMailOtp = async ({ body: { email } }) => {
    // Check for existing non-rejected user
    // const isEmailExist = await User.findOne({ 
    //     'email.address': email,
    //     isBlocked: { $ne: true }  // Changed to allow rejected users
    // });

    // if (isEmailExist) {
    //     throw returnError(400, "Email already exists");
    // }

    const redisMailData = await redisClient.get(email);
    if (redisMailData && redisMailData.count > 5) {
        throw returnError(400, "Too many request, try again after sometime");
    }

    const otp = Math.floor(Math.random() * 900000) + 100000;
    // console.log('otp:', otp);

    await redisClient.set(
        email,
        {
            otp,
            count: (redisMailData?.count ?? 0) + 1,
            createdAt: redisMailData?.createdAt ?? new Date(),
            lastSentAt: new Date(),
        },
        60 * 10
    );

    const mailData = await sendMailFunc({
        to: email,
        subject: "TechnoAi Tracking Signup OTP",
        html: otpMailTemplate(otp),
    });

    if (!mailData.isSend) {
        throw returnError(400, "Not able send mail");
    }

    return {
        isSent: true,
    };
};

userCtlr.verifyMailOtp = async ({ body: { email, otp } }) => {
    const storedOtp = await redisClient.get(email);
    if (!storedOtp) {
        throw returnError(400, "Email doesn't exist or OTP expired");
    }
    if (storedOtp.otp !== otp) {
        throw returnError(400, "Incorrect OTP");
    }
    const user = await User.findOneAndUpdate(
        { 'email.address': email },
        { $set: { 'email.isVerified': true } },
        { new: true }
    );

    if (!user) {
        throw returnError(404, "User not found");
    }
    await redisClient.del(email);
    return {
        email: {
            isVerified: true,
        },
        verificationToken: jwt.sign(
            {
                email,
            },
            process.env.JWT_SECRET,
            { expiresIn: "10m" }
        ),
    };
};

userCtlr.changePassword = async ({ body, user })=>{
    const { currentPassword, newPassword } = body
    const salt =  await bcrypt.genSalt()
    const newUser = await User.findById(user.id)
    const checkPassword = await bcrypt.compare(currentPassword, newUser.password)
    if(!checkPassword){
        throw returnError(400, "Current Password is Incorrect");
    }
    const hashedPassword = await bcrypt.hash(newPassword, salt)
    newUser.password = hashedPassword
    await newUser.save()
    return { message: "Password Changed Successfully" }
}

userCtlr.changePasswordByAdmin = async ({ params: { userId }, body }) => {
    const { newPassword } = body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw returnError(400, "Invalid user ID");
    }

    if(!newPassword) {
        throw returnError(400, "New Password is required");
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
        throw returnError(404, "User not found");
    }
    const checkPassword = await bcrypt.compare(newPassword, targetUser.password)
    if(checkPassword) {
        throw returnError(400, "New Password is the same as the current password");
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    targetUser.password = hashedPassword;
    await targetUser.save();

    return { message: "Password changed successfully by Admin" };
};

userCtlr.fPSendOtp = async(req, res)=>{
    const generateOTP = () => {
        return Math.floor(100000 + Math.random() * 900000);
    };
    const accountSid = process.env.TWILIO_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioClient = twilio(accountSid, authToken);
    const twilioPhoneNumber = '+12515720668';
    const user = await User.findOne({'phone.number':req.body.phone})
    if(!user){
        return res.status(404).json({ message : "User not found." });
    }
    const phoneNumber = user.phone.countryCode+user.phone.number
    // console.log('phone:',phoneNumber)

    const otp= generateOTP()
    await User.findOneAndUpdate({'phone.number':req.body.phone},{'phone.otp':otp},{new:true})
    try {
        await twilioClient.messages.create({
          body: `Your OTP for password reset is: ${otp}`,
          from: twilioPhoneNumber,
          to: phoneNumber
        });
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        // console.error('Error sending OTP:', error);
        res.status(500).json({ message: 'Failed to send OTP' });
    }
}

userCtlr.fPVerifyOtpAndChangePassword = async(req, res)=>{
    const {sentOtp,newPassword} = req.body
    const user = await User.findOne({'phone.otp':sentOtp})
    // const storedOtp = user.phone.otp
    if(!user){
        return res.status(400).json({message:"Invalid OTP"});
    }
    try{
        const salt =  await bcrypt.genSalt()
        const hashedPassword = await bcrypt.hash(newPassword,salt)
        // user.password=hashedPassword
        await User.findOneAndUpdate({'phone.otp':sentOtp},{password:hashedPassword,'phone.otp':null},{new:true})
        res.status(201).json({message:"password changed successfully"})
    }catch(err){
        res.status(500).json('internal server error')
    }
}

userCtlr.fpSendMailOtp = async ({ body }) => {
    if (!body || !body.email) {
        throw returnError(400, "Email is required");
    }

    const { email } = body;

    // Check if user exists with this email
    const user = await User.findOne({ 'email.address': email });
    if (!user) {
        throw returnError(404, "User with this email address not found");
    }

    const redisMailData = await redisClient.get(`fp_${email}`);
    if (redisMailData && redisMailData.count > 5) {
        throw returnError(400, "Too many requests, try again after some time");
    }

    const otp = Math.floor(Math.random() * 900000) + 100000;

    await redisClient.set(
        `fp_${email}`,
        {
            otp,
            count: (redisMailData?.count ?? 0) + 1,
            createdAt: redisMailData?.createdAt ?? new Date(),
            lastSentAt: new Date(),
        },
        60 * 10 // 10 minutes expiration
    );

    const mailData = await sendMailFunc({
        to: email,
        subject: "TechnoAi Tracking - Password Reset OTP",
        html: forgotPasswordOtpTemplate(otp),
    });

    if (!mailData.isSend) {
        throw returnError(400, "Unable to send OTP email");
    }

    return {
        isSent: true,
    };
};

userCtlr.fpVerifyMailOtp = async ({ body }) => {
    if (!body) {
        throw returnError(400, "Request body is required");
    }

    const { email, otp } = body;

    if (!email || !otp) {
        throw returnError(400, "Email and OTP are required");
    }

    const storedOtpData = await redisClient.get(`fp_${email}`);
    if (!storedOtpData) {
        throw returnError(400, "Email not found or OTP expired");
    }

    if (storedOtpData.otp != otp) {
        throw returnError(400, "Incorrect OTP");
    }

    // Find user by email to verify user exists
    const user = await User.findOne({ 'email.address': email });
    if (!user) {
        throw returnError(404, "User not found");
    }

    // Generate verification token and store it in Redis (valid for 10 minutes)
    const verificationToken = jwt.sign(
        { email, purpose: 'forgot-password' },
        process.env.JWT_SECRET,
        { expiresIn: "10m" }
    );

    // Store verification token in Redis
    await redisClient.set(
        `fp_verified_${email}`,
        {
            verified: true,
            token: verificationToken,
            verifiedAt: new Date()
        },
        60 * 10 // 10 minutes
    );

    // Delete OTP from redis after successful verification
    await redisClient.del(`fp_${email}`);

    return {
        isVerified: true,
        verificationToken: verificationToken,
        message: "OTP verified successfully"
    };
};

userCtlr.fpChangePassword = async ({ body }) => {
    if (!body) {
        throw returnError(400, "Request body is required");
    }

    const { email, verificationToken, newPassword } = body;

    if (!email || !verificationToken || !newPassword) {
        throw returnError(400, "Email, verification token, and new password are required");
    }

    // Verify the token
    let decoded;
    try {
        decoded = jwt.verify(verificationToken, process.env.JWT_SECRET);
        if (decoded.email !== email || decoded.purpose !== 'forgot-password') {
            throw returnError(400, "Invalid verification token");
        }
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw returnError(400, "Verification token has expired");
        }
        throw returnError(400, "Invalid verification token");
    }

    // Check if OTP was verified (additional check from Redis)
    const verifiedData = await redisClient.get(`fp_verified_${email}`);
    if (!verifiedData || !verifiedData.verified) {
        throw returnError(400, "OTP verification required before changing password");
    }

    // Find user by email
    const user = await User.findOne({ 'email.address': email });
    if (!user) {
        throw returnError(404, "User not found");
    }

    // Check if new password is same as current password
    const checkPassword = await bcrypt.compare(newPassword, user.password);
    if (checkPassword) {
        throw returnError(400, "New password cannot be the same as current password");
    }

    // Hash new password and update
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.password = hashedPassword;
    await user.save();

    // Delete verification data from redis after successful password change
    await redisClient.del(`fp_verified_${email}`);

    return {
        message: "Password changed successfully",
    };
};

module.exports = userCtlr