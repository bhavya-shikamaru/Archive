const nodemailer = require('nodemailer');

let transporter;

if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

const sendStatusNotification = async ({ toEmail, studentName, driveTitle, companyName, status, roundName }) => {
  const subject = `Placement Update: ${companyName} - ${status.toUpperCase()}`;
  const textContent = `Dear ${studentName},\n\nYour application status for "${driveTitle}" at ${companyName} has been updated to: ${status.toUpperCase()}${roundName ? ` for round: ${roundName}` : ''}.\n\nPlease log in to the Placement Portal to view more details.\n\nBest regards,\nTraining & Placement Cell`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; max-width: 600px;">
      <h2 style="color: #1e3a8a;">Training & Placement Cell Update</h2>
      <p>Dear <strong>${studentName}</strong>,</p>
      <p>Your application status for <strong>${driveTitle}</strong> at <strong>${companyName}</strong> has been updated to:</p>
      <div style="display: inline-block; padding: 8px 16px; background-color: #f0fdf4; color: #166534; font-weight: bold; border-radius: 6px; font-size: 16px; margin: 10px 0;">
        ${status.toUpperCase()}
      </div>
      ${roundName ? `<p>Stage / Round: <strong>${roundName}</strong></p>` : ''}
      <p>Please log in to your student dashboard for interview schedules and next steps.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b;">This is an automated notification from College Placement Management System.</p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"College Placement Cell" <${process.env.SMTP_FROM || 'placement@college.edu'}>`,
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent
      });
      console.log(`📧 Email sent successfully to ${toEmail} for status ${status}`);
    } catch (err) {
      console.error(`⚠️  Failed to send real email to ${toEmail}:`, err.message);
    }
  } else {
    console.log(`\n======================================================`);
    console.log(`📧 [MOCK EMAIL DISPATCHED] To: ${toEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: Status changed to [${status}] for ${studentName} (${companyName})`);
    console.log(`======================================================\n`);
  }
};

module.exports = {
  sendStatusNotification
};
