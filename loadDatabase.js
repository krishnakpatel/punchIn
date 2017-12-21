/* loads data from starter csvs */

'use strict';

/* jshint node: true */

var fs = require('fs');

fs.readFile('Admin Users.csv', adminCallback);

var Admins = [];
var Employees = [];
var 

function adminCallback(error, buf){
    var text = buf.toString('utf-8');
    //add to database
    Admins = text.split('\n');
    //remove spaces
}
