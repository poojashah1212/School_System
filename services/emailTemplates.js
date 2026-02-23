const emailTemplates = {
  teacher_signup: {
    subject: "Welcome to School System - Teacher Account Created",
    html: (teacherName) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to School System</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #007bff;
          }
          .header h1 {
            color: #007bff;
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 20px 0;
          }
          .welcome-text {
            font-size: 18px;
            margin-bottom: 20px;
          }
          .feature-list {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .feature-list h3 {
            color: #007bff;
            margin-top: 0;
          }
          .feature-list ul {
            margin: 0;
            padding-left: 20px;
          }
          .feature-list li {
            margin-bottom: 10px;
          }
          .cta-button {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>School System</h1>
          </div>
          <div class="content">
            <p class="welcome-text">Dear <strong>${teacherName}</strong>,</p>
            <p>Welcome to School System! Your teacher account has been successfully created.</p>
            
            <div class="feature-list">
              <h3>What You Can Do:</h3>
              <ul>
                <li>Create and manage student profiles</li>
                <li>Schedule and conduct interactive sessions</li>
                <li>Create quizzes and assessments</li>
                <li>Track student progress and performance</li>
                <li>Manage your availability and calendar</li>
              </ul>
            </div>
            
            <p>You can now log in to your account and start exploring all the features available to you as a teacher.</p>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>School System Team</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  student_added: {
    subject: "New Student Added to Your Account - School System",
    html: (teacherName, studentName, studentEmail) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Student Added</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #28a745;
          }
          .header h1 {
            color: #28a745;
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 20px 0;
          }
          .student-info {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .student-info h3 {
            color: #155724;
            margin-top: 0;
          }
          .info-item {
            margin-bottom: 10px;
          }
          .info-label {
            font-weight: bold;
            color: #155724;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Student Added Successfully</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${teacherName}</strong>,</p>
            <p>A new student has been successfully added to your account in the School System.</p>
            
            <div class="student-info">
              <h3>Student Information:</h3>
              <div class="info-item">
                <span class="info-label">Name:</span> ${studentName}
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span> ${studentEmail}
              </div>
            </div>
            
            <p>You can now manage this student's profile, schedule sessions, create quizzes, and track their progress through your teacher dashboard.</p>
            
            <p>The student will also receive a separate email with their account information.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>School System Team</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  student_welcome: {
    subject: "Welcome to School System - Your Account Has Been Created",
    html: (studentName, teacherName, teacherEmail, studentEmail, studentPassword) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to School System</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #17a2b8;
          }
          .header h1 {
            color: #17a2b8;
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 20px 0;
          }
          .teacher-info {
            background-color: #d1ecf1;
            border: 1px solid #bee5eb;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .teacher-info h3 {
            color: #0c5460;
            margin-top: 0;
          }
          .info-item {
            margin-bottom: 10px;
          }
          .info-label {
            font-weight: bold;
            color: #0c5460;
          }
          .login-credentials {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .login-credentials h3 {
            color: #856404;
            margin-top: 0;
          }
          .credential-item {
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 3px;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
          }
          .next-steps {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .next-steps h3 {
            color: #17a2b8;
            margin-top: 0;
          }
          .next-steps ul {
            margin: 0;
            padding-left: 20px;
          }
          .next-steps li {
            margin-bottom: 10px;
          }
          .login-button {
            display: inline-block;
            background-color: #17a2b8;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to School System</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${studentName}</strong>,</p>
            <p>Welcome to School System! Your student account has been successfully created by your teacher.</p>
            
            <div class="teacher-info">
              <h3>Your Teacher Information:</h3>
              <div class="info-item">
                <span class="info-label">Teacher Name:</span> ${teacherName}
              </div>
              <div class="info-item">
                <span class="info-label">Teacher Email:</span> ${teacherEmail}
              </div>
            </div>
            
            <div class="login-credentials">
              <h3>Your Login Credentials:</h3>
              <div class="info-item">
                <span class="info-label">Email:</span> ${studentEmail}
              </div>
              <div class="info-item">
                <span class="info-label">Password:</span> 
                <div class="credential-item">${studentPassword}</div>
              </div>
              <p><strong>Important:</strong> Please keep your credentials secure and do not share them with others.</p>
            </div>
            
            <div class="next-steps">
              <h3>What's Next?</h3>
              <ul>
                <li>Log in to your account using the credentials above</li>
                <li>Complete your profile information</li>
                <li>View scheduled sessions and quizzes</li>
                <li>Track your progress and performance</li>
              </ul>
            </div>
            
            <a href="https://smartschool-je18.onrender.com/html/login.html" class="login-button">Go to Login Page</a>
            
            <p>If you have any questions about your account or need assistance, please contact your teacher directly.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>School System Team</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  session_created: {
    subject: "New Session Scheduled - School System",
    html: (studentName, teacherName, sessionTitle, sessionDate) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Session Scheduled</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #6f42c1;
          }
          .header h1 {
            color: #6f42c1;
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 20px 0;
          }
          .session-info {
            background-color: #f3e8ff;
            border: 1px solid #d4b5ff;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .session-info h3 {
            color: #6f42c1;
            margin-top: 0;
          }
          .info-item {
            margin-bottom: 10px;
            display: flex;
            align-items: center;
          }
          .info-label {
            font-weight: bold;
            color: #6f42c1;
            min-width: 120px;
          }
          .info-value {
            color: #333;
          }
          .teacher-info {
            background-color: #e8f4fd;
            border: 1px solid #b3d9ff;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .teacher-info h3 {
            color: #0066cc;
            margin-top: 0;
          }
          .action-button {
            display: inline-block;
            background-color: #6f42c1;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
          }
          .reminder {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .reminder h3 {
            color: #856404;
            margin-top: 0;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
          }
          .icon {
            margin-right: 8px;
            color: #6f42c1;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Session Scheduled</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${studentName}</strong>,</p>
            <p>Your teacher has scheduled a new session for you. Please find the details below:</p>
            
            <div class="session-info">
              <h3>Session Details:</h3>
              <div class="info-item">
                <span class="info-label">📚 Subject:</span>
                <span class="info-value">${sessionTitle}</span>
              </div>
              <div class="info-item">
                <span class="info-label">📅 Date:</span>
                <span class="info-value">${sessionDate}</span>
              </div>
              <div class="info-item">
                <span class="info-label">👨‍🏫 Teacher:</span>
                <span class="info-value">${teacherName}</span>
              </div>
            </div>
            
            <div class="teacher-info">
              <h3>Teacher Information:</h3>
              <div class="info-item">
                <span class="info-label">Name:</span>
                <span class="info-value">${teacherName}</span>
              </div>
            </div>
            
            <div class="reminder">
              <h3>📌 Important Reminders:</h3>
              <ul>
                <li>Please log in to your account to view available time slots</li>
                <li>Book your preferred time slot as soon as possible</li>
                <li>Make sure you have a stable internet connection</li>
                <li>If you need to reschedule, please contact your teacher in advance</li>
              </ul>
            </div>
            
            <a href="https://smartschool-je18.onrender.com/html/studentDashboard.html" class="action-button">Go to Your Dashboard</a>
            
            <p>If you have any questions about this session, please don't hesitate to contact your teacher.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>School System Team</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  slot_assigned: {
    subject: "Session Slot Assigned - School System",
    html: (studentName, teacherName, sessionTitle, sessionDate, sessionStartTime, sessionEndTime) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Session Slot Assigned</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #28a745;
          }
          .header h1 {
            color: #28a745;
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 20px 0;
          }
          .assignment-notice {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
          }
          .assignment-notice h2 {
            color: #155724;
            margin: 0 0 10px 0;
            font-size: 24px;
          }
          .session-info {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .session-info h3 {
            color: #495057;
            margin-top: 0;
          }
          .info-item {
            margin-bottom: 15px;
            display: flex;
            align-items: center;
          }
          .info-label {
            font-weight: bold;
            color: #28a745;
            min-width: 120px;
          }
          .info-value {
            color: #333;
            font-size: 16px;
          }
          .teacher-info {
            background-color: #e8f4fd;
            border: 1px solid #b3d9ff;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .teacher-info h3 {
            color: #0066cc;
            margin-top: 0;
          }
          .action-button {
            display: inline-block;
            background-color: #28a745;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
          }
          .reminder {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .reminder h3 {
            color: #856404;
            margin-top: 0;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
          }
          .icon {
            margin-right: 8px;
            color: #28a745;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Session Slot Assigned</h1>
          </div>
          <div class="content">
            <div class="assignment-notice">
              <h2>✅ Slot Confirmed!</h2>
              <p>Your teacher has assigned a specific time slot for your session.</p>
            </div>
            
            <p>Dear <strong>${studentName}</strong>,</p>
            <p>Your teacher has assigned the following time slot for your session. This slot is now confirmed for you:</p>
            
            <div class="session-info">
              <h3>Assigned Session Details:</h3>
              <div class="info-item">
                <span class="info-label">📚 Subject:</span>
                <span class="info-value">${sessionTitle}</span>
              </div>
              <div class="info-item">
                <span class="info-label">📅 Date:</span>
                <span class="info-value">${sessionDate}</span>
              </div>
              <div class="info-item">
                <span class="info-label">🕐 Time:</span>
                <span class="info-value">${sessionStartTime} - ${sessionEndTime}</span>
              </div>
              <div class="info-item">
                <span class="info-label">👨‍🏫 Teacher:</span>
                <span class="info-value">${teacherName}</span>
              </div>
            </div>
            
            <div class="teacher-info">
              <h3>Teacher Information:</h3>
              <div class="info-item">
                <span class="info-label">Name:</span>
                <span class="info-value">${teacherName}</span>
              </div>
            </div>
            
            <div class="reminder">
              <h3>📌 Important Reminders:</h3>
              <ul>
                <li>Please log in to your account a few minutes before the session starts</li>
                <li>Make sure you have a stable internet connection</li>
                <li>Prepare any questions or topics you'd like to discuss</li>
                <li>This slot is specifically assigned to you - no need to book it</li>
                <li>If you need to reschedule, please contact your teacher in advance</li>
              </ul>
            </div>
            
            <a href="https://smartschool-je18.onrender.com/html/studentDashboard.html" class="action-button">Go to Your Dashboard</a>
            
            <p>If you have any questions about this assigned slot, please don't hesitate to contact your teacher.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>School System Team</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
};

module.exports = emailTemplates;
