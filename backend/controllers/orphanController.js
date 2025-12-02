const Orphan = require("../models/Orphan");

// Create new orphan (admin only)
exports.createOrphan = async (req, res) => {
  try {
    const { name, age, gender, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const baseURL = req.protocol + "://" + req.get("host");
    const orphan = await Orphan.create({
      name,
      age,
      gender,
      description,
      // image: req.file ? `/uploads/${req.file.filename}` : null,
      image: req.file ? `${baseURL}/uploads/${req.file.filename}` : null,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: orphan });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all orphans (anyone can view)
exports.getOrphans = async (req, res) => {
  try {
    const orphans = await Orphan.find().populate("createdBy", "name email");
    res.json({ success: true, data: orphans });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};
