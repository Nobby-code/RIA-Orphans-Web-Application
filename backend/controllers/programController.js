const Program = require("../models/Program");

// @desc   Create program
// @route  POST /api/programs
// @access Private (Admin)
exports.createProgram = async (req, res) => {
  try {
    const { title, description, startDate, endDate } = req.body;
    const image = req.file ? req.file.path : null;
    const program = await Program.create({
      title,
      description,
      startDate,
      endDate,
      image,
      createdBy: req.user._id,
    });

    // res.status(201).json(program);
    res.status(201).json({ success: true, data: program });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc   Get all programs
// @route  GET /api/programs
// @access Public
exports.getPrograms = async (req, res) => {
  try {
    const programs = await Program.find().sort({ createdAt: -1 });
    res.json({ success: true, data: programs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get single program
// @route  GET /api/programs/:id
// @access Public
exports.getProgramById = async (req, res) => {
  const program = await Program.findById(req.params.id);

  if (!program) {
    return res.status(404).json({ message: "Program not found" });
  }

  res.json(program);
};

// @desc   Update program
// @route  PUT /api/programs/:id
// @access Private (Admin)
exports.updateProgram = async (req, res) => {
  const program = await Program.findById(req.params.id);

  if (!program) {
    return res.status(404).json({ message: "Program not found" });
  }

  if (req.file) {
    req.body.image = req.file.path;
  }

  const updatedProgram = await Program.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(updatedProgram);
};

// @desc   Delete program
// @route  DELETE /api/programs/:id
// @access Private (Admin)
exports.deleteProgram = async (req, res) => {
  const program = await Program.findById(req.params.id);

  if (!program) {
    return res.status(404).json({ message: "Program not found" });
  }

  await program.deleteOne();
  res.json({ message: "Program deleted successfully" });
};
