'use strict';

punchIn.controller('punchController', ['$scope', '$resource', '$location', 
  function ($scope, $resource, $location) {
      
      $scope.message = '';
      
      $scope.to_admin = function(){
          $location.path('/admin');
      };
      
      $scope.can_punchin = false;
      $scope.forgot = false;
      
      var Admin = $resource('/admin/:user_id', {user_id: $scope.main.employee_id});
      var Punches = $resource('/punches/:user_id/:start', {user_id: $scope.main.employee_id, start:'@start'});
      var Last = $resource('/lastPunch/:user_id', {user_id: $scope.main.employee_id})
      
      var set_buttons = function(){  
          //set can punch in 
          var now = new Date(Date.now());
          var start_date = now.getFullYear().toString() + "-" + (now.getMonth()+1).toString() + "-" + now.getDate().toString() + " 00:00:00";
          Punches.get({start: start_date}, function(punch){
              if(punch.count%2 === 0){
                  $scope.can_punchin = true;
              }else{
                //make sure user has punched out the past 8 hours
                Last.get({}, function(last){
                        var last_time = new Date(last.time);
                        
                        //force employee to report forgotten punch out
                        if(Math.abs(last_time.getHours() - now.getHours()) >= 8){
                            $scope.forgot = true;
                            $scope.message = 'It seems you forgot to punch out. Please report this problem below.';
                        }
                    }, function(err){
                        console.log(err);
                });
                $scope.can_punchin = false;
              }
          }, function(err){
              console.log(err);
          });
          
          //set admin 
          Admin.get({}, function(admin){
              if(admin[0] === 't'){
                  $scope.main.admin = true;
              }
          }, function(err){
              console.log(err);
          });
          
      };
      
      set_buttons();
      
      var Punch = $resource('/punch/:user_id', {user_id:$scope.main.employee_id});
      var log_time = function(message){
          Punch.save({}, function(punchTime){
              var time = new Date(punchTime.time);
              $scope.message = "Punched " + message + " at " + time.toString();
              //set_buttons();
          }, function(err){
              $scope.message = "Error Punching " + message + ". Please leave a message for the administrator."
              console.log('Punch error', err);
          }); 
          
      }
      $scope.punch_in = function(){
          //check if punch in happens before start time
          //display message asking them whether or not they would like to send extended hours report
          log_time('in');
          $scope.can_punchin = false;
          $scope.forgot_in = false;
          $scope.forgot_out = false;
          $scope.extend_hours = false;
          $scope.paid_vacation = false;
      }
      
      $scope.punch_out = function(){
          log_time('out');
          $scope.can_punchin = true;
          $scope.forgot_in = false;
          $scope.forgot_out = false;
          $scope.extend_hours = false;
          $scope.paid_vacation = false;
      }
      
      $scope.problem_options = ['Forgot to Punch In', 'Forgot to Punch Out', 'Submit Extended Hours Request', 'Submit Request for Paid Vacation'];
      $scope.forgot_in = false;
      $scope.forgot_out = false;
      $scope.extend_hours = false;
      $scope.paid_vacation = false;
      
      $scope.date_forgot = new Date();
      var min = new Date(Date.now());
      min.setDate(min.getDate()-14);
      $scope.min_date = min;
      $scope.max_date = new Date(Date.now());
      $scope.date_filter = function(date){
          var day = date.getDay();
          if (day === 0 || day === 6){
              return false;
          }else{
              return true;
          }
      };
      
      
      var Possibilities = $resource('/punchesOnDay/:user_id/:date', {user_id:$scope.main.employee_id, date:'@date'});
      
      $scope.possible_times = [];
      $scope.selected_incorrect_time = '';
      
      $scope.possible_vs = function(){
          $scope.possible_times = [];
          var start_date = $scope.date_forgot.getFullYear().toString() + "-" + ($scope.date_forgot.getMonth()+1).toString() + "-" + $scope.date_forgot.getDate().toString() + " 00:00:00";
          Possibilities.query({date:start_date}, function(list){
              console.log(list)
              var i = -1;
              if($scope.forgot_out){
                  i = 1;
              }else if($scope.forgot_in){
                  i = 0;
              }
              for(i; i < list.length; i+=2){
                  $scope.possible_times.push((new Date(list[i])).toString());
              }
          }, function(err){
              console.log();
          });

      };
      
      var punch_out = function(){
          $scope.forgot_out = true;
          $scope.forgot_in = false;
          $scope.extend_hours = false;
          $scope.paid_vacation = false;
          //set possible times
          $scope.possible_vs();
          set_buttons();
      };
      
      var punch_in = function(){
          $scope.forgot_in = true;
          $scope.forgot_out = false;
          $scope.extend_hours = false;
          $scope.paid_vacation = false;
          //set possible times
          $scope.possible_vs();
          set_buttons();
      }
      
      $scope.problem_functions = [punch_in, punch_out];
      
      $scope.problem_click = function(index){
          $scope.problem_functions[index]();
      }
      
      //reset buttons once problem has been reported
   
  }]);
