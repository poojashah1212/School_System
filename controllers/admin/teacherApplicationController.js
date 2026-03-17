const TeacherApplication = require("../../models/TeacherApplication");
const { sendEmail } = require("../../utils/emailService");
const emailTemplates = require("../../services/emailTemplates");
const bcrypt = require('bcryptjs');

const generateApplicationId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `SS-TEACH-${year}-${random}`;
};

const generateTeacherId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TCH-${year}-${random}`;
};

const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

const createTeacherAccount = async (application) => {
    const teacherId = generateTeacherId();
    const plainPassword = generateSecurePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    const User = require('../../models/user');
    const existingUser = await User.findOne({ email: application.email.toLowerCase() });
    if (existingUser) {
        // If teacher account already exists, return existing account info
        return { 
            user: existingUser, 
            teacherId: existingUser.userId, 
            plainPassword: 'Password already set', 
            teacherEmail: application.email,
            existingAccount: true
        };
    }
    
    const user = await User.create({
        userId: teacherId,
        fullName: application.name,
        email: application.email.toLowerCase(),
        password: hashedPassword,
        age: 30, // Default age for teachers
        mobileNo: application.phone || '0000000000',
        city: application.city || '',
        state: application.state || '',
        role: 'teacher',
        timezone: 'Asia/Kolkata',
        class: null // Teachers don't have class
    });

    return { user, teacherId, plainPassword, teacherEmail: application.email, existingAccount: false };
};

const sendTeacherCredentialsEmail = async (application, status) => {
    const loginUrl = process.env.LOGIN_URL || 'http://localhost:5001/html/index.html';
    
    if (status === 'approved') {
        // Create teacher account and send credentials
        const { user, teacherId, plainPassword, teacherEmail, existingAccount } = await createTeacherAccount(application);
        
        let emailContent;
        if (existingAccount) {
            // Send email for existing account
            emailContent = {
                to: teacherEmail,
                subject: "Your Teacher Application Has Been Approved - Account Activated",
                html: `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Teacher Application Approved</title>
                    <style>
                      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
                      .container { background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                      .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #28a745; }
                      .header h1 { color: #28a745; margin: 0; font-size: 28px; }
                      .approval-badge { background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; }
                      .approval-badge h2 { color: #155724; margin: 0; }
                      .info-box { background-color: #e8f4fd; border: 1px solid #b3d9ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
                      .footer { text-align: center; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <div class="header">
                        <h1>Teacher Application Approved!</h1>
                      </div>
                      <div class="content">
                        <div class="approval-badge">
                          <h2>🎉 Congratulations!</h2>
                          <p>Your teacher application has been approved.</p>
                        </div>
                        
                        <p>Dear <strong>${application.name}</strong>,</p>
                        <p>We are pleased to inform you that your teacher application has been approved. Your teacher account is now active and you can log in to access the school system.</p>
                        
                        <div class="info-box">
                          <h3>Account Information:</h3>
                          <p><strong>Email (Username):</strong> ${teacherEmail}</p>
                          <p><strong>Teacher ID:</strong> ${teacherId}</p>
                          <p><strong>Status:</strong> Account Active</p>
                          <p><em>Your existing password has been retained. If you need to reset your password, please use the forgot password option on the login page.</em></p>
                        </div>
                        
                        <a href="${loginUrl}" style="display: inline-block; background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; text-align: center;">Log In Now</a>
                        
                        <p>If you have any questions or need assistance, please contact the school administration.</p>
                      </div>
                      <div class="footer">
                        <p>Best regards,<br>School System Team</p>
                        <p>This is an automated message. Please do not reply to this email.</p>
                      </div>
                    </div>
                  </body>
                  </html>
                `
            };
        } else {
            // Send email for new account with credentials
            emailContent = {
                to: teacherEmail,
                subject: emailTemplates.teacher_approved.subject,
                html: emailTemplates.teacher_approved.html(
                    application.name,
                    teacherEmail,
                    plainPassword,
                    loginUrl
                )
            };
        }
        
        const emailResult = await sendEmail(emailContent);
        
        return { user, teacherId, plainPassword, teacherEmail, emailResult, existingAccount };
    } else {
        // Send rejection email
        const emailResult = await sendEmail({
            to: application.email,
            subject: emailTemplates.teacher_rejected.subject,
            html: emailTemplates.teacher_rejected.html(application.name)
        });
        
        return { emailResult };
    }
};

// Submit new teacher application
exports.submitApplication = async (req, res) => {
    try {
        const applicationId = generateApplicationId();
        
        // Extract file paths from multer upload
        const files = req.files || {};
        
        const applicationData = {
            applicationId,
            ...req.body,
            status: 'pending',
            submissionDate: new Date(),
            resume: files.resume ? files.resume[0].path : null,
            coverLetter: files.coverLetter ? files.coverLetter[0].path : null,
            certificates: files.certificates ? files.certificates.map(file => file.path) : [],
            photo: files.photo ? files.photo[0].path : null
        };

        const application = new TeacherApplication(applicationData);
        await application.save();

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            applicationId: application.applicationId,
            data: application
        });
    } catch (error) {
        console.error('Teacher application submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit application',
            error: error.message
        });
    }
};

// Get all teacher applications (for admin)
exports.getAllApplications = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        
        let query = {};
        if (status) {
            query.status = status;
        }

        const applications = await TeacherApplication.find(query)
            .sort({ submissionDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await TeacherApplication.countDocuments(query);

        res.status(200).json({
            success: true,
            data: applications,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        console.error('Get teacher applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch applications',
            error: error.message
        });
    }
};

// Get single application by ID
exports.getApplicationById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const application = await TeacherApplication.findById(id);
        
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        res.status(200).json({
            success: true,
            data: application
        });
    } catch (error) {
        console.error('Get teacher application error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch application',
            error: error.message
        });
    }
};

// Update application status (approve/reject)
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be approved or rejected'
            });
        }

        const application = await TeacherApplication.findById(id);
        
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        application.status = status;
        application.notes = notes || '';
        application.reviewedDate = new Date();
        application.reviewedBy = req.body.adminId || null;

        // Send email and create account if approved
        let emailResult, user, teacherId, plainPassword, teacherEmail;
        
        if (status === 'approved') {
            console.log('🚀 Starting teacher account creation process...');
            const result = await sendTeacherCredentialsEmail(application, status);
            emailResult = result.emailResult;
            user = result.user;
            teacherId = result.teacherId;
            plainPassword = result.plainPassword;
            teacherEmail = result.teacherEmail;
            
            // Update application with teacher account info
            application.teacherId = teacherId;
            application.username = teacherEmail;
            application.password = user.password;
            application.isActive = true;
            application.credentialsSent = emailResult.success;
            application.credentialsSentDate = new Date();
            
            if (result.existingAccount) {
                console.log('✅ Using existing teacher account:', user.userId);
                console.log('📧 Sending activation email to:', teacherEmail);
            } else {
                console.log('✅ New teacher account created:', user.userId);
                console.log('📧 Sending credentials email to:', teacherEmail);
            }
        } else {
            // Send rejection email
            const result = await sendTeacherCredentialsEmail(application, status);
            emailResult = result.emailResult;
            
            console.log('📧 Sending rejection email to:', application.email);
        }

        console.log('Email result:', emailResult);

        await application.save();

        const message = status === 'approved' 
            ? 'Application approved successfully. Teacher credentials sent.' 
            : 'Application rejected. Email sent to teacher.';

        res.status(200).json({
            success: true,
            message: message,
            data: {
                ...application.toObject(),
                credentialsSent: emailResult.success
            }
        });
    } catch (error) {
        console.error('Update teacher application error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update application status',
            error: error.message
        });
    }
};

// Get application statistics
exports.getApplicationStats = async (req, res) => {
    try {
        const stats = await TeacherApplication.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalApplications = await TeacherApplication.countDocuments();
        const pendingCount = stats.find(s => s._id === 'pending')?.count || 0;
        const approvedCount = stats.find(s => s._id === 'approved')?.count || 0;
        const rejectedCount = stats.find(s => s._id === 'rejected')?.count || 0;

        res.status(200).json({
            success: true,
            data: {
                total: totalApplications,
                pending: pendingCount,
                approved: approvedCount,
                rejected: rejectedCount
            }
        });
    } catch (error) {
        console.error('Get teacher application stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message
        });
    }
};

// Get pending applications count
exports.getPendingCount = async (req, res) => {
    try {
        const count = await TeacherApplication.countDocuments({ status: 'pending' });
        
        res.status(200).json({
            success: true,
            data: { pendingCount: count }
        });
    } catch (error) {
        console.error('Get pending count error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending count',
            error: error.message
        });
    }
};
