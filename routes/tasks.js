var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Task = require('../models/task');
var User = require('../models/user');
var parseJsonQuery = require('../middleware/parseJsonQuery');
var buildQuery = require('../utils/buildQuery');
var apiResponse = require('../utils/apiResponse');

router.use(parseJsonQuery);

router.get('/', async function(req, res, next) {
    try {
        var result = await buildQuery(Task, req.parsedQuery, 100);
        return apiResponse.success(res, 200, 'OK', result);
    } catch (err) {
        next(err);
    }
});

router.post('/', async function(req, res, next) {
    try {
        if (!req.body.name || !req.body.deadline) {
            return apiResponse.error(res, 400, 'Name and deadline are required', {
                error: 'Missing required fields: name and/or deadline'
            });
        }
        
        var assignedUserName = 'unassigned';
        var assignedUser = req.body.assignedUser || '';
        
        if (assignedUser) {
            var user = await User.findById(assignedUser);
            if (!user) {
                return apiResponse.error(res, 400, 'Invalid assigned user', {
                    error: 'The assigned user does not exist'
                });
            }
            assignedUserName = user.name;
        }
        
        var taskData = {
            name: req.body.name,
            description: req.body.description || '',
            deadline: req.body.deadline,
            completed: req.body.completed !== undefined ? req.body.completed : false,
            assignedUser: assignedUser,
            assignedUserName: assignedUserName
        };
        
        var task = new Task(taskData);
        var savedTask = await task.save();
        
        if (assignedUser && !savedTask.completed) {
            await User.findByIdAndUpdate(assignedUser, {
                $addToSet: { pendingTasks: savedTask._id.toString() }
            });
        }
        
        return apiResponse.success(res, 201, 'Created', savedTask);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', async function(req, res, next) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return apiResponse.error(res, 400, 'Invalid ID format', {
                error: 'The provided ID is not valid'
            });
        }
        
        var query = Task.findById(req.params.id);
        
        if (req.parsedQuery.select) {
            query = query.select(req.parsedQuery.select);
        }
        
        var task = await query.exec();
        
        if (!task) {
            return apiResponse.error(res, 404, 'Task not found', {
                error: 'No task found with the provided ID'
            });
        }
        
        return apiResponse.success(res, 200, 'OK', task);
    } catch (err) {
        next(err);
    }
});

router.put('/:id', async function(req, res, next) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return apiResponse.error(res, 400, 'Invalid ID format', {
                error: 'The provided ID is not valid'
            });
        }
        
        if (!req.body.name || !req.body.deadline) {
            return apiResponse.error(res, 400, 'Name and deadline are required', {
                error: 'Missing required fields: name and/or deadline'
            });
        }
        
        var existingTask = await Task.findById(req.params.id);
        if (!existingTask) {
            return apiResponse.error(res, 404, 'Task not found', {
                error: 'No task found with the provided ID'
            });
        }
        
        var oldAssignedUser = existingTask.assignedUser || '';
        var oldCompleted = existingTask.completed || false;
        var newAssignedUser = req.body.assignedUser || '';
        var newCompleted = req.body.completed !== undefined ? req.body.completed : false;
        
        var assignedUserName = 'unassigned';
        if (newAssignedUser) {
            var user = await User.findById(newAssignedUser);
            if (!user) {
                return apiResponse.error(res, 400, 'Invalid assigned user', {
                    error: 'The assigned user does not exist'
                });
            }
            assignedUserName = user.name;
        }
        
        var taskData = {
            name: req.body.name,
            description: req.body.description || '',
            deadline: req.body.deadline,
            completed: newCompleted,
            assignedUser: newAssignedUser,
            assignedUserName: assignedUserName
        };
        
        var updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            taskData,
            { new: true, runValidators: true }
        );
        
        if (oldAssignedUser !== newAssignedUser) {
            if (oldAssignedUser) {
                await User.findByIdAndUpdate(oldAssignedUser, {
                    $pull: { pendingTasks: req.params.id }
                });
            }
            
            if (newAssignedUser && !newCompleted) {
                await User.findByIdAndUpdate(newAssignedUser, {
                    $addToSet: { pendingTasks: req.params.id }
                });
            }
        } else if (oldAssignedUser && oldAssignedUser === newAssignedUser) {
            if (oldCompleted !== newCompleted) {
                if (newCompleted) {
                    await User.findByIdAndUpdate(newAssignedUser, {
                        $pull: { pendingTasks: req.params.id }
                    });
                } else {
                    await User.findByIdAndUpdate(newAssignedUser, {
                        $addToSet: { pendingTasks: req.params.id }
                    });
                }
            }
        }
        
        return apiResponse.success(res, 200, 'OK', updatedTask);
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', async function(req, res, next) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return apiResponse.error(res, 400, 'Invalid ID format', {
                error: 'The provided ID is not valid'
            });
        }
        
        var task = await Task.findById(req.params.id);
        if (!task) {
            return apiResponse.error(res, 404, 'Task not found', {
                error: 'No task found with the provided ID'
            });
        }
        
        if (task.assignedUser) {
            await User.findByIdAndUpdate(task.assignedUser, {
                $pull: { pendingTasks: req.params.id }
            });
        }
        
        await Task.findByIdAndDelete(req.params.id);
        
        return apiResponse.success(res, 200, 'OK', {});
    } catch (err) {
        next(err);
    }
});

module.exports = router;

