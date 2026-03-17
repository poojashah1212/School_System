const AcademicEvent = require("../models/AcademicEvent");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");

// Get all events
exports.getEvents = async (req, res) => {
    try {
        const events = await AcademicEvent.find();
        res.status(200).json({ success: true, data: events });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Upload CSV for holidays or events
exports.uploadCSV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Please upload a CSV file" });
        }

        const type = req.query.type; // "holiday" or "event"
        if (!["holiday", "event"].includes(type)) {
            return res.status(400).json({ success: false, message: "Invalid type specified" });
        }

        const results = [];
        const filePath = req.file.path;

        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (data) => {
                // Expecting headers: Title, Start Date, End Date, Description
                if (data.Title && data["Start Date"] && data["End Date"]) {
                    results.push({
                        title: data.Title,
                        startDate: new Date(data["Start Date"]),
                        endDate: new Date(data["End Date"]),
                        type: type,
                        description: data.Description || ""
                    });
                }
            })
            .on("end", async () => {
                try {
                    // Bulk insert
                    await AcademicEvent.insertMany(results);
                    // Remove the file after processing
                    fs.unlinkSync(filePath);
                    res.status(201).json({ 
                        success: true, 
                        message: `${results.length} ${type}s uploaded successfully`,
                        count: results.length
                    });
                } catch (err) {
                    res.status(500).json({ success: false, message: "Error saving events: " + err.message });
                }
            });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Delete all events (optional, useful for clean re-uploads)
