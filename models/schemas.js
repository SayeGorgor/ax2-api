import mongoose from 'mongoose'; 
const Schema = mongoose.Schema;

const userSchema = new Schema({
    _id: {type: String},
    username: {type: String},
    password: {type: String},
    email: {type: String},
});

const projectSchema = new Schema({
    username: {type: String},
    projectID: {type: String},
    projectName: {type: String},
    projectCreationDate: {type: String},
});

const taskSchema = new Schema({
    user: {type: String},
    projectName: {type: String},
    taskID: {type: String},
    taskType: {type: String},
    taskCreationDate: {type: String},
    taskCompletionDate: {type: String},
    text: {type: String}
});

const Users = mongoose.model('Users', userSchema, 'users');
const Projects = mongoose.model('Projects', projectSchema, 'projects');
const Tasks = mongoose.model('Tasks', taskSchema, 'tasks');
const mySchemas = {
    'Users': Users,
    'Projects': Projects,
    'Tasks': Tasks
};

export default mySchemas;