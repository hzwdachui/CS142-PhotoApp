"use strict";

var cs142App = angular.module("cs142App", ["ngRoute", "ngMaterial", "ngResource"]);

cs142App.config(["$routeProvider",
  function ($routeProvider) {
    $routeProvider
      .when("/users", {
        templateUrl: "components/user-list/user-listTemplate.html",
        controller: "UserListController"
      })
      .when("/users/:userId", {
        templateUrl: "components/user-detail/user-detailTemplate.html",
        controller: "UserDetailController"
      })
      .when("/photos/:userId", {
        templateUrl: "components/user-photos/user-photosTemplate.html",
        controller: "UserPhotosController"
      })
      .when("/login-register", {
        templateUrl: "components/login-register/login-registerTemplate.html",
        controller: "LoginRegisterController"
      })
      .otherwise({
        redirectTo: "/users"
      });
  }
]);

cs142App.controller("MainController", ["$scope", "$resource", "$rootScope", "$location", "$http",
  function ($scope, $resource, $rootScope, $location, $http) {
    $scope.main = {};
    $scope.main.login_user = {};
    $scope.main.title = "Users";
    $rootScope.greeting = "You are not log in, Please login";
    $scope.main.isLoggedIn = false;

    $scope.getVersion = function () {
      var obj = $resource('/test/info');
      var info = obj.get({},
        function () {
          $scope.versionInfo = info.version;
        },
        function (err) {
          console.log(err);
        });
    };
    $scope.$on('logged_in',function(){
      $scope.getVersion();
  }); 

    $scope.main.logout = function () {
      var resource = $resource("/admin/logout");
      resource.save(
        {},
        function () {
          $scope.main.isLoggedIn = false;
          $rootScope.greeting = "You are not log in, Please login";
          $scope.main.login_user = {};
          $location.path("/login-register");
        },
        function (err) {
          console.log(err.data);
        }
      );
    };

    // this part handle uploading file
    var selectedPhotoFile;
    $scope.inputFileNameChanged = function (element) {
      selectedPhotoFile = element.files[0];
    };

    // Has the user selected a file?
    $scope.inputFileNameSelected = function () {
      return !!selectedPhotoFile;
    };
    // Upload the photo file selected by the user using a post request to the URL /photos/new
    $scope.uploadPhoto = function () {
      if (!$scope.inputFileNameSelected()) {
        console.error("uploadPhoto called will no selected file");
        return;
      }
      console.log("fileSubmitted", selectedPhotoFile);

      // Create a DOM form and add the file to it under the name uploadedphoto
      var domForm = new FormData();
      domForm.append("uploadedphoto", selectedPhotoFile);

      // Using $http to POST the form
      $http.post("/photos/new", domForm, {
        transformRequest: angular.identity,
        headers: { "Content-Type": undefined }
      }).then(
        function successCallback(response) {
          // The photo was successfully uploaded. XXX - Do whatever you want on success
          $rootScope.$broadcast("photoUploaded");
          $rootScope.$broadcast("new_activity");
          $location.path("/photos/" + $scope.main.login_user._id);
          alert("Photo Uploaded");
        },
        function errorCallback(response) {
          // Couldn't upload the photo. XXX  - Do whatever you want on failure.
          console.error("ERROR uploading photo", response);
          alert("Uploading fails");
        }
      );
    };
    
     
    $rootScope.$on("$routeChangeStart", function (event, next, current) {
      if (!$scope.main.isLoggedIn) {
        // no logged user, redirect to /login-register unless already there
        if (next.templateUrl !== "components/login-register/login-registerTemplate.html") {
          $location.path("/login-register");
        }
      }
    });
  }
]);
