const loadDB = require("../db");
const { ValidationError } = require("../errors");
const ObjectId = require("mongodb").ObjectId;
const { isValidDate } = require("../helpers");

const exampleTask = {
  startDate: "2023-05-14T11:00:26.600Z",
  dueDate: "2023-05-16T11:00:26.600Z",
  doneDate: "2023-05-15T11:00:26.600Z",
  status: "done",
  name: "Do onlineFilings test",
  project: "646206c376ad5822fd613a31",
};

// validate the integrity of data before creating / updating anything
const createValidate = (body) => {
  const { name, status, startDate, dueDate, doneDate } = body;

  if (!name || !status || !startDate || !dueDate) {
    throw new ValidationError("Missing params");
  }

  if (name === "") {
    throw new ValidationError("Invalid name");
  }

  if (status === "" || !["done", "todo"].includes(status)) {
    throw new ValidationError("Invalid status");
  }

  if (status === "done" && !doneDate) {
    throw new ValidationError("Invalid status");
  }

  if (!isValidDate(startDate)) {
    throw new ValidationError("Invalid date format");
  }
  if (!isValidDate(dueDate)) {
    throw new ValidationError("Invalid date format");
  }
  const start = new Date(startDate);
  const due = new Date(dueDate);
  if (due < start) {
    throw new ValidationError("Invalid dates");
  }
  if (doneDate) {
    if (!isValidDate(doneDate)) {
      throw new ValidationError("Invalid date format");
    }
    if (status !== "done") {
      throw new ValidationError("Invalid status");
    }
    const done = new Date(doneDate);
    if (done < start || due < done) {
      throw new ValidationError("Invalid dates");
    }
  }
  return body;
};

const updateValidate = (body) => {
  const { name, status, doneDate } = body;

  if (name) {
    if (name === "") {
      throw new ValidationError("Invalid name");
    }
  }
  if (status) {
    if (status === "" || !["done", "todo"].includes(status)) {
      throw new ValidationError("Invalid status");
    }
  }
  if (doneDate && !isValidDate(doneDate)) {
    throw new ValidationError("Invalid date format");
  }
  return body;
};

// create a new task with given params
const createTask = async (req, res) => {
  const { name, status, startDate, dueDate, doneDate } = createValidate(
    req.body
  );

  const newTask = {
    name: name,
    status: status,
    startDate: startDate,
    dueDate: dueDate,
    doneDate: doneDate || null,
  };
  const db = await loadDB();
  const { insertedId } = await db.collection("tasks").insertOne(newTask);
  res
    .status(201)
    .json({ msg: "Successfully created new task", id: insertedId });
};

// get a single task with the given id
const getTask = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ msg: "Missing params" });
  }
  const db = await loadDB();
  const response = await db
    .collection("tasks")
    .findOne({ _id: new ObjectId(id) });
  if (!response) {
    return res.status(404).json({ msg: "No such task" });
  }
  return res.status(200).json(response);
};

// get all tasks following the filter and search params
const getTasks = async (req, res) => {
  const { status, name, sort, project } = req.query;
  const myQuery = {};
  if (name) {
    myQuery.name = { $regex: name, $options: "i" };
  }
  if (status) {
    myQuery.status = status;
  }
  if (project) {
    myQuery.project = project;
  }

  const mySort = {};
  if (sort) {
    sort.split(",").forEach((sortKey) => {
      const key = sortKey.replace("-", "");
      if (["startDate", "dueDate", "doneDate"].includes(key)) {
        const val = sortKey.startsWith("-") ? -1 : 1;
        mySort[key] = val;
      }
    });
  }
  const db = await loadDB();
  const response = await db.collection("tasks").find(myQuery).sort(mySort);
  const tasks = await response.toArray();
  res.status(200).json({ tasks });
};

// update a tasks name and status considering the effects of
// updating the status
const updateTask = async (req, res) => {
  const { id } = req.params;
  const { name, status, doneDate } = updateValidate(req.body);
  if (!id) {
    return res.status(400).json({ msg: "Bad request" });
  }
  const db = await loadDB();
  const dbTask = await db
    .collection("tasks")
    .findOne({ _id: new ObjectId(id) });
  if (!dbTask) {
    return res.status(404).json({ msg: "No such task" });
  }
  const myUpdates = {};
  if (name) {
    myUpdates.name = name;
  }

  if (status) {
    // status transitions
    if (dbTask.status === "todo" && status === "done") {
      // either user provide a done date or we fall back to now
      if (doneDate) {
        const done = new Date(doneDate);
        const dbStart = new Date(dbTask.startDate);
        const dbDue = new Date(dbTask.dueDate);
        if (done < dbStart || done > dbDue) {
          return res.status(400).json({ msg: "Bad request" });
        }
        myUpdates.doneDate = doneDate;
      } else {
        const now = new Date().toJSON();
        myUpdates.doneDate = now;
      }
    } else if (dbTask.status === "done" && status === "todo") {
      myUpdates.doneDate = null;
    }
    myUpdates.status = status;
  }

  await db.collection("tasks").updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...myUpdates,
      },
    }
  );
  res.status(200).json({ msg: "Successfully updated task", id: id });
};

// deletes the task with the given id also removes it from any
// projects it belongs to
const deleteTask = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ msg: "Missing params" });
  }
  const db = await loadDB();
  const dbTask = await db
    .collection("tasks")
    .findOne({ _id: new ObjectId(id) });
  if (!dbTask) {
    return res.status(404).json({ msg: "No such task" });
  }
  // we first remove the tasks id from project tasks where it exists
  const project_id = dbTask.project;
  if (project_id) {
    await db.collection("projects").updateMany(
      { _id: new ObjectId(project_id) },
      {
        $pull: {
          tasks: id,
        },
      },
      { multi: true }
    );
  }
  // then we delete the task
  await db.collection("tasks").deleteOne({ _id: new ObjectId(id) });
  return res.status(200).json({ msg: "Successfully deleted task", id: id });
};

module.exports = { createTask, getTask, getTasks, updateTask, deleteTask };
