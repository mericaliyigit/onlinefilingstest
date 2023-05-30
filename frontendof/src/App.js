import "./App.css";
import { useEffect, useState } from "react";
import {
  fetchProjects,
  fetchTasks,
  createProject,
  createTask,
} from "./network";

function App() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState({ id: "", name: "" });
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleSelectProject = (project) => {
    console.log("I will select", project);
    setSelectedProject(project);
  };

  const getProjects = async () => {
    const proj = await fetchProjects();
    setProjects(proj);
  };

  const setInterfaceDirty = () => {
    setLastUpdated(new Date());
  };

  useEffect(() => {
    getProjects();
  }, [lastUpdated]);

  return (
    <div className="app">
      <div className="main-container">
        {/* {JSON.stringify(lastUpdated)} */}
        <div className="left">
          <Projects
            projects={projects}
            selectProject={handleSelectProject}
            interfaceDirty={setInterfaceDirty}
          />
        </div>
        <div className="right">
          <Tasks activeProjectID={selectedProject} />
        </div>
      </div>
    </div>
  );
}

const Projects = ({ projects, selectProject, interfaceDirty }) => {
  return (
    <div
      style={{
        backgroundColor: "whitesmoke",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        paddingLeft: "20px",
      }}
    >
      <h1>Projects</h1>
      {projects &&
        projects.map((project) => {
          console.log(project.tasks.length);
          return (
            <div
              key={project._id}
              className="proj"
              onClick={() =>
                selectProject({ id: project._id, name: project.name })
              }
            >
              <h3>
                {project.name}
                {project.tasks.length !== 0 && project.tasks.length}{" "}
              </h3>
            </div>
          );
        })}
      <ProjectCreator
        createProject={createProject}
        interfaceDirty={interfaceDirty}
      />
    </div>
  );
};

const ProjectCreator = ({ createProject, interfaceDirty }) => {
  const handleCreateProject = async () => {
    const projectName = prompt("Enter Project name");
    if (!projectName) {
      return;
    }
    console.log(projectName);
    const today = new Date();
    const res = await createProject({
      name: projectName,
      startDate: today,
      dueDate: today,
    });
    interfaceDirty();
    console.log(res);
  };

  return (
    <div className="proj" onClick={handleCreateProject}>
      <h3>Add project + </h3>
    </div>
  );
};

const Tasks = ({ activeProjectID }) => {
  console.log(activeProjectID);
  const today = JSON.stringify(new Date()).split("T")[0];
  const [tasks, setTasks] = useState([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(new Date());

  console.log("render");

  const getTasks = async () => {
    const ts = await fetchTasks(activeProjectID.id);
    setTasks(ts);
  };

  const setDirty = () => {
    setLastUpdatedAt(new Date());
  };

  function sameDay(d1, d2) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  const prettyDate = (dates) => {
    const theDate = new Date(dates);
    const today = new Date();
    if (sameDay(theDate, today)) {
      return "Today";
    }
    return dates.split("T")[0];
  };

  useEffect(() => {
    getTasks(activeProjectID);
  }, [activeProjectID, lastUpdatedAt]);

  return (
    <div>
      <h1>{activeProjectID.name}</h1>
      {tasks &&
        tasks.map((task) => {
          return (
            <div
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
              key={task._id}
              className="proj"
            >
              <input
                style={{ width: "40px", height: "40px", borderRadius: "1rem" }}
                type="radio"
                name=""
                id=""
              />
              <div>
                <h3>{task.name}</h3>
                <h3>{prettyDate(task.dueDate)}</h3>
              </div>
            </div>
          );
        })}
      <TaskCreator
        createTask={createTask}
        activeProjectID={activeProjectID}
        setDirty={setDirty}
      />
    </div>
  );
};

const TaskCreator = ({ createTask, activeProjectID, setDirty }) => {
  const handleCreateTask = async () => {
    const taskName = prompt("Enter Task name");
    if (!taskName) {
      return;
    }
    console.log(taskName);
    const today = new Date();
    const res = await createTask(
      {
        name: taskName,
        startDate: today,
        dueDate: today,
        status: "todo",
      },
      activeProjectID.id
    );
    console.log(res);
    console.log("ye");
    setDirty();
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        border: "none",
        background: "none",
      }}
      className="proj"
      onClick={handleCreateTask}
    >
      <button style={{ color: "red", width: "40px", height: "40px" }}>+</button>
      <h3>Add task</h3>
    </div>
  );
};

export default App;
