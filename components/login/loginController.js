'use strict';

punchIn.controller('loginController', ['$scope', '$resource', '$location',
  function ($scope, $resource, $location) {
      
      $scope.home = true;
      $scope.password = '';
      $scope.error = '';
      
      $scope.navLogin = function(){
          $scope.home = false;
      };
      
      $scope.submit = function(){
          
          //validate Employee ID, length, numbers
          if($scope.main.employee_id.length === 0){
              $scope.error = 'Employee ID is required.';
              return;
          }
          
          if(isNaN($scope.main.employee_id) || $scope.main.employee_id === '1e10000'){
              $scope.error = 'Employee ID can only use numbers';
              return;
          }
          
          //validate password, length
          if($scope.password.length === 0){
              $scope.error = 'Password is required.';
              return;
          }
          
          //check combination in database
          var Login = $resource('/login');
          
          //supposed to use get request, fix it later
          Login.save({id: $scope.main.employee_id, password: $scope.password}, function(user){
              
              $scope.main.employee = user.first_name;
              $scope.main.start_time = user.start_time;
              $scope.main.vacation_time = user.vacations;
              $scope.main.used_vacation_time = user.used_vacations;
              
              //if found, set logged in & navigate to punch
              $scope.main.logged_in = true;
              $location.path('/punch');
          }, function(err){
              
              //handle extra errors
              console.log(err);
              $scope.password = '';
              $scope.main.employee_id = '';
              $scope.error = 'Employee ID/Password combination not found. Please try again.';
          });
                    
      };

    
  }]);
