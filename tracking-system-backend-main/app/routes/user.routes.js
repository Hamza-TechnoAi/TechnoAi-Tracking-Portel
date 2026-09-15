const express = require('express');
const router = express.Router();
const {
    registerValidationSchema,
    loginValidationSchema,
    updateUserValidationSchema,
    createStaffValidationSchema,
} = require('../validators/user.validator');
const userCtlr = require('../controllers/user.controller');
const { authenticateUser, authorizeUser } = require('../middlewares/auth');
const setupRoutes = require('./route.util');
const { checkSchema } = require('express-validator');
const upload = require('../services/cloudinaryService/cloudinary.multer');
const { STAFF_ROLES, ADMIN_ROLES } = require('../constants');

const routes = [
    {
        method: 'post',
        path: '/register',
        middlewares: [
            upload.single('profilePic'),
            checkSchema(registerValidationSchema),
        ],
        handler: userCtlr.register,
    },
    {
        method: 'post',
        path: '/staff',
        middlewares: [
            authenticateUser,
            authorizeUser(ADMIN_ROLES),
            checkSchema(createStaffValidationSchema),
        ],
        handler: userCtlr.createStaff,
    },
    {
        method: 'post',
        path: '/login',
        middlewares: [checkSchema(loginValidationSchema)],
        handler: userCtlr.login,
    },
    {
        method: 'get',
        path: '/account',
        middlewares: [authenticateUser, authorizeUser(STAFF_ROLES)],
        handler: userCtlr.account,
    },
    {
        method: 'get',
        path: '/list',
        middlewares: [authenticateUser, authorizeUser(ADMIN_ROLES)],
        handler: userCtlr.list,
    },
    {
        method: 'put',
        path: '/update',
        middlewares: [
            upload.single('profilePic'),
            authenticateUser,
            authorizeUser(STAFF_ROLES),
            checkSchema(updateUserValidationSchema),
        ],
        handler: userCtlr.updateUser,
    },
    {
        method: 'delete',
        path: '/delete/:userId',
        middlewares: [authenticateUser, authorizeUser(ADMIN_ROLES)],
        handler: userCtlr.delete,
    },
    {
        method: 'put',
        path: '/toggleBlock/:userId',
        middlewares: [authenticateUser, authorizeUser(ADMIN_ROLES)],
        handler: userCtlr.toggleBlockUser,
    },
    {
        method: 'put',
        path: '/toggleApprove/:userId',
        middlewares: [authenticateUser, authorizeUser(ADMIN_ROLES)],
        handler: userCtlr.toggleApproveUser,
    },
    {
        method: 'post',
        path: '/send-phone-otp',
        middlewares: [],
        handler: userCtlr.sendPhoneOtp,
    },
    {
        method: 'post',
        path: '/verify-phone-otp',
        middlewares: [],
        handler: userCtlr.verifyPhoneOtp,
    },
    {
        method: 'post',
        path: '/send-mail-otp',
        middlewares: [],
        handler: userCtlr.sendMailOtp,
    },
    {
        method: 'post',
        path: '/verify-mail-otp',
        middlewares: [],
        handler: userCtlr.verifyMailOtp,
    },
    {
        method: 'post',
        path: '/change-password',
        middlewares: [authenticateUser, authorizeUser(STAFF_ROLES)],
        handler: userCtlr.changePassword,
    },
    {
        method: 'put',
        path: '/change-password-byAdmin/:userId',
        middlewares: [authenticateUser, authorizeUser(ADMIN_ROLES)],
        handler: userCtlr.changePasswordByAdmin,
    },
    {
        method: 'post',
        path: '/forgot-password/send-mail-otp',
        middlewares: [],
        handler: userCtlr.fpSendMailOtp,
    },
    {
        method: 'post',
        path: '/forgot-password/verify-mail-otp',
        middlewares: [],
        handler: userCtlr.fpVerifyMailOtp,
    },
    {
        method: 'post',
        path: '/forgot-password/change-password',
        middlewares: [],
        handler: userCtlr.fpChangePassword,
    },
];

setupRoutes(router, routes);

module.exports = router;
