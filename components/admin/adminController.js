'use strict';

punchIn.controller('adminController', ['$scope', '$resource', '$mdDialog',
  function ($scope, $resource, $mdDialog) {
      $scope.unresolved = [];
      $scope.message = '';
      
      var Problems = $resource('/adminFunc/problems/', {});
      var set_problems = function(){
            Problems.query({}, function(problems){
              $scope.unresolved = problems;
              console.log(problems)
          }, function(err){
              console.log(err);
          });
          
      }
      set_problems();

      
      var AR = $resource('/adminAR/:id/:admin_id', {admin_id: $scope.main.employee_id, id: '@id'});
      
      $scope.accept = function(index){
          var prob = $scope.unresolved[index];
          AR.save({id:prob.id, action:true}, function(success){
              $scope.message = index.toString() + " accepted";
              set_problems();
              
          }, function(err){
              console.log(err);
          });
      };
      
      $scope.reject = function(index){
          var prob = $scope.unresolved[index];
          AR.save({id:prob.id, action:false}, function(success){
              $scope.message = index.toString() + " rejected";
              set_problems();
          }, function(err){
              console.log(err);
          });
      };
      
      $scope.modal = function(ev, ind) {
            var info = {
                locals: {problem: $scope.unresolved[ind]},
                controller: ['$scope', '$resource','problem', function($scope, $resource, problem) { 
                    $scope.message = '';
                    $scope.problem = problem;
                    $scope.vacation
                     = false;
                    $scope.time = false;
                    $scope.selected_time = {value: new Date(Date.now)}
                    if($scope.problem.modify_time === undefined){
                        $scope.vacation = true;
                    }else{
                        
                        $scope.time = true;
                        if($scope.problem.modify_time === 'now'){
                            $scope.selected_time.value = new Date(Date.now);
                        }else{
                            $scope.selected_time.value = new Date($scope.problem.modify_time);
                        }
                        
                        
                    }
                    $scope.submit = function(){
                        //error check for time
                        var Modify = $resource('/adminMod/:id', {id: $scope.problem.id});
                        if($scope)
                        var new_time = $scope.selected_time.value.getHours().toString() + ":" + $scope.selected_time.value.getMinutes().toString() + ":00";
                        Modify.save({admin_id: $scope.main.employee_id, vacation:$scope.vacation, time: new_time})
                        //submit either time or vacation request
                    };
                }],
                templateUrl: 'components/admin/modal.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose:true,
                fullscreen: $scope.customFullscreen
                };
            
            $mdDialog.show(info);
          };
      
  }]);
