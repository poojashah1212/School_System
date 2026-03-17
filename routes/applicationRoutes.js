const express = require('express');
const router = express.Router();
const admissionController = require('../controllers/admin/admissionController');
const teacherApplicationController = require('../controllers/admin/teacherApplicationController');
const { admissionUpload, teacherUpload } = require('../middleware/admissionUpload');

// Student Admission Routes
router.post('/admissions/submit', admissionUpload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'birthCert', maxCount: 1 },
    { name: 'previousMarks', maxCount: 1 },
    { name: 'transferCert', maxCount: 1 }
]), admissionController.submitApplication);

router.get('/admissions', admissionController.getAllAdmissions);
router.get('/admissions/:id', admissionController.getAdmissionById);
router.get('/admissions/application/:applicationId', admissionController.getAdmissionByApplicationId);
router.put('/admissions/:id/status', admissionController.updateAdmissionStatus);
router.get('/admissions/stats', admissionController.getAdmissionStats);

// Teacher Application Routes
router.post('/teachers/apply', teacherUpload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'coverLetter', maxCount: 1 },
    { name: 'certificates', maxCount: 5 }
]), teacherApplicationController.submitApplication);

router.get('/teachers', teacherApplicationController.getAllApplications);
router.get('/teachers/:id', teacherApplicationController.getApplicationById);
router.put('/teachers/:id/status', teacherApplicationController.updateApplicationStatus);
router.get('/teachers/stats', teacherApplicationController.getApplicationStats);
router.get('/teachers/pending/count', teacherApplicationController.getPendingCount);

module.exports = router;
