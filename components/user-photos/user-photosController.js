"use strict";

cs142App.controller("UserPhotosController", ["$scope","$routeParams","$resource","$rootScope",
  function($scope, $routeParams, $resource, $rootScope) {
  
    var userId = $routeParams.userId;
    var User = $resource("/user/:id");
    var user = User.get({ id: userId }, function() {
      $rootScope.content_name = "Photos of " + user.first_name + " " + user.last_name;
    });

    var Photos = $resource("/photosOfUser/:id");
    var photos = Photos.query({ id: userId }, function() {
      $scope.main.photolist = photos;
    });

    $scope.addComment = function (photo) {
      var res = $resource("/commentsOfPhoto/" + photo._id);
      res.save({
        comment: $scope.main.newcomment
      },
        function () {
          Photos.query({
            id: userId
          }, function (photos) {
            $scope.main.photolist = photos;
          });
          $scope.main.newcomment = "";
          $rootScope.$broadcast("new_activity");
          alert("Successfully Commented");
        },function (err) {
          if (err.data === "Empty Comments") {
            alert("Please say something");
            return;
          }
        }
      );
    };

    $scope.deletePhoto = function(photo) {
      // prompt to make sure
      var confirmation = prompt("Are you sure?(Y/N)");
      if (confirmation === null) {
        return;
      }

      if (confirmation !== "Y" && confirmation !== "y") {
        return;
      }
      var res = $resource("/deletePhoto/" + photo._id);
      res.save(
        {},
        function() {
          Photos.query({
              id: userId
            },function(photos) {
              $scope.main.photolist = photos;
            });
        },function(err) {
          alert(err.data);
        }
      );
    };

    $scope.deleteComment = function (photo, comment) {
      // prompt to make sure
      var confirmation = prompt("Are you sure?(Y/N)");
      if (confirmation === null) {
        return;
      }

      if (confirmation !== "Y" && confirmation !== "y") {
        return;
      }
      var res = $resource("/deleteComment/" + photo._id);
      res.save({
        comment: comment
      }, function () {
        Photos.query({
          id: userId
        }, function (photos) {
          $scope.main.photolist = photos;
        });
      }, function errorHandling(err) {
        alert(err.data);
      });
    };

    $scope.likePhoto = function (photo) {
      var res = $resource("/like/" + photo._id);
      res.save(
        {},
        function () {
          Photos.query({
            id: userId
          }, function (photos) {
            $scope.main.photolist = photos;
          });
        }, function (err) {
          alert(err.data);
        });
    };

    $scope.liked = function(photo) {
      return photo.likes_ids.indexOf($scope.main.login_user._id) >= 0;
    };

    $scope.$on("newPhoto", function() {
      Photos.query({ id: userId }, function(photos) {
        $scope.main.photolist = photos;
      });
    });
  }
]);


