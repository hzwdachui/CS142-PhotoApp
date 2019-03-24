'use strict';

cs142App.controller('LoginRegisterController', ['$scope', '$resource', '$location', '$rootScope',
    function ($scope, $resource, $location, $rootScope) {
        $scope.submitLogin = function () {
            var res = $resource('/admin/login');
            res.save({
                login_name: $scope.main.login_name,
                password: $scope.main.login_password
            },
                function (user) {
                    $scope.main.isLoggedIn = true;
                    $rootScope.greeting = "Hi, " + user.first_name;
                    $scope.main.login_user = user;
                    $rootScope.$broadcast("logged_in");
                    $location.path("/users/" + user._id);
                }, function (err) {
                    // handler err cases
                    if (err.data === "Invalid Username") {
                        // no such user
                        alert("No such user");
                        document.getElementById("log").style.background = "yellow";
                    } else if (err.data === "Password does not match") {
                        alert("Password does not match");
                        document.getElementById("pwd").style.background = "yellow";
                    } else if (err.data === "An Error Occurred") {
                        alert("An Error Occurred");
                    }
                });
        };

        $scope.submitSignUp = function () {
            if ($scope.register.password1 !== $scope.register.password2) {
                alert("The identical password is needed"+ $scope.register.password1+ "--" + $scope.register.password2);
                return;
            }
            var res = $resource('/user');
            res.save({
                login_name: $scope.register.newName,
                password: $scope.register.password1,
                first_name: $scope.register.first_name,
                last_name: $scope.register.last_name,
                location: $scope.register.location,
                description: $scope.register.description,
                occupation: $scope.register.occupation,
                activity: "Sign up a new account"
            }, function (user) {
                alert("Now you can log in");
                //clear register form input
                $scope.register.toRegister = false;
                $scope.register.newName = "";
                $scope.register.password1 = "";
                $scope.register.password2 = "";
                $scope.register.first_name = "";
                $scope.register.last_name = "";
                $scope.register.location = "";
                $scope.register.description = "";
                $scope.register.occupation = "";
                // $location.path("/users/" + user._id);
                // $scope.main.isLoggedIn = true;
            }, function (err) {
                // when the new user create a invalid account
                // required part are undefined
                // passwords are different
                // user name have been taken
                console.log("sign up error");
                if (err.data === "All required information should be filled in") {
                    alert("All required information should be filled in");
                    return;
                } else if (err.data === "Username exists") {
                    alert("Username exists");
                    return;
                } else if (err.data === "Create Error") {
                    alert("Create Error");
                    return;
                } else if (err.data === "Database Error") {
                    alert("Database Error");
                    return;
                }
            });
        };
    }]);

