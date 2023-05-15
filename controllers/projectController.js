const loadDB = require("../db");
const { ValidationError } = require("../errors");
const ObjectId = require("mongodb").ObjectId;
const { isValidDate } = require("../helpers");

const exampleProject = {
  name: "Project",
  startDate: "2023-05-14T11:00:26.600Z",
  dueDate: "2023-05-16T11:00:26.600Z",
  tasks: [],
};

// validate the integrity of data before creating / updating anything
const createValidate = (body) => {
  const { name, startDate, dueDate } = body;

  if (!name || !startDate || !dueDate) {
    throw new ValidationError("Missing params");
  }
  if (name === "") {
    throw new ValidationError("Invalid name");
  }
  if (!isValidDate(startDate)) {
    throw new ValidationError("Invalid date format");
  }
  if (!isValidDate(dueDate)) {
    throw new ValidationError("Invalid date format");
  }
  if (new Date(dueDate) < new Date(startDate)) {
    throw new ValidationError("Invalid dates");
  }
  return body;
};

const updateValidate = (body) => {
  const { name, startDate, dueDate } = body;

  if (name) {
    if (name === "") {
      throw new ValidationError("Invalid name");
    }
  }
  if (startDate && !isValidDate(startDate)) {
    throw new ValidationError("Invalid date format");
  }

  if (dueDate && !isValidDate(dueDate)) {
    throw new ValidationError("Invalid date format");
  }
  if (startDate && dueDate) {
    if (new Date(dueDate) < new Date(startDate)) {
      throw new ValidationError("Invalid dates");
    }
  }
  return body;
};

//create a new project in the projects colleciton
const createProject = async (req, res) => {
  const { name, startDate, dueDate } = createValidate(req.body);

  const newProject = {
    name: name,
    startDate: startDate,
    dueDate: dueDate,
    tasks: [],
  };
  const db = await loadDB();
  const { insertedId } = await db.collection("projects").insertOne(newProject);
  res.status(201).json({ msg: "Successfully created project", id: insertedId });
};

// get the project with the given id
const getProject = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ msg: "Missing params" });
  }
  const db = await loadDB();
  const response = await db
    .collection("projects")
    .findOne({ _id: new ObjectId(id) });
  if (!response) {
    return res.status(404).json({ msg: "No such project" });
  }
  return res.status(200).json(response);
};

// get all projects following the filter and search params
const getProjects = async (req, res) => {
  const { name, sort } = req.query;
  const myQuery = {};
  if (name) {
    myQuery.name = { $regex: name, $options: "i" };
  }
  const mySort = {};
  if (sort) {
    sort.split(",").forEach((sortKey) => {
      const key = sortKey.replace("-", "");
      if (["startDate", "dueDate"].includes(key)) {
        const val = sortKey.startsWith("-") ? -1 : 1;
        mySort[key] = val;
      }
    });
  }

  const db = await loadDB();
  const response = await db.collection("projects").find(myQuery).sort(mySort);
  const allProjects = await response.toArray();
  res.json({ projects: allProjects });
};

// update the projects name, start and duedate properties
const updateProject = async (req, res) => {
  const { id } = req.params;
  const { name, startDate, dueDate } = updateValidate(req.body);
  if (!id) {
    return res.status(400).json({ msg: "Bad request" });
  }
  const db = await loadDB();
  const dbProject = await db
    .collection("projects")
    .findOne({ _id: new ObjectId(id) });
  if (!dbProject) {
    return res.status(404).json({ msg: "No such project" });
  }
  const myUpdates = {};
  if (name) {
    myUpdates.name = name;
  }
  // new start can't be after the due date
  if (startDate && !dueDate) {
    if (Date(startDate) > Date(dbProject.dueDate)) {
      return res.status(400).json({ msg: "Bad request" });
    }
    myUpdates.startDate = startDate;
  }
  // new due can't be before start date
  if (dueDate && !startDate) {
    if (new Date(dueDate) < new Date(dbProject.startDate)) {
      return res.status(400).json({ msg: "Bad request" });
    }
    myUpdates.dueDate = dueDate;
  }
  if (startDate && dueDate) {
    myUpdates.startDate = startDate;
    myUpdates.dueDate = dueDate;
  }

  await db.collection("projects").updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...myUpdates,
      },
    }
  );
  res.status(200).json({ msg: `Successfully updated project with id${id}` });
};

// assigns the task to a project this will do a reference assignment
// and will also update the task itself to indicate its been assigned to a project
const addTaskToProject = async (req, res) => {
  const { id } = req.params;
  const { task_id } = req.body;
  if (!id || !task_id) {
    return res.status(400).json({ msg: "Bad request" });
  }
  const db = await loadDB();

  const dbProject = await db
    .collection("projects")
    .findOne({ _id: new ObjectId(id) });
  if (!dbProject) {
    return res.status(404).json({ msg: "No such project" });
  }

  const dbTask = await db
    .collection("tasks")
    .findOne({ _id: new ObjectId(task_id) });
  if (!dbTask) {
    return res.status(404).json({ msg: "No such task" });
  }
  const projectTasks = dbProject.tasks;
  // check if its already in it
  if (!projectTasks.includes(task_id)) {
    projectTasks.push(task_id);
  }
  // update the tasks project_id
  await db.collection("tasks").updateOne(
    { _id: new ObjectId(task_id) },
    {
      $set: {
        project: id,
      },
    }
  );
  // add task to project
  await db.collection("projects").updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        tasks: projectTasks,
      },
    }
  );

  return res.status(200).json({
    msg: `Task successfully added to project`,
    task_id: task_id,
    project_id: id,
  });
};

// deletes a project with given id if any tasks depend on it
// also remove itself from their project field
const deleteProject = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ msg: "Missing params" });
  }
  const db = await loadDB();
  const dbProject = await db
    .collection("projects")
    .findOne({ _id: new ObjectId(id) });
  if (!dbProject) {
    return res.status(404).json({ msg: "No such project" });
  }
  // remove the project from tasks if any of them got it
  const ids = dbProject.tasks.map((id) => new ObjectId(id));
  if (dbProject.tasks) {
    await db.collection("tasks").updateMany(
      { _id: { $in: ids } },
      {
        $unset: {
          project: "",
        },
      },
      { multi: true }
    );
  }
  // then delete the project
  await db.collection("projects").deleteOne({ _id: new ObjectId(id) });
  return res.status(200).json({ msg: `Project with id ${id} is deleted` });
};

module.exports = {
  createProject,
  getProject,
  getProjects,
  updateProject,
  deleteProject,
  addTaskToProject,
};
