// userController.js
// Import contact model
User = require('../models/userModel');
// Handle index actions
exports.index = function (req, res) {
    User.get(function (err, users) {
        if (err) {
            res.json({
                status: "error",
                message: err,
            });
        }
        res.json({
            status: "success",
            message: "Users retrieved successfully",
            data: users
        });
    });
};
// Handle create  actions
exports.new = function (req, res) {
    var user = new User();
    user.name = req.body.name ? req.body.name : user.name;
    user.email = req.body.email;
   
    // save the contact and check for errors
    user.save(function (err) {
        // Check for validation error
        if (err)
            res.json(err);
        else
            res.json({
                message: 'New contact created!',
                data: user
            });
    });
};
// Handle view  info
exports.view = function (req, res) {
    User.findById(req.params.user_id, function (err, user) {
        if (err)
            res.send(err);
        res.json({
            message: 'User details loading..',
            data: user
        })
    })
}

// Handle update  info
exports.update = (req, res) => {
    User.findById(req.params.user_id, (err, user) => {
        if (err)
            res.send(err);
        user.name = req.body.name ? req.body.name : user.name;
        user.gender = req.body.gender;
        user.email = req.body.email;
        user.phone = req.body.phone;
        // save and check for errors
        user.save(function (err) {
            if (err)
                res.json(err);
            res.json({
                message: 'User Info updated',
                data: user
            })
        })
    })
}

// Handle delete 
exports.delete =  (req, res) => {
    User.remove({
        _id: req.params.user_id
    }, function (err, contact) {
        if (err)
            res.send(err);
        res.json({
            status: "success",
            message: 'User deleted'
        });
    });
};
