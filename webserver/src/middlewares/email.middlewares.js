const nodemailer = require("nodemailer");


const mailTransporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "coursemapper.soco@gmail.com",
      pass: "gzxi ednk zaft zyow",
    },
  });


  const roleMapping = {
    'co_teacher': 'Co-Teacher',
    'non_editing_teacher': 'Teaching Assistant',
    'user': 'Student'
  };
// Middleware function to send role assignment email
const emailRoleAssignmentMiddleware = async (req, res, next) => {
  try {
    const { user, response, role } = req.locals; // Retrieve user and response from previous middlewares
    const roleName = roleMapping[role.toLowerCase()] || role;
    const mailDetails = {
      from: "coursemapper.soco@gmail.com",
      to: user.email,
      subject: "Course Role Assignment Notification",
      html: `<html>
        <head>
            <title>CourseMapper Role Assignment</title> 
        </head>
        <body>
          <p>Dear ${user.username},</p>
          <p>You have been assigned the role of <b>${roleName}</b> in the course: <b>${response.course.name}</b>.</p>
          <p>To view your course and role details, please log in to your account.</p>
          <p>Regards,</p>
          <p>The CourseMapper Team</p>
        </body>
      </html>`,
    };

    await mailTransporter.sendMail(mailDetails);
    console.log("Role assignment email sent successfully to", user.email);
    
    res.send(req.locals.response);
  } catch (error) {
    console.error("Failed to send role assignment email:", error);
    return res.status(500).send({ error: "Error sending role assignment email." });
  }
};

module.exports = { mailTransporter, emailRoleAssignmentMiddleware };
