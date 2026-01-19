const express = require("express");
const upload = require("../middleware/upload");
const router = express.Router();
const {
  createEvent,
  getEvents,
  getEventById,
  deleteEvent,
  updateEvent
} = require("../controllers/eventController");

const { protect, admin } = require("../middleware/auth");

router.route("/").post(protect, admin, upload.single("image"), createEvent).get(getEvents);

router.route("/:id").get(getEventById);
router.route("/:id").delete(protect, admin, deleteEvent);
router.route("/:id").put(protect, admin, upload.single("image"), updateEvent);
module.exports = router;
