const Material = require("../../models/Material");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// Create Material
exports.createMaterial = async (req, res) => {
    try {
        console.log("Creating material with body:", req.body);
        const { title, description, type, classId, subject, tags } = req.body;
        
        // Handle physical file upload or external URL
        let fileUrl = req.body.fileUrl;
        if (req.file) {
            // Store the path relative to the server
            fileUrl = `/uploads/materials/${req.file.filename}`;
            console.log("File uploaded:", fileUrl);
        }

        if (!fileUrl && type !== "VIDEO") {
            return res.status(400).json({
                success: false,
                message: "File or URL is required"
            });
        }

        let tagsArray = [];
        if (tags) {
            try {
                tagsArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
                if (!Array.isArray(tagsArray)) tagsArray = [tagsArray];
            } catch (e) {
                console.warn("Failed to parse tags:", tags);
                tagsArray = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : [];
            }
        }

        // Validate teacher ID
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Teacher ID missing"
            });
        }

        const materialData = {
            title,
            description,
            type,
            fileUrl,
            teacher: req.user.id,
            subject,
            tags: tagsArray,
        };

        // Add class if it's a valid ObjectId string
        if (classId && classId.match(/^[0-9a-fA-F]{24}$/)) {
            materialData.class = classId;
        } else {
            materialData.class = null;
        }

        console.log("Saving material data:", materialData);
        const material = new Material(materialData);
        await material.save();

        return res.status(201).json({
            success: true,
            message: "Material uploaded successfully",
            material
        });
    } catch (err) {
        console.error("Error in createMaterial:", err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error: " + err.message
        });
    }
};

// Get all materials for a teacher
exports.getTeacherMaterials = async (req, res) => {
    try {
        const materials = await Material.find({ teacher: req.user.id })
            .populate("class", "name grade")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            materials
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Update Material
exports.updateMaterial = async (req, res) => {
    try {
        const { title, description, type, classId, subject, tags } = req.body;
        
        let updateData = { title, description, type, subject };
        
        // Add class if it's a valid ObjectId string
        if (classId && classId.match(/^[0-9a-fA-F]{24}$/)) {
            updateData.class = classId;
        } else if (classId === "") {
            updateData.class = null;
        }

        let tagsArray = undefined;
        if (tags) {
            try {
                tagsArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
                if (!Array.isArray(tagsArray)) tagsArray = [tagsArray];
            } catch (e) {
                tagsArray = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : [];
            }
            updateData.tags = tagsArray;
        }

        // Handle physical file update
        if (req.file) {
            updateData.fileUrl = `/uploads/materials/${req.file.filename}`;
        } else if (req.body.fileUrl) {
            updateData.fileUrl = req.body.fileUrl;
        }

        const material = await Material.findOneAndUpdate(
            { _id: req.params.id, teacher: req.user.id },
            updateData,
            { new: true }
        );

        if (!material) {
            return res.status(404).json({
                success: false,
                message: "Material not found or unauthorized"
            });
        }

        return res.json({
            success: true,
            message: "Material updated successfully",
            material
        });
    } catch (err) {
        console.error("Error in updateMaterial:", err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error: " + err.message
        });
    }
};

// Delete Material
exports.deleteMaterial = async (req, res) => {
    try {
        const material = await Material.findOne({
            _id: req.params.id,
            teacher: req.user.id
        });

        if (!material) {
            return res.status(404).json({
                success: false,
                message: "Material not found or unauthorized"
            });
        }

        // Delete physical file if it exists locally
        if (material.fileUrl && material.fileUrl.startsWith('/uploads/materials/')) {
            const filePath = path.join(__dirname, "../..", material.fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await Material.findByIdAndDelete(material._id);

        res.json({
            success: true,
            message: "Material deleted successfully"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Get materials for student (by class)
exports.getStudentMaterials = async (req, res) => {
    try {
        const { classId } = req.params;
        const materials = await Material.find({ class: classId })
            .populate("teacher", "fullName")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            materials
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
