"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */
// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');

var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var fs = require('fs');
var mongoose = require('mongoose');
var async = require('async');
var express = require('express');
var app = express();

mongoose.connect('mongodb://localhost/cs142project6');

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));
app.use(session({ 
    secret: 'secretKey', 
    resave: false, 
    saveUninitialized: false }));
app.use(bodyParser.json());

app.get('/', function (request, response) {
    response.send('Simple web server of files from ' + __dirname);
});

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    if (!request.session.isLoggedIn) {
        console.log("Please logged in first!");
        response.status(401).send("Please logged in first!");
        return;
    }
    console.log('/test called with param1 = ', request.params.p1);

    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }

            // We got the object - return it in JSON format.
            console.log('SchemaInfo', info[0]);
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections. That is tricky to do so we use the async package
        // do the work.  We put the collections into array and use async.each to
        // do each .count() query.
        var collections = [
            { name: 'user', collection: User },
            { name: 'photo', collection: Photo },
            { name: 'schemaInfo', collection: SchemaInfo }
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.count({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));

            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function (request, response) {
    // if not logged in
    if (!request.session.isLoggedIn) {
        response.status(401).send("not log in");
        return;
    }
    var userList = [];
    User.find({}, function (err, users) {
        if (err) {
            response.status(500).send(JSON.stringify(err));
            return;
        }
        if (users.length === 0) {
            response.status(500).send('Missing SchemaInfo');
            return;
        }
        users = JSON.parse(JSON.stringify(users));

        for (var i = 0; i < users.length; i++) {
            var obj = {
                _id: users[i]._id,
                first_name: users[i].first_name,
                last_name: users[i].last_name,
                location: users[i].location,
                description: users[i].description,
                occupation: users[i].occupation,
                activity: users[i].activity,
                recent_photo: users[i].recent_photo,

            };
            userList.push(obj);
        }
        response.status(200).send(userList);
    });
});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', function (request, response) {
    if (!request.session.isLoggedIn) {
        response.status(401).send("not log in");
        return;
    }

    var id = request.params.id;
    // know the id, to find the correspond user
    User.findOne({ _id: id }, function (err, user) {
        if (err) {
            response.status(400).send('error');
            return;
        } if (user === null) {
            response.status(400).send('Not found');
            return;
        }
        var userDetail = JSON.parse(JSON.stringify(user));
        var obj = {
            _id: userDetail._id,
            first_name: userDetail.first_name,
            last_name: userDetail.last_name,
            location: userDetail.location,
            description: userDetail.description,
            occupation: userDetail.occupation,
            activity: userDetail.activity,
            recent_photo: userDetail.recent_photo
        };
        response.status(200).send(obj);
    });
});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id', function (request, response) {
    // if not logged in
    if (!request.session.isLoggedIn) {
        response.status(401).send("not log in");
        return;
    }

    var id = request.params.id;
    Photo.find({
        user_id: id
    }, function (err, photos) {
        if (err) {
            response.status(400).send('error');
            return;
        }

        photos = JSON.parse(JSON.stringify(photos));
        async.each(photos, function (photo, callback) {
            async.each(photo.comments, function (comment, done_callback) {
                User.findOne({ _id: comment.user_id }, function (err, user) {
                    if (err) {
                        response.state(400).send(JSON.stringify(err));
                        return;
                    } if (user === null) {
                        response.state(400).send(JSON.stringify('User with _id:' + id + ' not found.'));
                        return;
                    }
                    // find user of each comment
                    // call will be done later with async calls
                    user = JSON.parse(JSON.stringify(user));

                    comment.user = {
                        _id: user._id,
                        first_name: user.first_name,
                        last_name: user.last_name
                    };
                    delete comment.user_id;
                    done_callback(err);
                });
            }, function (err) {
                if (err) {
                    response.status(500).send(JSON.stringify(err));
                    return;
                }
                delete photo.__v;
                callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
                return;
            }
            response.status(200).send(photos);
        });
    });
});

