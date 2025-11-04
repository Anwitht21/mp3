var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = require('../models/user');
var Task = require('../models/task');
var parseJsonQuery = require('../middleware/parseJsonQuery');
var buildQuery = require('../utils/buildQuery');
var apiResponse = require('../utils/apiResponse');

router.use(parseJsonQuery);

router.get('/', async function(req, res, next) {
    try {
        var result = await buildQuery(User, req.parsedQuery);
        return apiResponse.success(res, 200, 'OK', result);
    } catch (err) {
        next(err);
    }
});

router.post('/', async function(req, res, next) {
    try {
        if (!req.body.name || !req.body.email) {
            return apiResponse.error(res, 400, 'Name and email are required', {
                error: 'Missing required fields: name and/or email'
            });
        }
        
        var userData = {
            name: req.body.name,
            email: req.body.email,
            pendingTasks: req.body.pendingTasks || []
        };
        
        var user = new User(userData);
        var savedUser = await user.save();
        
        return apiResponse.success(res, 201, 'Created', savedUser);
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
        
        var query = User.findById(req.params.id);
        
        if (req.parsedQuery.select) {
            query = query.select(req.parsedQuery.select);
        }
        
        var user = await query.exec();
        
        if (!user) {
            return apiResponse.error(res, 404, 'User not found', {
                error: 'No user found with the provided ID'
            });
        }
        
        return apiResponse.success(res, 200, 'OK', user);
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
        
        if (!req.body.name || !req.body.email) {
            return apiResponse.error(res, 400, 'Name and email are required', {
                error: 'Missing required fields: name and/or email'
            });
        }
        
        var existingUser = await User.findById(req.params.id);
        if (!existingUser) {
            return apiResponse.error(res, 404, 'User not found', {
                error: 'No user found with the provided ID'
            });
        }
        
        var oldPendingTasks = existingUser.pendingTasks || [];
        var newPendingTasks = req.body.pendingTasks || [];
        
        if (newPendingTasks.length > 0) {
            var tasksExist = await Task.countDocuments({
                _id: { $in: newPendingTasks }
            });
            if (tasksExist !== newPendingTasks.length) {
                return apiResponse.error(res, 400, 'Invalid task IDs', {
                    error: 'One or more task IDs do not exist'
                });
            }
        }
        
        var tasksToAdd = newPendingTasks.filter(function(taskId) {
            return oldPendingTasks.indexOf(taskId) === -1;
        });
        var tasksToRemove = oldPendingTasks.filter(function(taskId) {
            return newPendingTasks.indexOf(taskId) === -1;
        });
        
        for (var i = 0; i < tasksToAdd.length; i++) {
            await Task.findByIdAndUpdate(tasksToAdd[i], {
                assignedUser: req.params.id,
                assignedUserName: req.body.name,
                completed: false
            });
        }
        
        for (var j = 0; j < tasksToRemove.length; j++) {
            var task = await Task.findById(tasksToRemove[j]);
            if (task && task.assignedUser === req.params.id) {
                await Task.findByIdAndUpdate(tasksToRemove[j], {
                    assignedUser: '',
                    assignedUserName: 'unassigned'
                });
            }
        }
        
        var userData = {
            name: req.body.name,
            email: req.body.email,
            pendingTasks: newPendingTasks
        };
        
        var updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            userData,
            { new: true, runValidators: true }
        );
        
        return apiResponse.success(res, 200, 'OK', updatedUser);
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
        
        var user = await User.findById(req.params.id);
        if (!user) {
            return apiResponse.error(res, 404, 'User not found', {
                error: 'No user found with the provided ID'
            });
        }
        
        await Task.updateMany(
            { assignedUser: req.params.id },
            {
                assignedUser: '',
                assignedUserName: 'unassigned'
            }
        );
        
        await User.findByIdAndDelete(req.params.id);
        
        return apiResponse.success(res, 200, 'OK', {});
    } catch (err) {
        next(err);
    }
});

module.exports = router;

