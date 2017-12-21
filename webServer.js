"use strict";
/* jshint node: true */

var express = require('express');
var mysql = require('mysql');
var async = require('async');
var bodyParser = require('body-parser');


var app = express();
app.use(express.static(__dirname));

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

class DB{
    
    constructor(configuration){
        this.connection = mysql.createConnection(configuration
        );
    }
    
    query(sql, args){
        //doesn't this need to be in a connection?
        return new Promise((resolve, reject) => {
            this.connection.query(sql, args, (err, rows) => {
                if(err){
                    return reject(err);
                }else{
                    resolve(rows);   
                }
            });
        });
    }
    
    close(){
        return new Promise((resolve, reject) => {
            this.connection.end(err => {
                if(err){
                    return reject(err);
                }else{
                    resolve();
                }   
            });
        });
    }
}

var dbConnection = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    timezone: 'est'
};

var tablesConnection = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'db',
    timezone: 'est'
};

var database = new DB(dbConnection);
var tables; 


//fix usage of promises, is incorrect rn

database.query("CREATE DATABASE IF NOT EXISTS db").then((success) => {
    console.log(success);
    database.close();
    tables = new DB(tablesConnection);
    
    //don't need a promise can do regular way
    tables.query("CREATE TABLE IF NOT EXISTS admin (id int NOT NULL, UNIQUE(id))");
    tables.query("CREATE TABLE IF NOT EXISTS employees (id int NOT NULL, first_name VARCHAR(255), last_name VARCHAR(255), password VARCHAR(255), department int, start_time TIME, vacations TIME, used_vacations TIME, active int, hire_date DATE, termination_date DATE, UNIQUE(id))");

    tables.query("CREATE TABLE IF NOT EXISTS punches (employee_id int NOT NULL, time TIMESTAMP)");

}).then((success) => {
    tables.query("REPLACE INTO admin (id) VALUES (10)");
    
    tables.query("REPLACE INTO employees (id, first_name, last_name, password, department, start_time, vacations, used_vacations, active, hire_date, termination_date) VALUES (10, 'john', 'smith', 'hello', 1, '8:00:00', '80:00:00', '36:00:00', 1, '1997-01-10', NULL)");
    
    tables.query("REPLACE INTO punches (employee_id, time) VALUES (10, '2017-12-20 8:00:00')");
});

/*
 * URL /login - Login
 */
app.post('/login', function (request, response) {
    var id = request.body.id;
    var password = request.body.password;
    var query = "SELECT first_name FROM employees WHERE id=" + id + " AND password='" + password + "'";
    var connection = mysql.createConnection(tablesConnection);
    connection.query(query, function(err, rows){
        connection.end();
        if(err){
            console.log(err);
            response.status(500).send(JSON.stringify(err));
        }
        if(rows.length === 0){
            response.status(400).send('User not found');
        }else if(rows.length > 1){
            response.status(400).send('Found more than 1 user');
        }
        response.status(200).send(JSON.stringify(rows[0]));
    });
    
});

/*
 * URL /admin/:user_id - checks if user is admin + reports back
 */
app.get('/admin/:user_id', function(request, response){
    var id = request.params.user_id;
    var query = "SELECT id FROM admin WHERE id=" + id.toString();
    var connection = mysql.createConnection(tablesConnection);
    connection.query(query, function(err, rows){
        connection.end();
        if(err){
            console.log(err);
            response.status(500).send(JSON.stringify(err));
        }
        if(rows.length === 0){
            response.status(200).send('f');
        }else if(rows.length > 1){
            response.status(400).send('Found more than 1 user');
        }
        response.status(200).send('t');
    });
});

/*
 * URL /punches/:user_id - number of punches by employee after start 
 */
app.get('/punches/:user_id/:start', function(request, response){
    var id = request.params.user_id;
    var start = request.params.start;
    var query = "SELECT count(*) FROM punches WHERE employee_id=" + id.toString() + " AND time BETWEEN '" + start + "' AND now()";
    var connection = mysql.createConnection(tablesConnection);
    connection.query(query, function(err, rows){
        connection.end();
        if(err){
            console.log(err);
            response.status(500).send(JSON.stringify(err));
        }
        var count = {count: rows[0]['count(*)']}
        response.status(200).send(JSON.stringify(count));
    });
    
});

/*
 * URL /punchIn/:user_id - punches the employee in
 */
app.post('/punch/:user_id', function(request, response){
    var id = request.params.user_id;
    var post = "INSERT INTO punches (employee_id, time) VALUES (" + id.toString() + ", now())";
    var connection = mysql.createConnection(tablesConnection);
    connection.query(post, function(err, rows){
        if(err){
            connection.end();
            console.log(err);
            response.status(500).send(JSON.stringify(err));
        }
        var query = "SELECT time FROM punches WHERE employee_id=" + id.toString() + " ORDER BY time DESC LIMIT 1";
        connection.query(query, function(err, rows){
            connection.end();
            if(err){
                console.log(err);
                response.status(500).send(JSON.stringify(err));
            }
            response.status(200).send(JSON.stringify(rows[0]));        
        });
    });
});

/*
 * URL /punchesOnDay/:user_id/:date - loads list of punches for user on date
 */
app.get('/punchesOnDay/:user_id/:date', function(request, response){
    var id = request.params.user_id;
    var date = request.params.date;
    var end = new Date(date);
    end.setDate(end.getDate()+1);
    var end_timestamp = end.getFullYear().toString() + "-" + (end.getMonth()+1).toString() + "-" + end.getDate().toString() + " 00:00:00";
    var connection = mysql.createConnection(tablesConnection);
    var query = "SELECT time FROM punches WHERE employee_id=" + id.toString() + " AND time BETWEEN '" + date + "' AND '" + end_timestamp + "'";
    connection.query(query, function(err, rows){
        connection.end();
        if(err){
            console.log(err);
            response.status(500).send(JSON.stringify(err));
        }
        var times = [];
        for(var i = 0; i < rows.length; i++){
            times.push(rows[i].time);
        }
        response.status(200).send(JSON.stringify(times));
    });
});

/*
 * URL /lastPunch/:user_id - finds last punch by user
 */
app.get('/lastPunch/:user_id', function(request, response){
    var id = request.params.user_id;
    var connection = mysql.createConnection(tablesConnection);
    var query = "SELECT time FROM punches WHERE employee_id=" + id.toString() + " ORDER BY time DESC LIMIT 1";
    connection.query(query, function(err, rows){
        connection.end();
        if(err){
            console.log(err);
            response.status(500).send(JSON.stringify(err));
        }
        response.status(200).send(JSON.stringify(rows[0]));        
    });
});



var server = app.listen(3000, '0.0.0.0',function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});
