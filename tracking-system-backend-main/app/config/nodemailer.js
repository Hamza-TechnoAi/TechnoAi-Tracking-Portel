const nodemailer = require('nodemailer');
require('dotenv').config();

const normalizeAppPassword = (value = '') => value.replace(/[\s-]/g, '');

const emailUser = process.env.EMAIL?.trim();
const emailPass = normalizeAppPassword(process.env.APP_PASSWORD);

if (process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true' && (!emailUser || !emailPass)) {
  console.warn('[nodemailer] EMAIL_NOTIFICATIONS_ENABLED=true but EMAIL or APP_PASSWORD is missing.');
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

module.exports = transporter;