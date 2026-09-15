const Event = require("../models/Event");

// @desc   Create event
// @route  POST /api/events
// @access Private (Admin)
exports.createEvent = async (req, res) => {
  try {
    const { title, description, location, eventDate } = req.body;
    const image = req.file ? req.file.path : null;
    const event = await Event.create({
      title,
      description,
      location,
      eventDate,
      image,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc   Get all events
// @route  GET /api/events
// @access Public
exports.getEvents = async (req, res) => {
  const events = await Event.find()
    .populate("program", "title")
    .sort({ eventDate: 1 });

  res.json({ success: true, events });
};
// @desc   Get single event
// @route  GET /api/events/:id
// @access Public   
exports.getEventById = async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate("program", "title");

  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }

  res.json(event);
};

// @desc   Update event
// @route  PUT /api/events/:id
// @access Private (Admin)
exports.updateEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }

  if (req.file) {
    req.body.image = req.file.path;
  }

  const updatedEvent = await Event.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(updatedEvent);
};

// @desc   Delete event
// @route  DELETE /api/events/:id
// @access Private (Admin)
exports.deleteEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({ success: false, message: "Event not found" });
  }

  await event.deleteOne();
  res.json({ success: true, message: "Event deleted successfully" });
};