/* a user log in*/
app.post('/admin/login', function (request, response) {
    var login_name = request.body.login_name;
    var password = request.body.password;

    User.findOne({
        login_name: login_name
    }, function (err, user) {
        if (err) {
            console.log("login err");
            response.status(400).send("login err");
            return;
        } if (user === null) {
            console.log("Invalid Username");
            response.status(400).send("Invalid Username");
            return;
        } if (password !== user.password) {
            console.log("Password does not match");
            response.status(400).send("Password does not match");
            return;
        }
        user.activity = "logged in";
        user.save();
        request.session.user_id = user._id;
        request.session.isLoggedIn = true;
        request.session.login_name = login_name;
        //request.session.user = user;
        response.status(200).send(user);
    });
});

/* current user log out  
change all states into unlogged
and redirect to the login page*/
app.post('/admin/logout', function (request, response) {
    // not currently log in
    if (!request.session.isLoggedIn) {
        response.status(401).send('not log in');
        return;
    }
    var userId = request.session.user_id;
    User.findOne({
        _id: userId
    }, function (err, user) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (user.length === 0) {
            response.status(400).send("No such user");
            return;
        }
        user.activity = "logged out";
        user.save();
    });
    // if is logged in, log out
    delete request.session.isLoggedIn;
    delete request.session.login_name;
    delete request.session.user_id;
    request.session.destroy(function (err) {
        if (err) {
            response.status(400).send('error');
            return;
        }
        response.status(200).send('Logged out');
    });
});

/* sign up as a new user */
app.post('/user', function (request, response) {

    // send this to the controller so that it will handle err
    if (request.body.login_name === undefined || request.body.password === undefined ||
        request.body.first_name === undefined || request.body.last_name === undefined) {
        response.status(400).send('All required information should be filled in');
        return;
    }

    User.findOne({
        login_name: request.body.login_name
    }, function (err, user) {
        if (err) {
            response.status(400).send('Database Error');
            return;
        }
        if (user) {
            response.status(400).send('Username exists');
            return;
        }
        User.create({
            login_name: request.body.login_name,
            password: request.body.password,
            first_name: request.body.first_name,
            last_name: request.body.last_name,
            location: request.body.location,
            occupation: request.body.occupation,
            description: request.body.description,
            activity: request.body.activity,
        }, function (err, user) {
            if (err) {
                response.status(400).send('Create Error');
                return;
            }
            user.id = user._id;
            request.session.isLoggedIn = true;
            user.save();
            request.session.user = user;
            response.status(200).send(user);
        });

    });
});

/* user adds comments */
app.post('/commentsOfPhoto/:photo_id', function (request, response) {
    if (!request.session.isLoggedIn) {
        response.status(401).send('"not log in"');
        return;
    }

    var photoId = request.params.photo_id;
    var userId = request.session.user_id;
    var comment = request.body.comment;
    // this must be put outside 
    if (!comment || comment === "") {
        response.status(400).send('Empty Comments');
        return;
    }
    Photo.findOne({
        _id: photoId
    }, function (err, photo) {
        if (err) {
            response.status(400).send('An Error Occoured');
            return;
        } if (photo === null) {
            response.status(400).send('Invalid Photo Id');
            return;
        }
        // add to the comments list
        photo.comments.push({
            comment: comment,
            user_id: userId
        });
        photo.set({
            comments: photo.comments
        });

        photo.save();

    });

    User.findOne({ _id: userId }, function (err, user) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        } if (user === 0) {
            response.status(400).send('No such user');
            return;
        }
        user.activity = "commented";
        user.save();
        response.status(200).send("Successfully Commented");
    });

});

/* user add new photos */
var processFormBody = multer({ storage: multer.memoryStorage() }).single('uploadedphoto');
app.post('/photos/new',function(request,response){
    if (!request.session.isLoggedIn) {
        response.status(401).send('"not log in"');
        return;
    }

    processFormBody(request, response, function (err) {
        if (err || !request.file) {
            response.status(400).send("Error: No file specified!");
            return;
        }

        // We need to create the file in the directory "images" under an unique name. We make
        // the original file name unique by adding a unique prefix with a timestamp.
        var timestamp = new Date().valueOf();
        var filename = 'U' +  String(timestamp) + request.file.originalname;

        fs.writeFile("./images/" + filename, request.file.buffer, function (err) {
            // Once you have the file written into your images directory under the name
            // filename you can create the Photo object in the database
            if (err) {
                console.log("1");
                response.status(500).end('Saving file failed.');
                return;
            }
            Photo.create({
                file_name: filename,
                user_id: request.session.user_id,
                comments: [],
                //date_time: new Date()
            }, function (err, photo) {
                if (err) {
                    console.log("2");
                    response.status(400).send("creating error");
                    return;
                }
                console.log('Photo created successfully');
                photo.save();
            });
        });
        User.findOne({ _id: request.session.user_id }, function (err, user) {
            if (err) {
                console.log("3");
                response.status(400).send(JSON.stringify(err));
                return;
            } if (user === 0) {
                console.log('No such user');
                response.status(400).send('No such user');
                return;
            }
            
            user.activity = "added photo";
            user.recent_photo = filename;
            user.save();
            response.status(200).send();
        });
    });
});

