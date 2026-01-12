import express from 'express'
import schemas from '../models/schemas.js';
import passport from 'passport';
import { nanoid } from 'nanoid';
import { 
    userExists,
    generateId
} from './helpers.js';
import bcrypt from 'bcrypt';

const router = express.Router();

router.post('/login', 
    (req, res, next) => {
        passport.authenticate('local', (err, user, info) => {
            if(err) {
                return next(err);
            };
            if(!user) {
                return res.status(401).send({
                    success: false,
                    message: info?.message || 'Invalid Credentials'
                });
            }

            req.logIn(user, (err) => {
                if(err) return next(err);
                return res.status(200).send({
                    success: true,
                    message: 'Login Successful!',
                    user
                });
            });
        })(req, res, next);
    }
);

router.post('/signup', async(req, res) => {
    const { username, password, email } = req.body;
    const _id = await generateId();
    try {
        const user = await userExists(username);
        if(user) {
            res.send({
                success: false,
                message: 'User already exists!'
            });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new schemas.Users({
            _id,
            username,
            password: hashedPassword,
            email
        });
        const saveUser = await newUser.save();
        if(saveUser) {
            res.status(200).send({
                success: true,
                message: 'Account Created Successfully!'
            });
        } else {
            res.status(500).send({
                success: false,
                message: 'Error Creating Account'
            });
        }
        res.end();
    } catch(err) {
        res.send({
            success: false,
            message: err
        });
    }

});

router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if(err) return next(err);
        res.status(200).json({ success: true, message: 'Logged Out Successfully' });
    });
});

router.get('/projects', async(req, res) => {
    const { username } = req.query;
    const projects = schemas.Projects;
    const userProjects = await projects.find({username}).exec();
    res.status(200).send({
        success: true,
        message: 'Success',
        projects: userProjects
    });
});

router.post('/projects', async(req, res) => {
    const { username, projectName, projectCreationDate } = req.body;
    const projectID = nanoid();
    const newProject = new schemas.Projects({
        username,
        projectID,
        projectName,
        projectCreationDate
    });
    try {
        const saveProject = await newProject.save();
        if(saveProject) {
            res.status(200).send({
                success: true,
                message: 'Project Created',
                newProject
            });
        } else {
            res.status(500).send({
                success: false,
                message: 'Error Saving Project'
            })
        }
        res.end();
    } catch(err) {
        res.status(500).send({
            success: false,
            message: 'Error Creating Project'
        })
    }
});

router.put('/projects', async(req, res) => {
    const { projectID, projectName } = req.body;
    const projects = schemas.Projects;
    try {
        const updated = await projects.findOneAndUpdate({ projectID }, { $set: { projectName } }, { new: true });
        if(!updated) {
            res.status(404).send({
                success: false,
                message: 'Error Finding Project'
            });
        } else {
            res.status(200).send({
                success: true,
                message: 'Project Successfully Renamed'
            });
        }
        res.end();
    } catch(err) {
        res.status(500).send({
            success: false,
            message: 'Error Renaming Project'
        });
    }
});

router.delete('/projects', async(req, res) => {
    const { projectID } = req.query;
    const projects = schemas.Projects;
    const deleted = await projects.findOneAndDelete({ projectID }).exec();
    if(!deleted) {
        return res.status(400).send({ 
            success: false, 
            message: 'Error Deleting Projects'
        });
    }

    return res.status(200).send({ success: true });
})

router.get('/tasks', async(req, res) => {
    const { projectName, user } = req.query;
    const tasks = schemas.Tasks;
    const projectTasks = await tasks.find({ projectName, user }).exec();
    res.status(200).send({
        success: true,
        message: 'Success',
        tasks: projectTasks
    });
});

router.post('/tasks', async(req, res) => {
    const { user, projectName, taskType, taskCreationDate, text } = req.body;
    const taskID = nanoid();
    const newTask = new schemas.Tasks({
        user,
        projectName,
        taskID,
        taskType,
        taskCreationDate,
        taskCompletionDate: '',
        text
    });
    try {
        const saveTask = await newTask.save();
        if(saveTask) {
            res.status(200).send({
                success: true,
                message: 'Task Successfully Created',
                newTask
            });
        } else {
            res.status(404).send({
                success: false,
                message: 'Task Not Found'
            });
        }
        res.end();
    } catch(err) {
        res.status(500).send({
            success: false,
            message: 'Error Creating Task'
        });
    }
});

router.delete('/tasks', async(req, res) => {
    const { id } = req.query;
    const taskIDs = Array.isArray(req.query['taskIDs[]']) ? req.query['taskIDs[]'] : [req.query['taskIDs[]']];
    const tasks = schemas.Tasks;
    try {
        if(id) {
            const deleted = await tasks.findOneAndDelete({ taskID: id });
            if(!deleted) {
                res.status(404).send({
                    success: false,
                    message: 'Error Finding Task'
                })
            }
        } else {
            for(let taskID of taskIDs) {
                const deleted = await tasks.findOneAndDelete({ taskID });
                if(!deleted) {
                    res.status(404).send({
                        success: false,
                        message: 'Task Not Found'
                    })
                }
            }
        }
        res.status(200).send({
            success: true,
            message: 'Task Successfully Deleted'
        });
        res.end();
    } catch(err) {
        res.status(500).send({
            success: false,
            message: 'Error Retrieving and Deleting task'
        })
    }
});

router.put('/tasks', async(req, res) => {
    const { searchType, targetField } = req.body;
    if(searchType !== 'username') {
        const { taskCompletionDate, taskIDs } = req.body;
        const tasks = schemas.Tasks;
        try {
            for(let taskID of taskIDs) {
                const updated = await tasks.findOneAndUpdate({ taskID }, { $set: { taskCompletionDate } }, { new: true });
                if(!updated) {
                    res.status(404).send({
                        success: false,
                        message: 'Task Not Found'
                    });
                }
            }
            return res.status(200).send({
                success: true,
                message: 'Task Successfully Updated'
            });
        } catch(err) {
            res.status(404).send({
                success: false,
                message: "Error Updating Task"
            });
        }
    }
    if(targetField === 'projectName') {
        const { user, projectName, newName } = req.body;
        const tasks = schemas.Tasks;
        try {
            const updated = await tasks.updateMany({ user, projectName }, { $set: { projectName: newName } }, { new: true });
            if(!updated) {
                res.status(404).send({
                    success: false,
                    message: 'Task Not Found'
                });
            }
            res.status(200).send({
                success: true,
                message: 'Task Successfully Updated'
            });
            res.end();
        } catch(err) {
            res.status(404).send({
                success: false,
                message: "Error Updating Task"
            });
        }
    } else {
        const { newText, taskID } = req.body;
        const tasks = schemas.Tasks;
        try {
            const updated = await tasks.findOneAndUpdate({ taskID }, { $set: { text: newText } }, { new: true });
            if(!updated) {
                res.status(404).send({
                    success: false,
                    message: 'Error Finding Task'
                })
            }
            res.status(200).send({
                success: true,
                message: 'Task Updated Successfully'
            })
        } catch(err) {
            res.status(500).send({
                success: false,
                message: "Error Updating Task"
            });
        }
    }
});

router.get('/test', async(req, res) => {
    res.status(200).send('Server is running');
})

export default router;