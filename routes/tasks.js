const express = require("express");
const router = express.Router();

const {
  createTask,
  getTask,
  getTasks,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

router.route("/").post(createTask).get(getTasks);
router.route("/:id").delete(deleteTask).patch(updateTask).get(getTask);

module.exports = router;
