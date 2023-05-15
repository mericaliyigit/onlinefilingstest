# onlinefilings
Online Filings
Task and Project api

Definition of Documents

Task
- _id: id
- name: string
- status: string from ('todo', 'done')
- startDate: Timstamp
- dueDate: Timestamp
- doneDate: Timestamp (Optional)
- project: string from (project _id) (Optional)

Project
- _id: id
- name: string
- startDate: Timestamp
- dueDate: Timestamp
- tasks: Array of (task _id's) (Optional)

There is a simple composition relation where tasks can be in at most 1 project.
Projects can have many tasks.

Adding a task to a project is possible it will override the current project of task regardless.
Deletion of task and project considers removal from the relations.

API Endpoints

**TASKS**

- GET (domain)/api/v1/tasks/
  - get all tasks based on query params
  - Support filtering by name status and project only name is case insensitive and regex match.
  - Support sorting by startDate,dueDate,doneDate can be asc desc based on - addition
  - Query params ?name=meric&sort=-startDate 
  
- POST (domain)/api/v1/tasks/ => create a new task
  - based on json payload and validators

- GET (domain)/api/v1/tasks/:id
  - get specific task with id or nothing if doesn't exists 
- PATCH (domain)/api/v1/tasks/:id
  - update specific task with id and json payload if task exists
- DELETE (domain)/api/v1/tasks/:id
  - delete task if exists

**PROJECTS**

- GET (domain)/api/v1/projects/
  - get all projects based on query params
  - Support filtering by name, name is case insensitive and regex match.
  - Support sorting by startDate,dueDate can be asc desc based on - addition
  - Query params ?name=meric&sort=-startDate 
  
- POST (domain)/api/v1/projects/ => create a new project
  - based on json payload and validators

- GET (domain)/api/v1/projects/:id
  - get specific project with id or nothing if doesn't exists 
- PATCH (domain)/api/v1/projects/:id
  - update specific project with id and json payload if project exists
- DELETE (domain)/api/v1/projects/:id
  - delete project if exists
- POST (domain)/api/v1/projects/:id
  - add a task to a project with id
