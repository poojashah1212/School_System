const Admission = require('../../models/Admission');
const User = require('../../models/user');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { sendEmail } = require('../../utils/emailService');
const emailTemplates = require('../../services/emailTemplates');

const generateApplicationId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `SS-${year}-${random}`;
};

const generateStudentId = async () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const studentId = `STU-${year}-${random}`;
    
    const existingUser = await User.findOne({ userId: studentId });
    if (existingUser) {
        return generateStudentId();
    }
    return studentId;
};

const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

const formatMobileNumber = (mobileNo, userId) => {
    if (!mobileNo) {
        // Generate a simple 10-digit number for students without phone
        return `000000000${userId.slice(-4)}`;
    }
    // Remove all non-digit characters
    const cleanNumber = mobileNo.replace(/\D/g, '');
    // Take last 10 digits (handles cases with country code)
    if (cleanNumber.length > 10) {
        return cleanNumber.slice(-10);
    }
    // If exactly 10 digits, return as is
    if (cleanNumber.length === 10) {
        return cleanNumber;
    }
    // If less than 10, pad with zeros
    return cleanNumber.padStart(10, '0');
};

const generateUniqueMobileNumber = async (admission, studentId) => {
    let mobileNumber;
    let attempts = 0;
    const maxAttempts = 20;
    
    do {
        if (!admission.studentPhone && !admission.phone) {
            // Generate a simple 10-digit number for students without phone
            const random = Math.floor(Math.random() * 9000000000).toString().padStart(10, '0');
            mobileNumber = random;
        } else {
            const baseDigits = (admission.studentPhone || admission.phone).replace(/\D/g, '').slice(-8);
            const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            mobileNumber = `${baseDigits}${randomPart}`.slice(-10);
            
            // Ensure exactly 10 digits
            if (mobileNumber.length !== 10) {
                mobileNumber = Math.floor(Math.random() * 9000000000 + 1000000000).toString();
            }
        }
        
        const existingUser = await User.findOne({ mobileNo: mobileNumber });
        if (!existingUser) {
            return mobileNumber;
        }
        
        attempts++;
    } while (attempts < maxAttempts);
    
    return Math.floor(Math.random() * 9000000000 + 1000000000).toString();
};

const createStudentAccount = async (admission, status) => {
    const studentId = await generateStudentId();
    const plainPassword = generateSecurePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    const studentEmail = admission.studentEmail || admission.email;
    
    // Use mobile number from admission form, don't generate one
    const mobileNo = formatMobileNumber(admission.studentPhone || admission.phone, admission.studentId);
    
    const existingUser = await User.findOne({ email: studentEmail.toLowerCase() });
    if (existingUser) {
        throw new Error('Student with this email already exists');
    }
    
    const user = await User.create({
        userId: studentId,
        fullName: admission.studentName,
        email: studentEmail.toLowerCase(),
        password: hashedPassword,
        age: calculateAge(admission.dob),
        mobileNo: mobileNo,
        city: admission.city,
        state: admission.state,
        grade: admission.grade,
        role: 'student',
        timezone: admission.timezone || 'Asia/Kolkata',
        class: admission.grade ? admission.grade.toString() : '1'
    });

    return { user, studentId, plainPassword, studentEmail };
};

const sendCredentialsEmail = async (admission, studentEmail, username, plainPassword, status) => {
    const loginUrl = process.env.LOGIN_URL || 'http://localhost:5001/html/index.html';
    
    let emailResult;
    if (status === 'approved') {
        emailResult = await sendEmail({
            to: studentEmail,
            subject: emailTemplates.student_approved.subject,
            html: emailTemplates.student_approved.html(
                admission.studentName,
                username,
                plainPassword,
                loginUrl
            )
        });
    } else {
        emailResult = await sendEmail({
            to: studentEmail,
            subject: emailTemplates.student_rejected.subject,
            html: emailTemplates.student_rejected.html(
                admission.studentName,
                username,
                plainPassword,
                loginUrl
            )
        });
    }
    
    return emailResult;
};

const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age || 10;
};

// Submit new admission application
exports.submitApplication = async (req, res) => {
        try {
            const {
                studentName,
                dob,
                gender,
                grade,
                studentEmail,
                studentPhone,
                parentName,
                relation,
                phone,
                email,
                occupation,
                address,
                city,
                state,
                zip,
                country,
                timezone
            } = req.body;

            const applicationId = generateApplicationId();

            const admission = new Admission({
                applicationId,
                studentName,
                dob,
                gender,
                grade,
                studentEmail,
                studentPhone,
                parentName,
                relation,
                phone,
                email,
                occupation,
                address,
                city,
                state,
                zip,
                country,
                timezone,
                status: 'pending',
                submissionDate: new Date()
            });

            await admission.save();

            res.status(201).json({
                success: true,
                message: 'Application submitted successfully',
                applicationId: admission.applicationId,
                data: admission
            });
        } catch (error) {
            console.error('Admission submission error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to submit application',
                error: error.message
            });
        }
    }

    // Get all admissions (for admin)
