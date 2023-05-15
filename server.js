require("dotenv").config();
const express = require("express");
require("express-async-errors");
const loadDB = require("./db");
const tasks = require("./routes/tasks");
const projects = require("./routes/projects");
const errorHandlerMiddleware = require("./middleware/errorHandler");

console.log("M");
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/v1/tasks", tasks);
app.use("/api/v1/projects", projects);

app.use(errorHandlerMiddleware);

const start = async () => {
  try {
    await loadDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}....`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
