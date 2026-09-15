const { WEBSITE_URL } = process.env;

const otpMailTemplate = (otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>We Can Universe - OTP Verification</title>
    <style>
        /* Reset */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, Helvetica, sans-serif;
        }

        body {
            background-color: #f4f7fc;
            color: #333333;
            padding: 0;
            margin: 0;
        }

        .email-wrapper {
            max-width: 600px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border: 1px solid #e0e6ed;
        }

        /* Header */
        .email-header {
            background-color: #00a8e8;
            padding: 20px;
            text-align: center;
        }

        .email-header img {
            height: 100%;
            width: 150px;
            display: block;
            margin: 0 auto;
        }

        /* Body */
        .email-body {
            padding: 30px 25px;
            text-align: center;
        }

        .email-body h1 {
            font-size: 22px;
            margin-bottom: 12px;
            color: #222222;
        }

        .email-body p {
            font-size: 15px;
            color: #555555;
            margin-bottom: 20px;
        }

        /* OTP Box */
        .otp-box {
            display: inline-block;
            background-color: #f0f8ff;
            color: #00a8e8;
            font-size: 28px;
            font-weight: bold;
            padding: 12px 28px;
            border-radius: 8px;
            letter-spacing: 4px;
            margin: 15px 0;
            border: 1px solid #00a8e8;
        }

        /* Security Note */
        .security-note {
            margin-top: 25px;
            font-size: 13px;
            color: #777777;
        }

        /* Footer */
        .email-footer {
            margin-top: 30px;
            padding: 18px;
            text-align: center;
            background-color: #f7f9fc;
            border-top: 1px solid #e6e6e6;
        }

        .email-footer p {
            font-size: 12px;
            color: #777777;
            margin-bottom: 6px;
        }

        .email-footer a {
            color: #00a8e8;
            text-decoration: none;
            font-weight: 500;
        }

        @media screen and (max-width: 600px) {
            .email-wrapper {
                margin: 15px;
            }

            .email-header img {
                width: 120px;
            }

            .email-body h1 {
                font-size: 18px;
            }

            .otp-box {
                font-size: 22px;
                padding: 10px 24px;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <!-- Header -->
        <div class="email-header">
            <img src="https://res.cloudinary.com/dblnpclgb/image/upload/v1760624943/wecan-logo-white-512X512_cl3rca.png" alt="WeScan Logo" />
        </div>

        <!-- Body -->
        <div class="email-body">
            <h1>Welcome to We Can Universe 🎉</h1>
            <p>Thank you for registering with <strong>We Can Universe</strong>. Use the OTP below to verify your email address and complete your signup.</p>

            <!-- OTP -->
            <div class="otp-box">${otp}</div>

            <p class="security-note">
                ⚠️ Do not share this OTP with anyone for your security.
            </p>
        </div>

        <!-- Footer -->
        <div class="email-footer">
            <p>© ${new Date().getFullYear()} We Can Universe. All rights reserved.</p>
            <p>
                <a href="${WEBSITE_URL}privacy">Privacy Policy</a> |
                <a href="${WEBSITE_URL}terms">Terms & Conditions</a>
            </p>
        </div>
    </div>
</body>
</html>
`;

// Job Application Email Templates
const jobApplicationTemplate = (candidateName, jobTitle, companyName) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Job Application Confirmation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, Helvetica, sans-serif;
        }

        body {
            background-color: #f4f7fc;
            color: #333333;
            padding: 0;
            margin: 0;
        }

        .email-wrapper {
            max-width: 600px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border: 1px solid #e0e6ed;
        }

        .email-header {
            background-color: #00a8e8;
            padding: 20px;
            text-align: center;
        }

        .email-header img {
            height: 100%;
            width: 150px;
            display: block;
            margin: 0 auto;
        }

        .email-body {
            padding: 30px 25px;
            text-align: center;
        }

        .email-body h1 {
            font-size: 24px;
            margin-bottom: 12px;
            color: #222222;
        }

        .email-body p {
            font-size: 15px;
            color: #555555;
            margin-bottom: 20px;
            line-height: 1.6;
        }

        .job-details {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: left;
        }

        .job-details h3 {
            color: #00a8e8;
            margin-bottom: 10px;
        }

        .email-footer {
            margin-top: 30px;
            padding: 18px;
            text-align: center;
            background-color: #f7f9fc;
            border-top: 1px solid #e6e6e6;
        }

        .email-footer p {
            font-size: 12px;
            color: #777777;
            margin-bottom: 6px;
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-header">
            <img src="https://res.cloudinary.com/dblnpclgb/image/upload/v1760624943/wecan-logo-white-512X512_cl3rca.png" alt="WeCan Logo" />
        </div>

        <div class="email-body">
            <h1>Application Received! 🎉</h1>
            <p>Dear <strong>${candidateName}</strong>,</p>
            <p>Thank you for your interest in joining our team! We have successfully received your application for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
            
            <div class="job-details">
                <h3>Application Details</h3>
                <p><strong>Position:</strong> ${jobTitle}</p>
                <p><strong>Company:</strong> ${companyName}</p>
                <p><strong>Application Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            <p>Our team will review your application and get back to you within 5-7 business days. We appreciate your patience during this process.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
        </div>

        <div class="email-footer">
            <p>© ${new Date().getFullYear()} WeCan. All rights reserved.</p>
            <p>Thank you for choosing WeCan!</p>
        </div>
    </div>
</body>
</html>
`;

const jobRejectionTemplate = (candidateName, jobTitle, companyName) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Application Update</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, Helvetica, sans-serif;
        }

        body {
            background-color: #f4f7fc;
            color: #333333;
            padding: 0;
            margin: 0;
        }

        .email-wrapper {
            max-width: 600px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border: 1px solid #e0e6ed;
        }

        .email-header {
            background-color: #00a8e8;
            padding: 20px;
            text-align: center;
        }

        .email-header img {
            height: 100%;
            width: 150px;
            display: block;
            margin: 0 auto;
        }

        .email-body {
            padding: 30px 25px;
            text-align: center;
        }

        .email-body h1 {
            font-size: 24px;
            margin-bottom: 12px;
            color: #222222;
        }

        .email-body p {
            font-size: 15px;
            color: #555555;
            margin-bottom: 20px;
            line-height: 1.6;
        }

        .job-details {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: left;
        }

        .job-details h3 {
            color: #00a8e8;
            margin-bottom: 10px;
        }

        .email-footer {
            margin-top: 30px;
            padding: 18px;
            text-align: center;
            background-color: #f7f9fc;
            border-top: 1px solid #e6e6e6;
        }

        .email-footer p {
            font-size: 12px;
            color: #777777;
            margin-bottom: 6px;
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-header">
            <img src="https://res.cloudinary.com/dblnpclgb/image/upload/v1760624943/wecan-logo-white-512X512_cl3rca.png" alt="WeCan Logo" />
        </div>

        <div class="email-body">
            <h1>Application Update</h1>
            <p>Dear <strong>${candidateName}</strong>,</p>
            <p>Thank you for your interest in the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
            
            <div class="job-details">
                <h3>Application Status</h3>
                <p><strong>Position:</strong> ${jobTitle}</p>
                <p><strong>Company:</strong> ${companyName}</p>
                <p><strong>Status:</strong> Not Selected</p>
            </div>

            <p>After careful consideration, we have decided to move forward with other candidates for this position. This decision was not easy, as we received many qualified applications.</p>
            <p>We encourage you to continue applying for other opportunities that match your skills and interests. We will keep your information on file for future positions that may be a better fit.</p>
            <p>Thank you for your time and interest in our company.</p>
        </div>

        <div class="email-footer">
            <p>© ${new Date().getFullYear()} WeCan. All rights reserved.</p>
            <p>Best regards,<br>The WeCan Team</p>
        </div>
    </div>
</body>
</html>
`;

const jobShortlistedTemplate = (candidateName, jobTitle, companyName, interviewDate = null) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Congratulations - You've Been Shortlisted!</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, Helvetica, sans-serif;
        }

        body {
            background-color: #f4f7fc;
            color: #333333;
            padding: 0;
            margin: 0;
        }

        .email-wrapper {
            max-width: 600px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border: 1px solid #e0e6ed;
        }

        .email-header {
            background-color: #00a8e8;
            padding: 20px;
            text-align: center;
        }

        .email-header img {
            height: 100%;
            width: 150px;
            display: block;
            margin: 0 auto;
        }

        .email-body {
            padding: 30px 25px;
            text-align: center;
        }

        .email-body h1 {
            font-size: 24px;
            margin-bottom: 12px;
            color: #222222;
        }

        .email-body p {
            font-size: 15px;
            color: #555555;
            margin-bottom: 20px;
            line-height: 1.6;
        }

        .job-details {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: left;
        }

        .job-details h3 {
            color: #00a8e8;
            margin-bottom: 10px;
        }

        .interview-info {
            background-color: #e6f7fd;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #00a8e8;
        }

        .email-footer {
            margin-top: 30px;
            padding: 18px;
            text-align: center;
            background-color: #f7f9fc;
            border-top: 1px solid #e6e6e6;
        }

        .email-footer p {
            font-size: 12px;
            color: #777777;
            margin-bottom: 6px;
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-header">
            <img src="https://res.cloudinary.com/dblnpclgb/image/upload/v1760624943/wecan-logo-white-512X512_cl3rca.png" alt="WeCan Logo" />
        </div>

        <div class="email-body">
            <h1>Congratulations! 🎉</h1>
            <p>Dear <strong>${candidateName}</strong>,</p>
            <p>Great news! We are pleased to inform you that you have been <strong>shortlisted</strong> for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
            
            <div class="job-details">
                <h3>Next Steps</h3>
                <p><strong>Position:</strong> ${jobTitle}</p>
                <p><strong>Company:</strong> ${companyName}</p>
                <p><strong>Status:</strong> Shortlisted</p>
            </div>

            ${interviewDate ? `
            <div class="interview-info">
                <h3>📅 Interview Scheduled</h3>
                <p><strong>Date & Time:</strong> ${new Date(interviewDate).toLocaleString()}</p>
                <p>Please be prepared for the interview and bring any required documents.</p>
            </div>
            ` : `
            <p>Our team will be in touch with you soon to schedule the next steps in our interview process. Please keep an eye on your email for further communication.</p>
            `}

            <p>We were impressed by your qualifications and believe you would be a great fit for our team. We look forward to learning more about you in the next stage of our process.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
        </div>

        <div class="email-footer">
            <p>© ${new Date().getFullYear()} WeCan. All rights reserved.</p>
            <p>Best regards,<br>The WeCan Team</p>
        </div>
    </div>
</body>
</html>
`;

const forgotPasswordOtpTemplate = (otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>We Can Universe - Password Reset OTP</title>
    <style>
        /* Reset */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, Helvetica, sans-serif;
        }

        body {
            background-color: #f4f7fc;
            color: #333333;
            padding: 0;
            margin: 0;
        }

        .email-wrapper {
            max-width: 600px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border: 1px solid #e0e6ed;
        }

        /* Header */
        .email-header {
            background-color: #00a8e8;
            padding: 20px;
            text-align: center;
        }

        .email-header img {
            height: 100%;
            width: 150px;
            display: block;
            margin: 0 auto;
        }

        /* Body */
        .email-body {
            padding: 30px 25px;
            text-align: center;
        }

        .email-body h1 {
            font-size: 22px;
            margin-bottom: 12px;
            color: #222222;
        }

        .email-body p {
            font-size: 15px;
            color: #555555;
            margin-bottom: 20px;
        }

        /* OTP Box */
        .otp-box {
            display: inline-block;
            background-color: #f0f8ff;
            color: #00a8e8;
            font-size: 28px;
            font-weight: bold;
            padding: 12px 28px;
            border-radius: 8px;
            letter-spacing: 4px;
            margin: 15px 0;
            border: 1px solid #00a8e8;
        }

        /* Security Note */
        .security-note {
            margin-top: 25px;
            font-size: 13px;
            color: #777777;
        }

        /* Footer */
        .email-footer {
            margin-top: 30px;
            padding: 18px;
            text-align: center;
            background-color: #f7f9fc;
            border-top: 1px solid #e6e6e6;
        }

        .email-footer p {
            font-size: 12px;
            color: #777777;
            margin-bottom: 6px;
        }

        .email-footer a {
            color: #00a8e8;
            text-decoration: none;
            font-weight: 500;
        }

        @media screen and (max-width: 600px) {
            .email-wrapper {
                margin: 15px;
            }

            .email-header img {
                width: 120px;
            }

            .email-body h1 {
                font-size: 18px;
            }

            .otp-box {
                font-size: 22px;
                padding: 10px 24px;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <!-- Header -->
        <div class="email-header">
            <img src="https://res.cloudinary.com/dblnpclgb/image/upload/v1760624943/wecan-logo-white-512X512_cl3rca.png" alt="WeCan Logo" />
        </div>

        <!-- Body -->
        <div class="email-body">
            <h1>Password Reset Request 🔒</h1>
            <p>We received a request to reset your password for your <strong>We Can Universe</strong> account. Use the OTP below to verify your identity and reset your password.</p>

            <!-- OTP -->
            <div class="otp-box">${otp}</div>

            <p class="security-note">
                ⚠️ This OTP will expire in 10 minutes. If you didn't request this password reset, please ignore this email and your password will remain unchanged.
            </p>
        </div>

        <!-- Footer -->
        <div class="email-footer">
            <p>© ${new Date().getFullYear()} We Can Universe. All rights reserved.</p>
            <p>
                <a href="${WEBSITE_URL}privacy">Privacy Policy</a> |
                <a href="${WEBSITE_URL}terms">Terms & Conditions</a>
            </p>
        </div>
    </div>
</body>
</html>
`;

const enquiryNotificationTemplate = (enquiryData) => {
    const { firstName, lastName, email, phone, service, message, source, createdAt } = enquiryData;
    const formattedDate = new Date(createdAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    const sourceLabel = source === 'contact-form' ? 'Contact Form' : 'Service Hero Form';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New Enquiry Received</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, Helvetica, sans-serif;
        }

        body {
            background-color: #f4f7fc;
            color: #333333;
            padding: 0;
            margin: 0;
        }

        .email-wrapper {
            max-width: 600px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border: 1px solid #e0e6ed;
        }

        .email-header {
            background-color: #00a8e8;
            padding: 12px 20px;
            text-align: center;
        }

        .email-header img {
            height: auto;
            width: 120px;
            display: block;
            margin: 0 auto;
        }

        .email-body {
            padding: 30px 25px;
        }

        .email-body h1 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #222222;
            text-align: center;
        }

        .email-body p {
            font-size: 15px;
            color: #555555;
            margin-bottom: 15px;
            line-height: 1.6;
        }

        .enquiry-details {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #00a8e8;
        }

        .enquiry-details h3 {
            color: #00a8e8;
            margin-bottom: 15px;
            font-size: 18px;
        }

        .detail-row {
            display: flex;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
        }

        .detail-row:last-child {
            border-bottom: none;
        }

        .detail-label {
            font-weight: 600;
            color: #374151;
            min-width: 120px;
            font-size: 14px;
        }

        .detail-value {
            color: #555555;
            flex: 1;
            font-size: 14px;
        }

        .source-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            background-color: #e3f2fd;
            color: #1976d2;
        }

        .email-footer {
            margin-top: 30px;
            padding: 18px;
            text-align: center;
            background-color: #f7f9fc;
            border-top: 1px solid #e6e6e6;
        }

        .email-footer p {
            font-size: 12px;
            color: #777777;
            margin-bottom: 6px;
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-header">
            <img src="https://res.cloudinary.com/dblnpclgb/image/upload/v1760624943/wecan-logo-white-512X512_cl3rca.png" alt="WeCan Logo" />
        </div>

        <div class="email-body">
            <h1>New Enquiry Received</h1>
            <p>A new enquiry has been submitted through your website. Please review the details below and respond accordingly.</p>
            
            <div class="enquiry-details">
                <h3>Enquiry Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${firstName} ${lastName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value"><a href="mailto:${email}" style="color: #00a8e8; text-decoration: none;">${email}</a></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value"><a href="tel:${phone}" style="color: #00a8e8; text-decoration: none;">${phone}</a></span>
                </div>
                ${service ? `
                <div class="detail-row">
                    <span class="detail-label">Service:</span>
                    <span class="detail-value">${service}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                    <span class="detail-label">Source:</span>
                    <span class="detail-value"><span class="source-badge">${sourceLabel}</span></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date & Time:</span>
                    <span class="detail-value">${formattedDate}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Message:</span>
                    <span class="detail-value">${message}</span>
                </div>
            </div>

            <p style="margin-top: 20px; font-size: 14px; color: #666;">
                <strong>Action Required:</strong> Please review this enquiry and respond to the customer at your earliest convenience.
            </p>
        </div>

        <div class="email-footer">
            <p>© ${new Date().getFullYear()} WeCan Universe. All rights reserved.</p>
            <p>This is an automated notification from your website enquiry system.</p>
        </div>
    </div>
</body>
</html>
`;
};

const influencerApplicationTemplate = (influencerName) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Influencer Application Confirmation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, Helvetica, sans-serif;
        }

        body {
            background-color: #f4f7fc;
            color: #333333;
            padding: 0;
            margin: 0;
        }

        .email-wrapper {
            max-width: 600px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border: 1px solid #e0e6ed;
        }

        .email-header {
            background-color: #00a8e8;
            padding: 20px;
            text-align: center;
        }

        .email-header img {
            height: 100%;
            width: 150px;
            display: block;
            margin: 0 auto;
        }

        .email-body {
            padding: 30px 25px;
            text-align: center;
        }

        .email-body h1 {
            font-size: 24px;
            margin-bottom: 12px;
            color: #222222;
        }

        .email-body p {
            font-size: 15px;
            color: #555555;
            margin-bottom: 20px;
            line-height: 1.6;
        }

        .email-footer {
            margin-top: 30px;
            padding: 18px;
            text-align: center;
            background-color: #f7f9fc;
            border-top: 1px solid #e6e6e6;
        }

        .email-footer p {
            font-size: 12px;
            color: #777777;
            margin-bottom: 6px;
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-header">
            <img src="https://res.cloudinary.com/dblnpclgb/image/upload/v1760624943/wecan-logo-white-512X512_cl3rca.png" alt="WeCan Logo" />
        </div>

        <div class="email-body">
            <h1>Application Received! 🎉</h1>
            <p>Dear <strong>${influencerName}</strong>,</p>
            <p>Thank you for your interest in joining our influencer network! We have successfully received your influencer application.</p>
            <p>Your application has been submitted and is currently under review by our management team. We will review your details and get back to you soon.</p>
            <p><strong>You will receive a confirmation email once your application is approved by the management.</strong></p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
        </div>

        <div class="email-footer">
            <p>© ${new Date().getFullYear()} WeCan. All rights reserved.</p>
            <p>Thank you for choosing WeCan!</p>
        </div>
    </div>
</body>
</html>
`;

const influencerApprovalTemplate = (influencerName, pageUrl) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Influencer Application Approved</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, Helvetica, sans-serif;
        }

        body {
            background-color: #f4f7fc;
            color: #333333;
            padding: 0;
            margin: 0;
        }

        .email-wrapper {
            max-width: 600px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border: 1px solid #e0e6ed;
        }

        .email-header {
            background-color: #22c55e;
            padding: 20px;
            text-align: center;
        }

        .email-header img {
            height: 100%;
            width: 150px;
            display: block;
            margin: 0 auto;
        }

        .email-body {
            padding: 30px 25px;
            text-align: center;
        }

        .email-body h1 {
            font-size: 24px;
            margin-bottom: 12px;
            color: #222222;
        }

        .email-body p {
            font-size: 15px;
            color: #555555;
            margin-bottom: 20px;
            line-height: 1.6;
        }

        .cta-button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #00a8e8;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
        }

        .email-footer {
            margin-top: 30px;
            padding: 18px;
            text-align: center;
            background-color: #f7f9fc;
            border-top: 1px solid #e6e6e6;
        }

        .email-footer p {
            font-size: 12px;
            color: #777777;
            margin-bottom: 6px;
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-header">
            <img src="https://res.cloudinary.com/dblnpclgb/image/upload/v1760624943/wecan-logo-white-512X512_cl3rca.png" alt="WeCan Logo" />
        </div>

        <div class="email-body">
            <h1>Congratulations! 🎉</h1>
            <p>Dear <strong>${influencerName}</strong>,</p>
            <p>Great news! Your influencer profile has been <strong>approved</strong> by our management team.</p>
            <p>You can now check your profile on our influencer marketing page.</p>
            <a href="${pageUrl}" class="cta-button">View Your Profile</a>
            <p>Thank you for being part of the WeCan Universe influencer network!</p>
        </div>

        <div class="email-footer">
            <p>© ${new Date().getFullYear()} WeCan. All rights reserved.</p>
            <p>Thank you for choosing WeCan!</p>
        </div>
    </div>
</body>
</html>
`;

const influencerRejectionTemplate = (influencerName, pageUrl, rejectionReason) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Influencer Application Update</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, Helvetica, sans-serif;
        }

        body {
            background-color: #f4f7fc;
            color: #333333;
            padding: 0;
            margin: 0;
        }

        .email-wrapper {
            max-width: 600px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border: 1px solid #e0e6e6;
        }

        .email-header {
            background-color: #ef4444;
            padding: 20px;
            text-align: center;
        }

        .email-header img {
            height: 100%;
            width: 150px;
            display: block;
            margin: 0 auto;
        }

        .email-body {
            padding: 30px 25px;
            text-align: center;
        }

        .email-body h1 {
            font-size: 24px;
            margin-bottom: 12px;
            color: #222222;
        }

        .email-body p {
            font-size: 15px;
            color: #555555;
            margin-bottom: 20px;
            line-height: 1.6;
        }

        .rejection-reason {
            background-color: #fef2f2;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #ef4444;
            text-align: left;
        }

        .rejection-reason strong {
            color: #ef4444;
        }

        .cta-button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #00a8e8;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
        }

        .email-footer {
            margin-top: 30px;
            padding: 18px;
            text-align: center;
            background-color: #f7f9fc;
            border-top: 1px solid #e6e6e6;
        }

        .email-footer p {
            font-size: 12px;
            color: #777777;
            margin-bottom: 6px;
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-header">
            <img src="https://res.cloudinary.com/dblnpclgb/image/upload/v1760624943/wecan-logo-white-512X512_cl3rca.png" alt="WeCan Logo" />
        </div>

        <div class="email-body">
            <h1>Application Update</h1>
            <p>Dear <strong>${influencerName}</strong>,</p>
            <p>Thank you for your interest in joining our influencer network. After careful review, we regret to inform you that your influencer profile has been <strong>rejected</strong>.</p>
            ${rejectionReason ? `
            <div class="rejection-reason">
                <strong>Reason:</strong> ${rejectionReason}
            </div>
            ` : ''}
            <p>You can check the influencer marketing page for more information.</p>
            <a href="${pageUrl}" class="cta-button">Visit Influencer Page</a>
            <p>We encourage you to reapply in the future if your circumstances change.</p>
        </div>

        <div class="email-footer">
            <p>© ${new Date().getFullYear()} WeCan. All rights reserved.</p>
            <p>Thank you for choosing WeCan!</p>
        </div>
    </div>
</body>
</html>
`;

module.exports = {
    otpMailTemplate,
    forgotPasswordOtpTemplate,
    jobApplicationTemplate,
    jobRejectionTemplate,
    jobShortlistedTemplate,
    enquiryNotificationTemplate,
    influencerApplicationTemplate,
    influencerApprovalTemplate,
    influencerRejectionTemplate,
};