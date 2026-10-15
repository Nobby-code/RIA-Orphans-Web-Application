const Event = require("../models/Event");

// @desc   Create event
// @route  POST /api/events
// @access Private (Admin)

exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      eventDate,
      program,
    } = req.body;

    // Validate required fields
    if (!title?.trim() || !description?.trim() || !eventDate) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and event date are required.",
      });
    }

    // Validate event date
    const parsedDate = new Date(eventDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid event date.",
      });
    }

    const eventData = {
      title: title.trim(),
      description: description.trim(),
      location: location?.trim() || "",
      eventDate: parsedDate,
      image: req.file ? req.file.path : null,
      createdBy: req.user._id,
    };

    // Link the event to a program only when one is selected
    if (program) {
      eventData.program = program;
    }

    const event = await Event.create(eventData);

    // Return the saved event with its linked program
    const savedEvent = await Event.findById(event._id)
      .populate("program", "title");

    return res.status(201).json({
      success: true,
      message: "Event created successfully.",
      data: savedEvent,
    });
  } catch (error) {
    console.error("Create event error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create event.",
    });
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
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const { title, description, location, eventDate, program } = req.body;

    const updateFields = {};

    if (title !== undefined) updateFields.title = title.trim();
    if (description !== undefined) {
      updateFields.description = description.trim();
    }
    if (location !== undefined) updateFields.location = location.trim();

    if (eventDate !== undefined) {
      const parsedDate = new Date(eventDate);

      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid event date.",
        });
      }

      updateFields.eventDate = parsedDate;
    }

    if (req.file) {
      updateFields.image = req.file.path;
    }

    const updateOperation = { $set: updateFields };

    if (program !== undefined) {
      if (program === "") {
        updateOperation.$unset = { program: 1 };
      } else {
        updateFields.program = program;
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      updateOperation,
      {
        new: true,
        runValidators: true,
      }
    ).populate("program", "title");

    return res.json({
      success: true,
      message: "Event updated successfully.",
      data: updatedEvent,
    });
  } catch (error) {
    console.error("Update event error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update event.",
    });
  }
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
