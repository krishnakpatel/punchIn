'use strict';

var punchIn = angular.module('punchIn', ['ngRoute', 'ngMaterial', 'ngResource'])
    .config(function($mdThemingProvider){
        $mdThemingProvider.theme('default')
            .primaryPalette('blue')
            .accentPalette('light-blue');
    });

punchIn.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.
            when('/login',{
                templateUrl: 'components/login/loginTemplate.html',
                controller: 'loginController'
            }).
            when('/punch',{
                templateUrl: 'components/punch/punchTemplate.html',
                controller: 'punchController'
            }).
            when('/admin', {
                templateUrl: 'components/admin/adminTemplate.html',
                controller: 'adminController'
            }).
            otherwise({
                redirectTo: '/login'
            });
    }]);

punchIn.controller('MainController', ['$scope', '$resource', '$rootScope', '$location',
    function ($scope, $resource, $rootScope, $location) {
        
        $scope.main = {};
        $scope.main.admin = false;
        $scope.main.logged_in = false;
        $scope.main.employee_id = '';
        $scope.main.employee = {};  
        
        $rootScope.$on("$routeChangeStart", function(event, next, current) {
            if(!$scope.main.logged_in){
                if (next.templateUrl !== "components/login/loginTemplate.html") {
                    $location.path("/login");
                }
            }else if (!$scope.main.admin) {
                if (next.templateUrl !== "components/punch/punchTemplate.html") {
                    $location.path("/punch");
                }
            }
        });

        
//        $scope.main.on_login = function(){
//            $rootScope.$broadcast('show');
//        };
//        
//        var Logout = $resource('admin/logout');
//        $scope.logout_user = function(){
//            Logout.save({}, function(logout){
//                $scope.main.logged_in = false;
//                $scope.main.login_name = '';
//                $scope.main.current_user = '';
//                $scope.main.toolbar = '';
//                $location.path('/login-register');
//                $rootScope.$broadcast('hide');
//            });
//        };
//        
}]);
