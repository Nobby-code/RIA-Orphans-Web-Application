const Orphan = require("../models/Orphan");
const cloudinary = require("cloudinary").v2;


// Create new orphan (admin only)
exports.createOrphan = async (req, res) => {
  try {
    const { name, dob, age, gender, orphanType, deceasedParent, description } =
      req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (orphanType === "partial" && !deceasedParent) {
      return res
        .status(400)
        .json({ message: "Deceased parent is required for partial orphans" });
    }

    if (orphanType === "total") {
      req.body.deceasedParent = null;
    }
    let imageUrl = null;
    if (req.file) {
      imageUrl = req.file.path;
    }
    const orphan = await Orphan.create({
      name,
      dob,
      age,
      gender,
      orphanType,
      deceasedParent,
      description,
      image: imageUrl,
      imagePublicId: req.file ? req.file.filename : null,
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
      "name email",
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
    const orphan = await Orphan.findById(req.params.id);

    if (!orphan) {
      return res.status(404).json({
        success: false,
        message: "Orphan not found",
      });
    }

    orphan.name = req.body.name || orphan.name;
    orphan.programNumber = req.body.programNumber || orphan.programNumber;
    orphan.dob = req.body.dob || orphan.dob;
    orphan.gender = req.body.gender || orphan.gender;
    orphan.description = req.body.description || orphan.description;

    if (req.file) {
      if (orphan.imagePublicId) {
        await cloudinary.uploader.destroy(orphan.imagePublicId);
      }

      orphan.image = req.file.path;
      orphan.imagePublicId = req.file.filename;
    }

    const updatedOrphan = await orphan.save();

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

// Delete orphan by ID (admin only)
exports.deleteOrphan = async (req, res) => {
  try {
    const orphan = await Orphan.findById(req.params.id);

    if (!orphan) {
      return res.status(404).json({
        success: false,
        message: "Orphan not found",
      });
    }

    // Delete image from Cloudinary
    if (orphan.imagePublicId) {
      await cloudinary.uploader.destroy(orphan.imagePublicId);
    }

    await orphan.deleteOne();

    res.json({
      success: true,
      message: "Orphan deleted successfully",
    });

  } catch (error) {
    console.error("Delete orphan error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
