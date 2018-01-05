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
      var Punches = $resource('/punches/:user_id/', {user_id: $scope.main.employee_id});
      var Last = $resource('/lastPunch/:user_id', {user_id: $scope.main.employee_id})
      
      var set_buttons = function(){  
          //set can punch in 
          var now = new Date(Date.now());
          var start_date = now.getFullYear().toString() + "-" + (now.getMonth()+1).toString() + "-" + now.getDate().toString() + " 00:00:00";
          Punches.get({}, function(punch){
              if(punch.punched_in === 0){
                  $scope.can_punchin = true;
              }else{
                //make sure user has punched out the past 8 hours
                Last.get({}, function(last){
                        var last_time = new Date(last.last_punch);
                        
                        //force employee to report forgotten punch out
                        if(Math.abs(last_time.getHours() - now.getHours()) >= 6){
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
      
      $scope.time = {
          value: new Date(1970, 0, 1, 14, 57, 0)
      };
      $scope.time_select = function(){
          console.log($scope.time.value)
          if($scope.time.value === undefined){
              $scope.message = 'Please choose a time between 8:00 AM and 5:30 PM.'
          }else{
              $scope.message = '';
          }
      };
      
      $scope.possible_times = [];
      $scope.selected_incorrect_time = '';
      $scope.possible_vs = function(){
          $scope.possible_times = [];
          var start_date = $scope.date_forgot.getFullYear().toString() + "-" + ($scope.date_forgot.getMonth()+1).toString() + "-" + $scope.date_forgot.getDate().toString() + " 00:00:00";
          Possibilities.query({date:start_date}, function(list){
              var i = -1;
              if($scope.forgot_out){
                  i = 1;
              }else if($scope.forgot_in || $scope.extend_hours){
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
          //set_buttons();
      };
      
      var punch_in = function(){
          $scope.forgot_in = true;
          $scope.forgot_out = false;
          $scope.extend_hours = false;
          $scope.paid_vacation = false;
          //set possible times
          $scope.possible_vs();
          //set_buttons();
      };
      
      var extend_hours = function(){
          $scope.forgot_in = false;
          $scope.forgot_out = false;
          $scope.extend_hours = true;
          $scope.paid_vacation = false;
          //set possible times
          $scope.possible_vs();
      };
      
      var holiday = function(){
          $scope.forgot_in = false;
          $scope.forgot_out = false;
          $scope.extend_hours = false;
          $scope.paid_vacation = true;
      };
      
      $scope.problem_functions = [punch_in, punch_out, extend_hours, holiday];
      
      $scope.problem_click = function(index){
          $scope.problem_functions[index]();
      };
      
      $scope.submit_punch_req = function(){
          var problem = {};
          
          //set issue
          if($scope.forgot_in){
              problem.issue = 'forgot to punch in';
          }else{
              problem.issue = 'forgot to punch out';
          }
          
          //gather date
          problem.incorrect_entry = $scope.date_forgot.getFullYear().toString() + "-" + ($scope.date_forgot.getMonth()+1).toString() + "-" + $scope.date_forgot.getDate().toString();
          
          //gather correct time
          var correct_time = $scope.time.value.getHours().toString() + ":" + $scope.time.value.getMinutes().toString() + ":00";
          problem.correct_entry = problem.incorrect_entry + " " + correct_time;
          
          var Problem = $resource('/addPunchProblem/:user_id', {user_id: $scope.main.employee_id});
          
          //gather incorrect time
          if ($scope.selected_incorrect_time === 'I have not punched out/in yet'){
              Punch.save({}, function(punchTime){
                  var time = new Date(punchTime.time);
                  problem.incorrect_entry += " " + time.getHours().toString() + ":" + time.getMinutes().toString() + ":" + time.getSeconds().toString();
                  
                  //send problem to database
                  Problem.save({issue: problem.issue, incorrect_entry: problem.incorrect_entry, correct_entry: problem.correct_entry}, function(success){
                      
                      //reset problem reporting buttons
                      $scope.forgot_in = false;
                      $scope.forgot_out = false;
                      $scope.extend_hours = false;
                      $scope.paid_vacation = false;

                      //reset buttons
                      set_buttons();
                  }, function(error){
                      console.log(error);
                  });
                  
              }, function(err){
                  console.log('Punch error', err);
              });  
          }else{
              var time = new Date($scope.selected_incorrect_time);
              problem.incorrect_entry += " " + time.getHours().toString() + ":" + time.getMinutes().toString() + ":" + time.getSeconds().toString();
              
              //send problem to database
              Problem.save({issue: problem.issue, incorrect_entry: problem.incorrect_entry, correct_entry: problem.correct_entry}, function(success){
                      
                  //reset problem reporting buttons
                  $scope.forgot_in = false;
                  $scope.forgot_out = false;
                  $scope.extend_hours = false;
                  $scope.paid_vacation = false;
                    
                  //reset buttons
                  set_buttons();
              }, function(error){
                  console.log(error);
                });
                  
          }
      };  
      
      $scope.note_to_admin = '';
      
      $scope.submit_note_req = function(){
          var problem = {};
          problem.issue = 'is requesting an early punch in to be accepted';
          
          //gather date/time
          var time = new Date($scope.selected_incorrect_time);
          problem.entry_in_db = time.getFullYear().toString() + "-" + (time.getMonth()+1).toString() + "-" + time.getDate().toString() + " " + time.getHours().toString() + ":" + time.getMinutes().toString() + ":" + time.getSeconds().toString();
          
          //correct start_time entry
          problem.start_time_punch = time.getFullYear().toString() + "-" + (time.getMonth()+1).toString() + "-" + time.getDate().toString() + " " + $scope.main.start_time;
          
          //gather note
          problem.note = $scope.note_to_admin;
          
          //send to admin
          var Note = $resource('/noteOnEarlyPunch/:user_id', {user_id: $scope.main.employee_id});
          Note.save({issue: problem.issue, entry_in_db: problem.entry_in_db, start_time_punch: problem.start_time_punch, note: problem.note}, function(success){
                  //reset problem reporting buttons
                  $scope.forgot_in = false;
                  $scope.forgot_out = false;
                  $scope.extend_hours = false;
                  $scope.paid_vacation = false;
                    
                  //reset buttons
                  set_buttons();
          }, function(err){
              console.log(err);
          });
      };
      
      $scope.v_times = ['1:00', '2:00', '3:00', '4:00', '5:00', '6:00', '7:00', '8:00'];
      
      
      $scope.submit_vac_req = function(){
          var problem = {};
          problem.issue = 'vacation time request';
          problem.date = $scope.date_forgot.getFullYear().toString() + "-" + ($scope.date_forgot.getMonth()+1).toString() + "-" + $scope.date_forgot.getDate().toString();
          problem.hours = $scope.selected_incorrect_time;
          
          var Vacation = $resource('/vacationRequest/:user_id', {user_id: $scope.main.employee_id});
          Vacation.save({issue: problem.issue, date: problem.date, hours: problem.hours, used: $scope.main.used_vacation_time, vacation: $scope.main.vacation_time}, function(success){
                  //reset problem reporting buttons
                  $scope.forgot_in = false;
                  $scope.forgot_out = false;
                  $scope.extend_hours = false;
                  $scope.paid_vacation = false;
                    
                  //reset buttons
                  set_buttons();
          }, function(err){
              console.log(err);
          });
      };
      
      
      
  }]);
