export const fetchProjects = async () => {
  const url = "http://localhost:3000/api/v1/projects/";
  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.log(error);
  }
  const j = await response.json();
  return j.projects;
};

export const fetchTasks = async (project_id) => {
  const url = `http://localhost:3000/api/v1/tasks/?project=${project_id}`;
  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.log(error);
  }
  const j = await response.json();
  return j.tasks;
};

export const createProject = async (payload) => {
  console.log("Got it!", payload);
  const url = "http://localhost:3000/api/v1/projects/";
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.log(error);
  }
  const j = await response.json();
  console.log(j);
};

export const assignTaskToProject = async (task_id, project_id) => {
  const url = `http://localhost:3000/api/v1/projects/${project_id}`;
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ task_id: task_id }),
    });
  } catch (error) {
    console.log(error);
  }
  const j = await response.json();
  console.log("Task assign", j);
  return j;
};

export const createTask = async (task, project_id) => {
  console.log("Got it!", task, project_id);
  const url = "http://localhost:3000/api/v1/tasks/";
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(task),
    });
  } catch (error) {
    console.log(error);
  }
  if (response.status !== 201) {
    console.log("Ups");
  }
  const j = await response.json();
  const assign = await assignTaskToProject(j.id, project_id);
  console.log(assign);
};