/* delete photos */
app.post('/deletePhoto/:photo_id', function (request, response) {
    if (!request.session.isLoggedIn) {
        response.status(401).send('not log in');
        return;
    }

    Photo.findOne({
        _id: request.params.photo_id
    }, function (err, photo) {
        if (err) {
            console.log("1");
            response.status(400).send('An Error Occoured');
            return;
        }
        if (photo === null) {
            console.log("2");
            response.status(400).send('Inalid photo_id');
            return;
        }
        if (photo.user_id === request.session.user_id) {
            console.log("3");
            response.status(400).send('No Authority: ' + photo.user_id + " != " + request.session.user._id);
            return;
        }

        Photo.remove({
            _id: request.params.photo_id
        }, function (err) {
            if (err) {
                response.status(400).send(JSON.stringify(err));
                return;
            }
            response.status(200).send();
        });

    });
});

/* user delete comment */
app.post('/deleteComment/:photo_id', function (request, response) {
    if (!request.session.isLoggedIn) {
        response.status(401).send('"not log in"');
        return;
    }
    var photoId = request.params.photo_id;
    var comment = request.body.comment;

    Photo.findOne({
        _id: photoId
    }, function (err, photo) {
        if (err) {
            response.status(400).send("Delete comment error");
            return;
        }
        if (photo === null) {
            response.status(400).send('Inalid photo_id');
            return;
        }
        if (comment.user._id !== request.session.user_id) {
            response.status(400).send('No authority');
            return;
        }

        const size = photo.comments.length;
        var temp = [];
        for (var i = 0; i < size; i++) {
            // must change to string here 
            if (String(photo.comments[i]._id) !== String(comment._id)) {
                temp = temp.concat([photo.comments[i]]);
            }
        }
        photo.comments = temp;
        photo.save();
        response.status(200).send(photo);

    });
});


/* delete users account */
app.post('/delete/:id', function (request, response) {
    if (!request.session.isLoggedIn) {
        response.status(401).send('not log in');
        return;
    }

    var userId = request.params.id;
    if (String(userId) !== String(request.session.user_id)) {
        response.status(400).send("No authority");
        return;
    }

    Photo.remove({
        user_id: userId
    }, function (err) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
    });
    // remove comments of this user
    Photo.find({}, function (err, photos) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        for (var i = 0; i < photos.length; i++) {
            photos[i].comments = photos[i].comments.filter(function (comment) {
                return String(comment.user_id) !== String(userId);
            });
            photos[i].save();
        }
    });

    User.remove({
        _id: userId
    }, function (err, user) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (user === null) {
            response.status(400).send('No such user');
            return;
        }
        request.session.destroy(function (err) {
            if (err) {
                response.status(400).send();
                return;
            }
            response.status(200).send();
        });
    });
});

/* add likes and remove likes*/
app.post('/like/:photo_id', function (request, response) {
    if (!request.session.isLoggedIn) {
        response.status(401).send('not log in');
        return;
    }

    Photo.findOne({
         _id: request.params.photo_id 
        }, function (err, photo) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (photo === null) {
            console.log("No such photo");
            response.status(400).send("No such photo");
        }
        var index = photo.likes_ids.indexOf(request.session.user_id);
        if (index === -1) {
            photo.like_count++;
            photo.likes_ids = photo.likes_ids.concat([request.session.user_id]);
            photo.save();
            response.status(200).send("Liked");
        } else {
            photo.like_count--;
            photo.likes_ids.splice(index, 1);
            photo.save();
            response.status(200).send("Disliked");
        }
    });
});


var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});
