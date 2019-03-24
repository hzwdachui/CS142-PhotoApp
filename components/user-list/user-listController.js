'use strict';

cs142App.controller('UserListController', ['$scope', '$resource', '$rootScope',
    function ($scope, $resource, $rootScope) {
        $scope.main.title = "Users";
        $scope.main.userList = {};
        $rootScope.content_name = "User List";
        // using $resource service
        var obj = $resource('user/list');
        // I have query method after using $resource
        // get users
        var users = obj.query({},
            function () {
                $scope.main.userList = users;
                $scope.main.otherUserList = $scope.main.userList.filter(function (u) {
                    return u._id !== $scope.main.login_user._id;
                });
            });
        // watch and show activity

        $scope.$on('new_activity', function () {
            var user = $resource('/user/:id').get({
                id: $scope.main.login_user._id
            }, function () {
                $scope.main.login_user = user;
            });
        });

    }]);




