const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
// const {
//   createProgram,
//   getPrograms,
//   getProgramById,
// } = require("../controllers/programController");
const programController = require("../controllers/programController");

const { createProgram, getPrograms, getProgramById, updateProgram, deleteProgram } = programController;

const { protect, admin } = require("../middleware/auth");

router.route("/").post(protect, admin, upload.single('image'), createProgram).get(getPrograms);

router.route("/:id").get(getProgramById).put(protect, admin, upload.single('image'), updateProgram).delete(protect, admin, deleteProgram);


module.exports = router;
