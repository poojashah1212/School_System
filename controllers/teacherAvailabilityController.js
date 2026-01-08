const TeacherAvailability = require("../models/TeacherAvailability");
const { parseDDMMYYYY } = require("../utils/dateParser");

exports.getWeeklyAvailability = async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    const availability = await TeacherAvailability.findOne({ teacherId })
      .select("weeklyAvailability");

    if (!availability) {
      return res.json({ weeklyAvailability: [] });
    }

    res.json({ weeklyAvailability: availability.weeklyAvailability });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.setWeeklyAvailability = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { weeklyAvailability } = req.body;

    if (!Array.isArray(weeklyAvailability) || weeklyAvailability.length === 0) {
      return res.status(400).json({ message: "Weekly availability is required" });
    }

    const availability = await TeacherAvailability.findOneAndUpdate(
      { teacherId },
      { $set: { weeklyAvailability } },
      { upsert: true, new: true }
    );

    res.json({
      message: "Weekly availability updated",
      availability
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addHoliday = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { startDate, endDate, reason, note } = req.body;

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({
        message: "startDate, endDate and reason are required"
      });
    }

    const parsedStartDate = parseDDMMYYYY(startDate);
    const parsedEndDate = parseDDMMYYYY(endDate);

    if (parsedEndDate < parsedStartDate) {
      return res.status(400).json({
        message: "endDate cannot be before startDate"
      });
    }

    const existingAvailability = await TeacherAvailability.findOne({
      teacherId,
      holidays: {
        $elemMatch: {
          startDate: { $lte: parsedEndDate },
          endDate: { $gte: parsedStartDate }
        }
      }
    });

    if (existingAvailability) {
      return res.status(400).json({
        message: "Holiday dates overlap with an existing holiday"
      });
    }
    
    const availability = await TeacherAvailability.findOneAndUpdate(
      { teacherId },
      {
        $push: {
          holidays: {
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            reason,
            note: note || ""
          }
        }
      },
      { upsert: true, new: true }
    );

    res.json({
      message: "Holiday added successfully",
      holidays: availability.holidays
    });
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ message: err.message });
  }
};

exports.getHolidays = async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    const availability = await TeacherAvailability.findOne({ teacherId })
      .select("holidays")
      .sort({ "holidays.startDate": 1 });

    if (!availability) {
      return res.json({ holidays: [] });
    }

    // Sort holidays by start date and get all upcoming ones
    const today = new Date();
    const holidays = availability.holidays
      .filter(holiday => holiday.endDate >= today)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    res.json({ holidays });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getTeacherAvailabilityForStudent = async (req, res) => {
    console.log("User role from token:", req.user.role);

  try {
    const { teacherId } = req.params;

    const availability = await TeacherAvailability.findOne({ teacherId })
      .select("-_id -__v");

    if (!availability) {
      return res.status(404).json({ message: "Teacher availability not set yet" });
    }

    res.json(availability);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
