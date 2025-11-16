const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
const viewsPath = (fileName) => {
  return path.resolve(__dirname, "../", "views", "emails", fileName);
};

//Hostinger
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
const sendEmail = async (to, subject, emailContent) => {
  const mailOptions = {
    from: `"MilkySwipe" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: emailContent,
  };

  await transporter.sendMail(mailOptions);
};
const generateEmailContent = (qcontent) => {
  return `
    <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f2f4f7;
          }
          .email-container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
            color: #333;
          }
          .email-header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 1px solid #eaeaea;
          }
          .checkmark {
            font-size: 20px;
            color:rgb(31, 92, 33);
            margin-bottom: 10px;
          }
          .email-header h2 {
            margin: 0;
            color: #2e7d32;
            font-size: 26px;
          }
          .email-body {
            padding: 25px 0;
            line-height: 1.7;
            font-size: 15px;
            color: #555;
          }
          .highlight {
            background-color: #f0f7f4;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 5px solid #4CAF50;
          }
          .highlight p {
            margin: 8px 0;
            font-size: 15px;
          }
          .email-footer {
            text-align: center;
            font-size: 12px;
            color: #999;
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #e0e0e0;
          }
          .support {
            color: #4CAF50;
            font-weight: bold;
          }
          .website-link {
            text-decoration: none;
            color: #4CAF50;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
           <div> MilkySwipe </div>
             <h2>Ticket System</h2>
          </div>
          <div class="email-body">        
            <p>Dear <strong>${qcontent.name}</strong>,</p>
            <p>Thank you for contacting.</p>
            <p>We have received your request and created a support ticket. A member of our team will get back to you as soon as possible.</p>
            <p>Here are the details of your ticket:</p>

            <div class="highlight">
              <p>🔹 <strong>Ticket ID:</strong> ${qcontent.ticket_id}</p>
              <p>🔹 <strong>Subject:</strong> ${qcontent.query_subject}</p>
              <p>🔹 <strong>Date Submitted:</strong> ${qcontent.created_at}</p>
              <p>🔹 <strong>Description:</strong> ${qcontent.details}</p>
              
            </div>
            <p>Track the status of your ticket using the Ticket Management System in portal </p>
            <p>If you have any questions or need assistance, please feel free to contact us at <span class="support">contact@milkyswipe.com</span>.</p>

            <p>Thank you for choosing <strong>MilkySwipe</strong>.</p>

            <p>Warm regards,<br/>The MilkySwipe Team<br/>
            🌐 <a class="website-link" href="https://www.milkyswipe.com">www.milkyswipe.com</a></p>
          </div>
          <div class="email-footer">
            &copy; 2025 MilkySwipe.com. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;
};
const generateEmailContentAdmin = (qcontent) => {
  return `
    <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f2f4f7;
          }
          .email-container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
            color: #333;
          }
          .email-header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 1px solid #eaeaea;
          }
          .checkmark {
            font-size: 20px;
            color:rgb(31, 92, 33);
            margin-bottom: 10px;
          }
          .email-header h2 {
            margin: 0;
            color: #2e7d32;
            font-size: 26px;
          }
          .email-body {
            padding: 25px 0;
            line-height: 1.7;
            font-size: 15px;
            color: #555;
          }
          .highlight {
            background-color: #f0f7f4;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 5px solid #4CAF50;
          }
          .highlight p {
            margin: 8px 0;
            font-size: 15px;
          }
          .email-footer {
            text-align: center;
            font-size: 12px;
            color: #999;
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #e0e0e0;
          }
          .support {
            color: #4CAF50;
            font-weight: bold;
          }
          .website-link {
            text-decoration: none;
            color: #4CAF50;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <div> MilkySwipe </div>
             <h2>Ticket System</h2>
          </div>
          <div class="email-body">        
            <p>Dear <strong>Admin</strong>,</p>
            <p>We have received your request and created a support ticket.</p>
            <p>Here are the details of your ticket:</p>

            <div class="highlight">
              <p>🔹 <strong>Agent:</strong> ${qcontent.name},</p>
              <p>🔹 <strong>Ticket ID:</strong> ${qcontent.ticket_id}</p>
              <p>🔹 <strong>Agent ID:</strong> ${qcontent.agent_id}</p>
              <p>🔹 <strong>Subject:</strong> ${qcontent.department}</p>
              <p>🔹 <strong>Date Submitted:</strong> ${qcontent.query_subject}</p>
              <p>🔹 <strong>Description:</strong> ${qcontent.details}</p>
            </div>
          </div>
          <div class="email-footer">
            &copy; 2025 MilkySwipe.com. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;
};
const generateEmailMessageContent = (qcontent) => {
  return `
    <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f2f4f7;
          }
          .email-container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
            color: #333;
          }
          .email-header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 1px solid #eaeaea;
          }
          .checkmark {
            font-size: 20px;
            color:rgb(31, 92, 33);
            margin-bottom: 10px;
          }
          .email-header h2 {
            margin: 0;
            color: #2e7d32;
            font-size: 26px;
          }
          .email-body {
            padding: 25px 0;
            line-height: 1.7;
            font-size: 15px;
            color: #555;
          }
          .highlight {
            background-color: #f0f7f4;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 5px solid #4CAF50;
          }
          .highlight p {
            margin: 8px 0;
            font-size: 15px;
          }
          .email-footer {
            text-align: center;
            font-size: 12px;
            color: #999;
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #e0e0e0;
          }
          .support {
            color: #4CAF50;
            font-weight: bold;
          }
          .website-link {
            text-decoration: none;
            color: #4CAF50;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <div> MilkySwipe </div>
             <h2>Ticket System</h2>
          </div>
          <div class="email-body">        
            <p>Dear <strong>${qcontent.name}</strong>,</p>
            <p>Thank you for contacting.</p>
            <p>We have received your request and created a support ticket. A member of our team will get back to you as soon as possible.</p>
            <p>Here are the details of your ticket:</p>

            <div class="highlight">
              <p>🔹 <strong>Ticket ID:</strong> ${qcontent.ticket_id}</p>
              <p>🔹 <strong>Sender Role:</strong> ${qcontent.sender_role}</p>
              <p>🔹 <strong>Date Submitted:</strong> ${qcontent.created_at}</p>
              <p>🔹 <strong>Message:</strong> ${qcontent.message}</p>
              
            </div>
            <p>Track the status of your ticket using the Ticket Management System in portal </p>
            <p>If you have any questions or need assistance, please feel free to contact us at <span class="support">contact@milkyswipe.com</span>.</p>

            <p>Thank you for choosing <strong>MilkySwipe</strong>.</p>

            <p>Warm regards,<br/>The MilkySwipe Team<br/>
            🌐 <a class="website-link" href="https://www.milkyswipe.com">www.milkyswipe.com</a></p>
          </div>
          <div class="email-footer">
            &copy; 2025 MilkySwipe.com. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;
};
const generateEmailMessageContentAdmin = (qcontent) => {
  return `
    <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f2f4f7;
          }
          .email-container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
            color: #333;
          }
          .email-header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 1px solid #eaeaea;
          }
          .checkmark {
            font-size: 20px;
            color:rgb(31, 92, 33);
            margin-bottom: 10px;
          }
          .email-header h2 {
            margin: 0;
            color: #2e7d32;
            font-size: 26px;
          }
          .email-body {
            padding: 25px 0;
            line-height: 1.7;
            font-size: 15px;
            color: #555;
          }
          .highlight {
            background-color: #f0f7f4;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 5px solid #4CAF50;
          }
          .highlight p {
            margin: 8px 0;
            font-size: 15px;
          }
          .email-footer {
            text-align: center;
            font-size: 12px;
            color: #999;
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #e0e0e0;
          }
          .support {
            color: #4CAF50;
            font-weight: bold;
          }
          .website-link {
            text-decoration: none;
            color: #4CAF50;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
           <div> MilkySwipe </div>
             <h2>Ticket System</h2>
          </div>
          <div class="email-body">        
            <p>Dear <strong>Admin</strong>,</p>
            <p>We have received your request and created a support ticket.</p>
            <p>Here are the details of your ticket:</p>
            <div class="highlight">
              <p>🔹 <strong>Ticket ID:</strong> ${qcontent.ticket_id}</p>
              <p>🔹 <strong>Sender Role:</strong> ${qcontent.sender_role}</p>
              <p>🔹 <strong>Date Submitted:</strong> ${qcontent.created_at}</p>
              <p>🔹 <strong>Message:</strong> ${qcontent.message}</p>
            </div>
          </div>
          <div class="email-footer">
            &copy; 2025 MilkySwipe.com. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;
};
const generateEmailTicketClose = (qcontent) => {
  return `
    <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f2f4f7;
          }
          .email-container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
            color: #333;
          }
          .email-header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 1px solid #eaeaea;
          }
          .checkmark {
            font-size: 20px;
            color:rgb(31, 92, 33);
            margin-bottom: 10px;
          }
          .email-header h2 {
            margin: 0;
            color: #2e7d32;
            font-size: 26px;
          }
          .email-body {
            padding: 25px 0;
            line-height: 1.7;
            font-size: 15px;
            color: #555;
          }
          .highlight {
            background-color: #f0f7f4;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 5px solid #4CAF50;
          }
          .highlight p {
            margin: 8px 0;
            font-size: 15px;
          }
          .email-footer {
            text-align: center;
            font-size: 12px;
            color: #999;
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #e0e0e0;
          }
          .support {
            color: #4CAF50;
            font-weight: bold;
          }
          .website-link {
            text-decoration: none;
            color: #4CAF50;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
           <div> MilkySwipe </div>
             <h2>Ticket System</h2>
          </div>
          <div class="email-body">        
            <p>Dear<strong> ${qcontent.name}</strong>,</p>
           <p>Your ticket has been closed. Please recreate it or reply to the same ticket for further assistance.</p>
            <p>Here are the details of your ticket:</p>
            <div class="highlight">
              <p>🔹 <strong>Ticket ID:</strong> ${qcontent.ticket_id}</p>
             
            </div>
          </div>
          <div class="email-footer">
            &copy; 2025 MilkySwipe.com. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;
};
module.exports = {
  sendEmail,
  generateEmailContent,
  generateEmailContentAdmin,
  generateEmailMessageContent,
  generateEmailMessageContentAdmin,
  generateEmailTicketClose
};