exports.clearEvents = async (req, res) => {
    try {
        const type = req.query.type;
        const filter = type ? { type } : {};
        await AcademicEvent.deleteMany(filter);
        res.status(200).json({ success: true, message: "Calendar cleared successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Download Sample CSV
exports.downloadSample = (req, res) => {
    const type = req.query.type; // "holiday" or "event"
    let content = "Title,Start Date,End Date,Description\n";

    if (type === "holiday") {
        content += "New Year,2026-01-01,2026-01-01,Start of the year\n";
        content += "Makar Sankranti,2026-01-14,2026-01-14,Harvest Festival\n";
        content += "Republic Day,2026-01-26,2026-01-26,Indian Republic Day\n";
        content += "Vasant Panchami,2026-01-22,2026-01-22,Saraswati Puja\n";
        content += "Maha Shivratri,2026-02-15,2026-02-15,Festival of Shiva\n";
        content += "Holi,2026-03-04,2026-03-05,Festival of Colors\n";
        content += "Ramadan Start,2026-02-18,2026-02-18,Islamic Month of Fasting\n";
        content += "Eid-ul-Fitr,2026-03-20,2026-03-21,Festival of Breaking the Fast\n";
        content += "Ram Navami,2026-03-27,2026-03-27,Lord Rama's Birthday\n";
        content += "Mahavir Jayanti,2026-03-31,2026-03-31,Jainism Festival\n";
        content += "Good Friday,2026-04-03,2026-04-03,Christian Holy Day\n";
        content += "Ambedkar Jayanti,2026-04-14,2026-04-14,Father of Indian Constitution\n";
        content += "Buddha Purnima,2026-05-02,2026-05-02,Lord Buddha's Birthday\n";
        content += "Eid-ul-Adha,2026-05-27,2026-05-27,Festival of Sacrifice\n";
        content += "Muharram,2026-06-26,2026-06-26,Islamic New Year\n";
        content += "Independence Day,2026-08-15,2026-08-15,Indian Independence Day\n";
        content += "Janmashtami,2026-09-03,2026-09-04,Lord Krishna's Birthday\n";
        content += "Ganesh Chaturthi,2026-09-15,2026-09-24,Festival of Ganesha\n";
        content += "Gandhi Jayanti,2026-10-02,2026-10-02,Mahatma Gandhi's Birthday\n";
        content += "Dussehra,2026-10-20,2026-10-20,Victory of Good over Evil\n";
        content += "Diwali,2026-11-08,2026-11-12,Festival of Lights\n";
        content += "Guru Nanak Jayanti,2026-11-24,2026-11-24,Sikh Festival\n";
        content += "Christmas,2026-12-25,2026-12-25,Birth of Jesus\n";
        // Adding more to reach ~40
        content += "Raksha Bandhan,2026-08-28,2026-08-28,Bond of Protection\n";
        content += "Onam,2026-08-27,2026-08-27,Harvest Festival of Kerala\n";
        content += "Pongal,2026-01-14,2026-01-17,Harvest Festival of Tamil Nadu\n";
        content += "Karwa Chauth,2026-10-29,2026-10-29,Wives' Fasting Festival\n";
        content += "Bhai Dooj,2026-11-13,2026-11-13,Brothers and Sisters Festival\n";
        content += "Chhath Puja,2026-11-16,2026-11-17,Sun God Worship\n";
        content += "Guru Gobind Singh Jayanti,2026-01-05,2026-01-05,Sikh Guru Festival\n";
        content += "Basant Panchami,2026-02-02,2026-02-02,Spring Festival\n";
        content += "Maha Shivaratri,2026-02-15,2026-02-15,Great Night of Shiva\n";
        content += "Lohri,2026-01-13,2026-01-13,Bonfire Festival\n";
        content += "Bihu,2026-04-14,2026-04-14,Assamese New Year\n";
        content += "Vishnu,2026-04-14,2026-04-14,Malayalee New Year\n";
        content += "Parsi New Year,2026-08-16,2026-08-16,Nowruz\n";
        content += "Valmiki Jayanti,2026-10-26,2026-10-26,Birth of Sage Valmiki\n";
        content += "Milad-un-Nabi,2026-09-05,2026-09-05,Prophet's Birthday\n";
        content += "Children's Day,2026-11-14,2026-11-14,Nehru's Birthday\n";
        content += "Teachers' Day,2026-09-05,2026-09-05,Radhakrishnan's Birthday\n";
        content += "Summer Vacation,2026-05-15,2026-06-30,Academic Break\n";
        content += "Winter Break,2026-12-24,2026-12-31,Winter Holidays\n";
    } else {
        content += "Hackathon 2026,2026-02-10,2026-02-11,24-Hour Coding Challenge\n";
        content += "Quiz Fest,2026-02-20,2026-02-20,Inter-School Quiz Competition\n";
        content += "Science Fair,2026-03-10,2026-03-12,Student Projects Exhibition\n";
        content += "Annual Day,2026-04-20,2026-04-20,Grand Cultural Celebration\n";
        content += "Sports Meet,2026-01-15,2026-01-18,Annual Athletic Meet\n";
        content += "Music Concert,2026-05-05,2026-05-05,Vocal and Instrumental Showcase\n";
        content += "Art Exhibition,2026-07-12,2026-07-15,Creative Arts Display\n";
        content += "Drama Night,2026-08-20,2026-08-20,Theatre and Skit Performances\n";
        content += "Debate League,2026-09-10,2026-09-11,Eloquence and Argumentation\n";
        content += "Robotics Workshop,2026-10-05,2026-10-07,Hands-on Robot Building\n";
        content += "Tech Symposium,2026-11-15,2026-11-16,Seminars and Tech Talks\n";
        content += "Mathematics Olympiad,2026-12-05,2026-12-05,Competitive Math Exams\n";
        content += "Environmental Day,2026-06-05,2026-06-05,Tree Plantation Drive\n";
        content += "Career Counseling,2026-02-25,2026-02-25,Guiding Students' Future\n";
        content += "Parent-Teacher Meet,2026-03-25,2026-03-25,Interaction Session\n";
        content += "Photography Contest,2026-09-25,2026-09-27,Visual Storytelling\n";
        content += "Alumni Meet,2026-12-20,2026-12-20,Reunion with Old Students\n";
        content += "Yoga Workshop,2026-06-21,2026-06-21,Wellness and Meditation\n";
        content += "Literature Festival,2026-10-15,2026-10-17,Books and Authors Meet\n";
        content += "Film Making Workshop,2026-11-20,2026-11-22,Cinematography Basics\n";
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=sample_${type}s.csv`);
    res.status(200).send(content);
};