exports.getAllAdmissions = async (req, res) => {
        try {
            const { status, page = 1, limit = 10 } = req.query;
            
            let query = {};
            if (status) {
                query.status = status;
            }

            const admissions = await Admission.find(query)
                .sort({ submissionDate: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const count = await Admission.countDocuments(query);

            res.status(200).json({
                success: true,
                data: admissions,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                total: count
            });
        } catch (error) {
            console.error('Get admissions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch admissions',
                error: error.message
            });
        }
    }

    // Get single admission by ID
exports.getAdmissionById = async (req, res) => {
        try {
            const { id } = req.params;
            
            const admission = await Admission.findById(id);
            
            if (!admission) {
                return res.status(404).json({
                    success: false,
                    message: 'Application not found'
                });
            }

            res.status(200).json({
                success: true,
                data: admission
            });
        } catch (error) {
            console.error('Get admission error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch application',
                error: error.message
            });
        }
    }

    // Get admission by application ID
exports.getAdmissionByApplicationId = async (req, res) => {
        try {
            const { applicationId } = req.params;
            
            const admission = await Admission.findOne({ applicationId });
            
            if (!admission) {
                return res.status(404).json({
                    success: false,
                    message: 'Application not found'
                });
            }

            res.status(200).json({
                success: true,
                data: admission
            });
        } catch (error) {
            console.error('Get admission error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch application',
                error: error.message
            });
        }
    }

    // Update admission status (approve/reject)
exports.updateAdmissionStatus = async (req, res) => {
        try {
            const { id } = req.params;
            const { status, notes, adminId } = req.body;

            if (!['approved', 'rejected'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status. Must be approved or rejected'
                });
            }

            const admission = await Admission.findById(id);
            
            if (!admission) {
                return res.status(404).json({
                    success: false,
                    message: 'Application not found'
                });
            }

            // Check if user account already exists (for re-processing)
            const studentEmail = admission.studentEmail || admission.email;
            const schoolEmail = `${studentEmail.toLowerCase().split('@')[0]}@school.com`;
            const existingUser = await User.findOne({ email: schoolEmail });
            
            if ((status === 'approved' || status === 'rejected') && !existingUser) {
                console.log(`🚀 Starting student account creation process for ${status}...`);
                
                const { user, studentId, plainPassword, studentEmail } = await createStudentAccount(admission, status);
                
                console.log('✅ User account created:', user.userId);
                
                console.log('📧 Sending email to:', studentEmail);
                const emailResult = await sendCredentialsEmail(admission, studentEmail, studentEmail, plainPassword, status);

                console.log('Email result:', emailResult);

                admission.status = status;
                admission.notes = notes || '';
                admission.reviewedDate = new Date();
                admission.reviewedBy = adminId || null;
                admission.studentId = studentId;
                admission.username = studentEmail;
                admission.password = user.password;
                admission.isActive = true;
                admission.firstLogin = true;
                admission.credentialsSent = emailResult.success;
                admission.credentialsSentDate = new Date();

                await admission.save();

                const message = status === 'approved' 
                    ? 'Application approved successfully. Credentials sent to student.'
                    : 'Application rejected. Credentials sent to student.';

                return res.status(200).json({
                    success: true,
                    message: message,
                    data: {
                        ...admission.toObject(),
                        username: studentEmail,
                        email: studentEmail,
                        credentialsSent: emailResult.success
                    }
                });
            }

            // If user exists but status is being changed to approved
            if (status === 'approved' && existingUser && admission.status !== 'approved') {
                admission.status = status;
                admission.notes = notes || '';
                admission.reviewedDate = new Date();
                admission.reviewedBy = adminId || null;
                admission.isActive = true;
                await admission.save();

                return res.status(200).json({
                    success: true,
                    message: 'Application approved successfully.',
                    data: admission
                });
            }

            // If user exists but status is being changed to rejected
            if (status === 'rejected' && existingUser && admission.status !== 'rejected') {
                admission.status = status;
                admission.notes = notes || '';
                admission.reviewedDate = new Date();
                admission.reviewedBy = adminId || null;
                admission.isActive = true;
                await admission.save();

                return res.status(200).json({
                    success: true,
                    message: 'Application rejected successfully.',
                    data: admission
                });
            }

            admission.status = status;
            admission.notes = notes || '';
            admission.reviewedDate = new Date();
            admission.reviewedBy = adminId || null;

            await admission.save();

            res.status(200).json({
                success: true,
                message: `Application ${status} successfully`,
                data: admission
            });
        } catch (error) {
            console.error('Update admission error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update application status',
                error: error.message
            });
        }
    }

    // Get admission statistics
exports.getAdmissionStats = async (req, res) => {
        try {
            const stats = await Admission.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const totalAdmissions = await Admission.countDocuments();
            const pendingCount = stats.find(s => s._id === 'pending')?.count || 0;
            const approvedCount = stats.find(s => s._id === 'approved')?.count || 0;
            const rejectedCount = stats.find(s => s._id === 'rejected')?.count || 0;

            res.status(200).json({
                success: true,
                data: {
                    total: totalAdmissions,
                    pending: pendingCount,
                    approved: approvedCount,
                    rejected: rejectedCount
                }
            });
        } catch (error) {
            console.error('Get admission stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch statistics',
                error: error.message
            });
        }
    }
