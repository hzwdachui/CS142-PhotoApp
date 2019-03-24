'use strict';

cs142App.controller('UserDetailController', ['$scope', '$routeParams', '$resource', '$rootScope', "$location",
  function ($scope, $routeParams, $resource, $rootScope, $location) {

    var userId = $routeParams.userId;
    $scope.main.curUser = {};

    var obj = $resource('/user/:id');
    // obj.get(params,successFn,errorFn);
    // get user info from resource
    var user = obj.get({
       id: userId 
      }, function () {
      $scope.main.curUser = user;
      $rootScope.content_name = user.first_name + " " + user.last_name;
    });

    // Extend user profile detail with usage
    // load the most recent photo
    var obj2 = $resource('/photosOfUser/:id');
    var photos = obj2.query({ 
      id: userId 
    }, function () {
      if(photos.length === 0){
        $scope.main.recentPhoto = null;
        $scope.main.recentPhotoDate = null;
        $scope.main.comment_count = null;
        $scope.main.mostCommentPhoto = null;
      }

      // here get the most recent time and the most comment photo
      var index = 0;
      var index2 = 0;
      for (let i = 0; i < photos.length; i++) {
        if (photos[i].date_time > photos[index].date_time) {
          index = i;
        }
      }
     
      for (let i = 0; i < photos.length; i++) {
        if (photos[i].comments.length > photos[index2].comments.length) {
          index2 = i;
        }
      }
      
      if(photos[index] !== undefined){
        $scope.main.recentPhoto = "images/" + photos[index].file_name;
        $scope.main.recentPhotoDate = photos[index].date_time;
      }
      
      if(photos[index2] !== undefined){
        $scope.main.comment_count = photos[index2].comments.length;
        $scope.main.mostCommentPhoto = "images/" +photos[index2].file_name;
      }
    });

    $scope.deleteUser = function () {
      // prompt to make sure to delete
      var confirmation = prompt("Are you sure?(Y/N)");
      if (confirmation === null) {
        return;
      }

      if (confirmation !== "Y" && confirmation !== "y") {
        return;
      }
      var res = $resource('/delete/' + userId);
      res.save({}, function () {
        $scope.main.isLoggedIn = false;
        $rootScope.greeting = "You are not log in, Please login";
        $rootScope.$broadcast("logged_out");
        $location.path("/login-register");
      }, function (err) {
        console.log("Something wrong");
      });
    };
  }]);



