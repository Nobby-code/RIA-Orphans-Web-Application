const Orphan = require("../models/Orphan");

// Create new orphan (admin only)
exports.createOrphan = async (req, res) => {
  try {
    const { name, dob, age, gender, orphanType, deceasedParent, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (orphanType === "partial" && !deceasedParent) {
      return res
        .status(400)
        .json({ message: "Deceased parent is required for partial orphans" });
    }

    if (orphanType === "total") {
      req.body.deceasedParent = null; // Ensure deceasedParent is null for total orphans
    }
    // if (orphanType === "total" && deceasedParent) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Total orphan should not have deceased parent",
    //   });
    // }

    const baseURL = req.protocol + "://" + req.get("host");
    const orphan = await Orphan.create({
      name,
      dob,
      age,
      gender,
      orphanType,
      deceasedParent,
      description,
      // image: req.file ? `/uploads/${req.file.filename}` : null,
      image: req.file ? `${baseURL}/uploads/${req.file.filename}` : null,
      createdBy: req.user._id,
    });

    await orphan.save();

    res.status(201).json({ success: true, data: orphan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all orphans (anyone can view)
exports.getOrphans = async (req, res) => {
  try {
    // const orphans = await Orphan.find().populate("createdBy", "name email");
    // res.json({ success: true, data: orphans });
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const total = await Orphan.countDocuments();

    const orphans = await Orphan.find()
      .populate("createdBy", "name email")
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name email");

    res.json({
      success: true,
      data: orphans,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        pageSize: limit,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Get orphan by ID
exports.getOrphanById = async (req, res) => {
  try {
    const orphan = await Orphan.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );
    if (!orphan) {
      return res.status(404).json({ message: "Orphan not found" });
    }
    res.json({ success: true, data: orphan });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Update orphan by ID (admin only)
exports.updateOrphan = async (req, res) => {
  try {
    const { id } = req.params;

    // IMPORTANT: ensure id exists
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Orphan ID is required",
      });
    }

    const updatedOrphan = await Orphan.findByIdAndUpdate(
      id,
      {
        name: req.body.name,
        age: req.body.age,
        gender: req.body.gender,
        description: req.body.description,
        image: req.body.image,
      },
      { new: true, runValidators: true }
    );

    if (!updatedOrphan) {
      return res.status(404).json({
        success: false,
        message: "Orphan not found",
      });
    }

    res.json({
      success: true,
      data: updatedOrphan,
    });
  } catch (error) {
    console.error("Update orphan error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
