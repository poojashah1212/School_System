require("dotenv").config();
const express = require("express");
const path = require("path");
const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");
const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDB();
connectRedis();

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/teachers", require("./routes/teacherRoutes"));
app.use("/api/teacher-availability", require("./routes/teacherAvailabilityRoutes"));
app.use("/api/sessions", require("./routes/sessionRoutes"));

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
    method: req.method
  });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running at http://localhost:" + PORT);
});
