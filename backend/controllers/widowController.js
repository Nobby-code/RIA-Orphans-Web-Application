const Widow = require("../models/Widow");

// Create widow (admin only)
exports.createWidow = async (req, res) => {
  try {
    const { name, dob, location, numberOfChildren, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    // console.log("Received widow data:", req.body);
    let imageUrl = null;
    if (req.file) {
      imageUrl = req.file.path; // Cloudinary gives URL in .path
    }
    // if (req.file) {
    //   const baseURL = req.protocol + "://" + req.get("host");
    //   imagePath = `${baseURL}/uploads/${req.file.filename}`;
    // }

    const widow = await Widow.create({
      name,
      dob,
      image: imageUrl,
      // age,
      location,
      numberOfChildren,
      description,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: widow,
    });
    
  } catch (error) {
  console.error("FULL ERROR:", error);
  console.error("ERROR MESSAGE:", error.message);
  res.status(500).json({ 
    message: error.message || "Server error",
    error: error
  });
}

};

// Get all widows (public)
exports.getWidows = async (req, res) => {
  try {
    // const widows = await Widow.find().populate("createdBy", "name email");
    // res.json({ success: true, data: widows });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const total = await Widow.countDocuments();

    const widows = await Widow.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name email");

    res.json({
      success: true,
      data: widows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        pageSize: limit,
      },
    });
  } catch (error) {
    console.error("Get widows error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get widow by ID
exports.getWidowById = async (req, res) => {
  try {
    const widow = await Widow.findById(req.params.id);
    if (!widow) {
      return res.status(404).json({ message: "Widow not found" });
    }
    res.json({ success: true, data: widow });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update widow (admin only)
exports.updateWidow = async (req, res) => {
  try {
    const updatedWidow = await Widow.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedWidow) {
      return res.status(404).json({ message: "Widow not found" });
    }

    res.json({ success: true, data: updatedWidow });
  } catch (error) {
    console.error("Update widow error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete widow (admin only)
exports.deleteWidow = async (req, res) => {
  try {
    const widow = await Widow.findByIdAndDelete(req.params.id);
    if (!widow) {
      return res.status(404).json({ message: "Widow not found" });
    }
    res.json({ success: true, message: "Widow deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
