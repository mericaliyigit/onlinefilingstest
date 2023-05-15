const express = require("express");
const router = express.Router();

const {
  createProject,
  getProject,
  getProjects,
  updateProject,
  addTaskToProject,
  deleteProject,
} = require("../controllers/projectController");

router.route("/").post(createProject).get(getProjects);
router
  .route("/:id")
  .delete(deleteProject)
  .patch(updateProject)
  .get(getProject)
  .post(addTaskToProject);

module.exports = router;
