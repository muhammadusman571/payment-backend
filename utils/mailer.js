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

const sendEmail = async (to, subject, emailContent, addBCC = false) => {
  let mailOptions = {
    from: `"MilkySwipe" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: emailContent,
  };

  if (addBCC) mailOptions = { ...mailOptions, bcc: process.env.SMTP_USER };
  await transporter.sendMail(mailOptions);
};
const sendDepositEmail = async (to, subject, emailContent, addBCC = false) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.WITHDRAWALS_EMAIL,
        pass: process.env.SMTP_PASS,
      },
    });
    let mailOptions = {
      from: `"MilkySwipe" <${process.env.WITHDRAWALS_EMAIL}>`,
      to,
      subject,
      html: emailContent,
    };

    if (addBCC) mailOptions = { ...mailOptions, bcc: process.env.ADMIN_EMAIL };
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.log(err);
  }
};

const sendTicketEmail = async (to, subject, emailContent, addBCC = false) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.ANNOUNCEMENTS_EMAIL,
      pass: process.env.SMTP_PASS,
    },
  });
  let mailOptions = {
    from: `"MilkySwipe" <${process.env.ANNOUNCEMENTS_EMAIL}>`,
    to,
    subject,
    html: emailContent,
  };

  if (addBCC) mailOptions = { ...mailOptions, bcc: process.env.ADMIN_EMAIL };
  await transporter.sendMail(mailOptions);
};

const sendPayoutEmailToAgent = async (to, subject, payment) => {
  try {
    const emailContent = await ejs.renderFile(viewsPath("payout.ejs"), {
      payment,
    });
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.PAYOUTS_EMAIL,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"MilkySwipe" <${process.env.PAYOUTS_EMAIL}>`,
      to,
      subject,
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.log(err);
  }
};

const sendWithdrawlEmailToAgent = async (to, subject, payment) => {
  try {
    const emailContent = await ejs.renderFile(viewsPath("withdrawl.ejs"), {
      payment,
    });

    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.WITHDRAWALS_EMAIL,
        pass: process.env.SMTP_PASS,
      },
    });
    const mailOptions = {
      from: `"MilkySwipe" <${process.env.WITHDRAWALS_EMAIL}>`,
      to,
      subject,
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.log(err);
  }
};
const sendWithdrawlEmailToAdmin = async (to, subject, payment) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.WITHDRAWALS_EMAIL,
        pass: process.env.SMTP_PASS,
      },
    });
    const emailContent = await ejs.renderFile(
      viewsPath("withdrawl-initiated.ejs"),
      {
        payment,
      }
    );

    const mailOptions = {
      from: `"MilkySwipe" <${process.env.WITHDRAWALS_EMAIL}>`,
      to,
      subject,
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.log("err", err);
  }
};

const sendForGetPasswordEmail = async (to, subject, reset_link) => {
  try {
    console.log(reset_link);
    const emailContent = await ejs.renderFile(
      viewsPath("forget-password.ejs"),
      {
        reset_link,
      }
    );

    const mailOptions = {
      from: `"MilkySwipe" <${process.env.FORGET_SMTP_USER}>`,
      to,
      subject,
      html: emailContent,
    };
    console.log("ok");
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.FORGET_SMTP_USER,
        pass: process.env.FORGET_SMTP_PASS,
      },
    });

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.error("❌ Error sending email:", error);
      }
      console.log("✅ Email sent:");
    });
  } catch (err) {
    console.log(err);
  }
};
// const generateEmailContent = (payment) => {
//   return `
//     <html>
//       <head>
//         <style>
//           body {
//             font-family: Arial, sans-serif;
//             margin: 0;
//             padding: 0;
//             background-color: #f4f4f4;
//           }
//           .email-container {
//             width: 100%;
//             max-width: 600px;
//             margin: 0 auto;
//             padding: 20px;
//             background-color: white;
//             border-radius: 8px;
//             box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
//           }
//           .email-header {
//             text-align: center;
//             padding-bottom: 20px;
//             border-bottom: 2px solid #ddd;
//           }
//           .email-header h2 {
//             color: #4CAF50;
//             font-size: 24px;
//             margin: 0;
//           }
//           .email-body {
//             padding: 20px;
//             color: #555;
//           }
//           .email-footer {
//             text-align: center;
//             padding-top: 20px;
//             font-size: 12px;
//             color: #aaa;
//           }
//           .button {
//             background-color: #4CAF50;
//             color: white;
//             padding: 10px 15px;
//             border: none;
//             border-radius: 4px;
//             text-decoration: none;
//             font-weight: bold;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="email-container">
//           <div class="email-header">
//             <h2>Payment Transaction Successful</h2>
//           </div>
//   <p>Dear ${payment.agent_name},</p>

//   <p>
//     We are pleased to inform you that your payment of
//     <strong>$${payment.amount}</strong> for the game
//     <strong>"${payment.game}"</strong> (Username: <strong>${payment.username}</strong>)
//     has been <strong>marked as successful via ${payment.provider}</strong>.
//   </p>

//   <p>If you have any questions or need assistance, please feel free to reach out to us. We're always here to help.</p>

//   <p>Thank you for choosing us.</p>
// </div>

//           <div class="email-footer">
//             <p>&copy; 2025 MilkySwipe.com. All rights reserved.</p>
//           </div>
//         </div>
//       </body>
//     </html>
//   `;
// };

const generateEmailContent = (payment, provider, isSuper = false) => {
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
            <div class="checkmark">✔️</div>
            <h2>Payment Confirmed</h2>
          </div>
          <div class="email-body">
            ${
              isSuper
                ? ""
                : `<p>Dear <strong>${payment.agent_name}</strong>,</p>`
            }

            <p>We are pleased to confirm that your transaction for the following has been <strong>marked as successful</strong> and will be reflected in your account shortly.</p>

            <div class="highlight">
              ${
                isSuper
                  ? `<p>🔹 <strong>Agent Name:</strong> ${payment.agent_name}</p>`
                  : ""
              }
              <p>🔹 <strong>Username:</strong> ${payment.username}</p>
              <p>🔹 <strong>Game:</strong> ${payment.game}</p>
              <p>🔹 <strong>Amount Paid:</strong> $${payment.amount}</p>
              <p>🔹 <strong>Payment Gateway:</strong> ${provider.show_name}</p>
            </div>

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

module.exports = {
  sendEmail,
  sendForGetPasswordEmail,
  generateEmailContent,
  sendPayoutEmailToAgent,
  sendWithdrawlEmailToAgent,
  sendWithdrawlEmailToAdmin,
  sendDepositEmail,
  sendTicketEmail,
};
