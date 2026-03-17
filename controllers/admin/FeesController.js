const ClassSubject = require("../../models/ClassSubject");
const ClassFees = require("../../models/ClassFees");
const User = require("../../models/user");
const FeePayment = require("../../models/FeePayment");
const { v4: uuidv4 } = require("uuid");

// Define or Update Class Fees
exports.defineFees = async (req, res) => {
    try {
        const { classId, fees, annualFees, examFees } = req.body;

        // Support both field names 'fees' and 'annualFees'
        const finalAnnualFees = parseFloat(annualFees !== undefined ? annualFees : (fees !== undefined ? fees : 0));
        const finalExamFees = parseFloat(examFees || 0);

        if (!classId) {
            return res.status(400).json({ success: false, message: "Class ID is required" });
        }

        // Upsert fee structure in ClassFees model
        const updatedFees = await ClassFees.findOneAndUpdate(
            { class_id: classId },
            {
                annual_fees: finalAnnualFees,
                exam_fees: finalExamFees,
                total_fees: finalAnnualFees + finalExamFees
            },
            { new: true, upsert: true, runValidators: true }
        ).populate("class_id", "name grade");

        // Optional: Also update the legacy fields in ClassSubject for compatibility if needed
        await ClassSubject.findByIdAndUpdate(classId, {
            fees: finalAnnualFees,
            examFees: finalExamFees
        });

        res.status(200).json({
            success: true,
            message: "Class fees updated successfully",
            data: updatedFees
        });
    } catch (err) {
        console.error("Define Fees Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get all class fees (merged with ClassSubject to show all classes)
exports.getClassFees = async (req, res) => {
    try {
        // 1. Fetch all classes from ClassSubject
        const allClassSubjects = await ClassSubject.find().sort({ grade: 1 }).lean();

        // 2. Fetch all defined fee structures from ClassFees
        const allClassFees = await ClassFees.find().lean();

        // Create a map for quick lookup
        const feesMap = new Map(allClassFees.map(f => [f.class_id.toString(), f]));

        // 3. Merge data
        const mergedList = allClassSubjects.map(cls => {
            const feeData = feesMap.get(cls._id.toString());

            return {
                _id: feeData ? feeData._id : `temp-${cls._id}`, // Use ClassFees ID or a temp one
                classId: {
                    _id: cls._id,
                    name: cls.name,
                    grade: cls.grade
                },
                annualFees: feeData ? feeData.annual_fees : (cls.fees || 0),
                examFees: feeData ? feeData.exam_fees : (cls.examFees || 0),
                totalFees: feeData ? feeData.total_fees : ((cls.fees || 0) + (cls.examFees || 0)),
                updatedAt: feeData ? feeData.updatedAt : cls.updatedAt,
                isDefined: !!feeData // Flag to indicate if it's in the new model
            };
        });

        res.status(200).json({ success: true, data: mergedList });
    } catch (err) {
        console.error("Get Class Fees Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get fees for student's current class
exports.getStudentFees = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.class) {
            return res.status(404).json({ success: false, message: "Student or class not found" });
        }

        // Find the class first
        const targetClass = await ClassSubject.findOne({ name: user.class });
        if (!targetClass) {
            return res.status(404).json({ success: false, message: "Class not found" });
        }

        // Find fee structure for this class
        const feeStructure = await ClassFees.findOne({ class_id: targetClass._id });

        if (!feeStructure) {
            // Fallback to ClassSubject if ClassFees entry doesn't exist yet
            return res.status(200).json({
                success: true,
                data: {
                    className: targetClass.name,
                    grade: targetClass.grade,
                    annualFees: targetClass.fees || 0,
                    examFees: targetClass.examFees || 0,
                    totalFees: (targetClass.fees || 0) + (targetClass.examFees || 0)
                }
            });
        }

        res.status(200).json({
            success: true,
            data: {
                className: targetClass.name,
                grade: targetClass.grade,
                annualFees: feeStructure.annual_fees,
                examFees: feeStructure.exam_fees,
                totalFees: feeStructure.total_fees,
                isFeesPaid: user.isFeesPaid || false
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get class-wise payment status (Admin)
exports.getClassWisePaymentStatus = async (req, res) => {
    try {
        const classes = await ClassSubject.find().sort({ grade: 1 });
        const students = await User.find({ role: "student" });

        const classStats = classes.map(cls => {
            const classStudents = students.filter(s => s.class === cls.name);
            const paidCount = classStudents.filter(s => s.isFeesPaid).length;
            const pendingCount = classStudents.length - paidCount;

            return {
                classId: cls._id,
                className: cls.name,
                grade: cls.grade,
                totalStudents: classStudents.length,
                paidCount,
                pendingCount,
                students: classStudents.map(s => ({
                    id: s._id,
                    fullName: s.fullName,
                    isFeesPaid: s.isFeesPaid,
                    isApproved: s.isApproved
                }))
            };
        });

        res.status(200).json({
            success: true,
            data: classStats
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Admin manually updates payment status
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { studentId, isPaid } = req.body;
        const student = await User.findByIdAndUpdate(
            studentId,
            { isFeesPaid: isPaid },
            { new: true }
        );

        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        res.status(200).json({
            success: true,
            message: `Payment status updated to ${isPaid ? "Paid" : "Pending"}`,
            data: student
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Record a payment for a student
exports.recordPayment = async (req, res) => {
    try {
        const { amountINR, localAmount, localCurrency, paymentMethod } = req.body;
        const studentId = req.user.id;

        const newPayment = new FeePayment({
            studentId,
            amountINR,
            localAmount,
            localCurrency,
            paymentMethod: paymentMethod || "Online",
            transactionId: `TXN-${uuidv4().split('-')[0].toUpperCase()}`,
            status: "Completed"
        });

        await newPayment.save();

        res.status(201).json({
            success: true,
            message: "Payment recorded successfully",
            data: newPayment
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get payment history for a student
exports.getStudentPayments = async (req, res) => {
    try {
        const studentId = req.user.id;
        const payments = await FeePayment.find({ studentId }).sort({ paymentDate: -1 });

        res.status(200).json({
            success: true,
            data: payments
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get all payments (Admin)
exports.getAllPayments = async (req, res) => {
    try {
        const payments = await FeePayment.find()
            .populate("studentId", "fullName email class")
            .sort({ paymentDate: -1 });

        res.status(200).json({
            success: true,
            data: payments
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
