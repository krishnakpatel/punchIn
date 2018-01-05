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



database.query("CREATE DATABASE IF NOT EXISTS db").then((success) => {
    console.log(success);
    database.close();
    tables = new DB(tablesConnection);
    
    //don't need a promise can do regular way
    tables.query("CREATE TABLE IF NOT EXISTS admin (id int NOT NULL, UNIQUE(id))");
    tables.query("CREATE TABLE IF NOT EXISTS employees (id int NOT NULL, first_name VARCHAR(255), last_name VARCHAR(255), password VARCHAR(255), department int, last_punch DATETIME NULL, punched_in TINYINT(1) DEFAULT 0 NOT NULL, start_time TIME, vacations TIME, used_vacations TIME, accumulated_vacation TIME, active int, hire_date DATE, termination_date DATE NULL, UNIQUE(id))");

    tables.query("CREATE TABLE IF NOT EXISTS punches (employee_id int NOT NULL, time TIMESTAMP NOT NULL PRIMARY KEY)");
    
    tables.query("CREATE TABLE IF NOT EXISTS modifications (id int NOT NULL AUTO_INCREMENT, admin_id int, time_modified TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP, employee_id int, time_reported DATETIME, issue VARCHAR(255) DEFAULT ' ' NOT NULL, correct_date DATETIME, punch_in_punches DATETIME NOT NULL DEFAULT '1000-01-01 00:00:00', date DATE, hours TIME, note VARCHAR(255) DEFAULT ' ' NOT NULL, actions VARCHAR(255), mods VARCHAR(225), PRIMARY KEY (id), CONSTRAINT dupl UNIQUE(issue, note, punch_in_punches))");
    
    tables.query("CREATE TABLE IF NOT EXISTS vacation (employee_id int NOT NULL, date DATETIME, hours TIME)");

}).then((success) => {
    tables.query("REPLACE INTO admin (id) VALUES (10)");
    
    tables.query("REPLACE INTO employees (id, first_name, last_name, password, department, start_time, vacations, used_vacations, active, hire_date) VALUES (10, 'john', 'smith', 'hello', 1, '8:00:00', '80:00:00', '36:00:00', 1, '1997-01-10')");
    
});

/*
 * URL /login - Login
 */
app.post('/login', function (request, response) {
    var id = request.body.id;
    var password = request.body.password;
    var query = "SELECT first_name, start_time, vacations, used_vacations FROM employees WHERE id=" + id + " AND password='" + password + "'";
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

///*
// * URL /punches/:user_id - number of punches by employee after start 
// */
//app.get('/punches/:user_id/:start', function(request, response){
//    var id = request.params.user_id;
//    var start = request.params.start;
//    var query = "SELECT count(*) FROM punches WHERE employee_id=" + id.toString() + " AND time BETWEEN '" + start + "' AND now()";
//    var connection = mysql.createConnection(tablesConnection);
//    connection.query(query, function(err, rows){
//        connection.end();
//        if(err){
//            console.log(err);
//            response.status(500).send(JSON.stringify(err));
//        }
//        var count = {count: rows[0]['count(*)']}
//        response.status(200).send(JSON.stringify(count));
//    });
//    
//});

/* 
 * URL /punches/:user_id - returns if the user can punch in
 */
app.get('/punches/:user_id', function(request, response){
    var id = request.params.user_id;
    var query = "SELECT punched_in FROM employees WHERE id=" + id.toString();
    var connection = mysql.createConnection(tablesConnection);
    connection.query(query, function(err, rows){
        connection.end();
        if(err){
            console.log(err);
            response.status(500).send(JSON.stringify(err));
        }
        response.status(200).send(JSON.stringify(rows[0]));
    });
});

/*
 * URL /punchIn/:user_id - punches the employee in
 */
app.post('/punch/:user_id', function(request, response){
    //convert to use promises?
    //server now vs. sql server now
    var id = request.params.user_id;
    var post = "REPLACE INTO punches (employee_id, time) VALUES (" + id.toString() + ", now())";
    var connection = mysql.createConnection(tablesConnection);
    connection.query(post, function(err, rows){
        if(err){
            connection.end();
            console.log(err);
            response.status(500).send(JSON.stringify(err));
        }
        
        
        
        
        //modify to only search today
        
        
        
        var query = "SELECT time FROM punches WHERE employee_id=" + id.toString() + " ORDER BY time DESC LIMIT 1";
        connection.query(query, function(err, rows){
            if(err){
                connection.end();
                console.log(err);
                response.status(500).send(JSON.stringify(err));
            }
            var date_obj = new Date(rows[0].time);
            var date = date_obj.getFullYear().toString() + "-" + (date_obj.getMonth()+1).toString() + "-" + date_obj.getDate().toString() + " " + date_obj.getHours().toString() + ":" + date_obj.getMinutes().toString() + ":" + date_obj.getSeconds().toString();
            var q = "UPDATE employees SET punched_in=NOT punched_in, last_punch='" + date + "'";
            connection.query(q, function(err, rows){
                if(err){
                    connection.end();
                    console.log(err);
                    response.status(500).send(JSON.stringify(err));
                }
                var obj = {time: date};
                response.status(200).send(JSON.stringify(obj));
            });
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

///*
// * URL /lastPunch/:user_id - finds last punch by user
// */
//app.get('/lastPunch/:user_id', function(request, response){
//    var id = request.params.user_id;
//    var connection = mysql.createConnection(tablesConnection);
//    var query = "SELECT time FROM punches WHERE employee_id=" + id.toString() + " ORDER BY time DESC LIMIT 1";
//    connection.query(query, function(err, rows){
//        connection.end();
//        if(err){
//            console.log(err);
//            response.status(500).send(JSON.stringify(err));
//        }
//        response.status(200).send(JSON.stringify(rows[0]));        
//    });
//});

/*
 * URL /lastPunch/:user_id - finds last punch by user 
 */
app.get('/lastPunch/:user_id', function(request, response){
    var id = request.params.user_id;
    var connection = mysql.createConnection(tablesConnection);
    var query = "SELECT last_punch FROM employees WHERE id=" + id.toString();
    connection.query(query, function(err, rows){
        connection.end();
        if(err){
            console.log(err);
            response.status(500).send(JSON.stringify(err));
        }
        response.status(200).send(JSON.stringify(rows[0]));
    });
});

/*
 * URL - /addPunchProblem/:user_id - adds a punch problem reported by user to modifications
 */
app.post('/addPunchProblem/:user_id', function(request, response){
    var id = request.params.user_id;
    var issue = request.body.issue;
    var incorrect_entry = request.body.incorrect_entry;
    var correct_entry = request.body.correct_entry;
    var query = "REPLACE INTO modifications (employee_id, time_reported, issue, correct_date, punch_in_punches) VALUES (" + id.toString() + ", NOW(), '" + issue + "', '"+ correct_entry + "', '" + incorrect_entry + "')";
    var connection = mysql.createConnection(tablesConnection);
    connection.query(query, function(err, rows){
        connection.end();
        if(err){
            console.log(err);
            response.status(500).send(JSON.stringify(err));
        }
        response.status(200).send('a');
    });
});

/*
 * URL - /noteOnEarlyPunch/:user_id - adds a note, punch problem 
 */
app.post('/noteOnEarlyPunch/:user_id', function(request, response){
    var id = request.params.user_id;
    var issue = request.body.issue;
    var incorrect_entry = request.body.entry_in_db;
    var correct_entry = request.body.start_time_punch;
    var note = request.body.note;
    var query = "REPLACE INTO modifications (employee_id, time_reported, issue, correct_date, punch_in_punches, note) VALUES (" + id.toString() + ", NOW(), '" + issue + "', '"+ correct_entry + "', '" + incorrect_entry + "', '" + note + "')";
    var connection = mysql.createConnection(tablesConnection);
    connection.query(query, function(err, rows){
        connection.end();
        if(err){
            console.log(err);
            response.status(500).send(JSON.stringify(err));
        }
        response.status(200).send('a');
    });
});

/*
 * URL - /vacationRequest/:user_id - submits a vacation request
 */
app.post('/vacationRequest/:user_id', function(request, response){
    
    
    //calculate + set accumulated vacation time 
    
    
    
    
    
    
    
    
    
    
    var id = request.params.user_id;
    var body = request.body;
    var query = "REPLACE INTO modifications (employee_id, time_reported, issue, date, hours, note) VALUES (" + id.toString() + ", NOW(), '" + body.issue + "', '" + body.date + "', '" + body.hours + "', 'mention accumulated vacation time, used time, and total time here in weeks/days')";    
    //don't autoreject vacation request if vacation time will be exceeded
    var connection = mysql.createConnection(tablesConnection);
    connection.query(query, function(err, rows){
        connection.end();
        if(err){
            console.log(err);
            response.status(500).send(JSON.stringify(err));
        }
        response.status(200).send('a');
    });
});

/*
 * URL - /adminFunc/problems/ - returns all unresolved problems
 */
app.get('/adminFunc/problems/', function(request, response){
    var problems = [];
    var query1 = "SELECT modifications.id, employees.first_name, employees.last_name, time_reported, correct_date, punch_in_punches, issue FROM modifications INNER JOIN employees ON employees.id = modifications.employee_id WHERE issue='forgot to punch out' AND actions IS NULL";
    var connection = mysql.createConnection(tablesConnection);
    connection.query(query1, function(err, rows){
        if(err){
            connection.end();
            console.log(err);
            response.status(500).send(JSON.stringify(err));
        }

        //process rows for forgotten punch out
        for(var i = 0; i < rows.length; i++){
            var problem = {};
            problem.ar = true;
            problem.mod = true;
            problem.id = rows[i].id;
            problem.name = rows[i].first_name + " " + rows[i].last_name;
            problem.space = ' ';
            problem.issue = rows[i].issue;
            problem.modify_time = new Date(rows[i].correct_date);
            problem.description = " is currently listed as punching out at " + (new Date(rows[i].punch_in_punches)).toString() + " and reported that they should have punched out at " + (new Date(rows[i].correct_date)).toString() + ".";
            problem.note = '';
            problem.time = (new Date(rows[i].time_reported)).toString();
            problems.push(problem);
        }
        
        var query2 = "SELECT modifications.id, employees.first_name, employees.last_name, time_reported, correct_date, punch_in_punches, issue FROM modifications INNER JOIN employees ON employees.id = modifications.employee_id WHERE issue='forgot to punch in' AND actions IS NULL";
        connection.query(query2, function(err, rows){
            if(err){
                connection.end();
                console.log(err);
                response.status(500).send(JSON.stringify(err));
            }
            console.log('2')
            console.log(rows)

            //process rows for forgotten punch in
            for(i = 0; i < rows.length; i++){
                problem = {};
                problem.ar = true;
                problem.mod = true;
                problem.id = rows[i].id;
                problem.name = rows[i].first_name + " " + rows[i].last_name;
                problem.space = ' ';
                problem.issue = rows[i].issue;
                problem.modify_time = new Date(rows[i].correct_date);
                problem.description = " is currently listed as punching in at " + (new Date(rows[i].punch_in_punches)).toString() + " and reported that they should have punched in at " + (new Date(rows[i].correct_date)).toString() + ".";
                problem.note = '';
                problem.time = (new Date(rows[i].time_reported)).toString();
                problems.push(problem);
            }

            var query3 = "SELECT modifications.id, employees.first_name, employees.last_name, time_reported, correct_date, punch_in_punches, issue FROM modifications INNER JOIN employees ON employees.id = modifications.employee_id WHERE issue='is requesting an early punch in to be accepted' AND actions IS NULL";
            connection.query(query3, function(err, rows){
                if(err){
                    connection.end();
                    console.log(err);
                    response.status(500).send(JSON.stringify(err));
                }
                //process rows for early punch in
                for(i = 0; i < rows.length; i++){
                    problem = {};
                    problem.ar = true;
                    problem.mod = true;
                    problem.id = rows[i].id;
                    problem.name = rows[i].first_name + " " + rows[i].last_name;
                    problem.space = " ";
                    problem.issue = rows[i].issue;
                    problem.modify_time = new Date(rows[i].correct_date);
                    problem.description = " is currently listed as punching in at " + (new Date(rows[i].punch_in_punches)).toString() + " but shouldn't have punched in until " + (new Date(rows[i].correct_date)).toString()  + ". They left a note.";
                    problem.note = rows[i].note;
                    problem.time = (new Date(rows[i].time_reported)).toString();
                    problems.push(problem);
                }

                var query4 = "SELECT modifications.id, time_reported, date, hours, employees.first_name, employees.last_name, issue FROM modifications INNER JOIN employees ON employees.id = modifications.employee_id WHERE issue='vacation time request' AND actions IS NULL";
                connection.query(query4, function(err, rows){
                    if(err){
                        connection.end();
                        console.log(err);
                        response.status(500).send(JSON.stringify(err));
                    }

                    //process rows for vacation requests
                    for(i = 0; i < rows.length; i++){
                        problem = {};
                        problem.ar = true;
                        problem.mod = true;
                        problem.id = rows[i].id;
                        problem.name = rows[i].first_name + " " + rows[i].last_name;
                        problem.space = "'s ";
                        problem.issue = rows[i].issue;
                        problem.modify_date = new Date(rows[i].date);
                        problem.modify_hours = new Date(rows[i].hours);
                        problem.description = " is requesting " + rows[i].hours + " hours of vacation time on " + (new Date(rows[i].date)).toString() + ".";
                        problem.note = rows[i].note;
                        problem.time = (new Date(rows[i].time_reported)).toString();
                        problems.push(problem);
                    }
                    var query5 = "REPLACE INTO modifications (employee_id, time_reported, issue, note) SELECT id, NOW(), 'has not punched out in over 6 hours', last_punch FROM employees WHERE punched_in=1 AND TIMESTAMPDIFF(HOUR, last_punch, NOW()) >= 6";
                    connection.query(query5, function(err, rows){
                        if(err){
                            connection.end();
                            console.log(err);
                            response.status(500).send(JSON.stringify(err));
                        }
                        var query6 = "SELECT modifications.id, time_reported, first_name, last_name, note FROM modifications INNER JOIN employees ON employees.id = modifications.employee_id WHERE issue='has not punched out in over 6 hours' AND actions IS NULL";
                        connection.query(query6, function(err, rows){
                            //process rows for forgotten punch outs >= 6 hours 
                            for(i = 0; i < rows.length; i++){
                                problem = {};
                                problem.ar = false;
                                problem.mod = true;
                                problem.name = rows[i].first_name + " " + rows[i].last_name;
                                problem.id = rows[i].id;
                                problem.space = " ";
                                problem.issue = "hasn't punched out in over 6 hours.";
                                problem.description = " should have punched out, but hasn't yet. Their last punch in was at " + rows[i].note;
                                problem.note = '';
                                problem.modify_time = 'now';
                                problem.time = (new Date(rows[i].time_reported)).toString();
                                problems.push(problem);
                            }
                            var query7 = "REPLACE INTO modifications (employee_id, time_reported, issue, correct_date, punch_in_punches) SELECT employee_id, NOW(), 'punched in too early', TIMESTAMP(DATE(punches.time), TIME(employees.start_time)), punches.time FROM punches INNER JOIN employees ON employees.id = punches.employee_id WHERE TIME(punches.time) < employees.start_time";
                            connection.query(query7, function(err, rows){
                                if(err){
                                    connection.end();
                                    console.log(err);
                                    response.status(500).send(JSON.stringify(err));
                                }
                                
                                var query8 = "SELECT modifications.id, time_reported, correct_date, punch_in_punches, employees.first_name, employees.last_name FROM modifications INNER JOIN employees ON employees.id = modifications.employee_id WHERE issue='punched in too early' AND actions IS NULL";
                                connection.query(query8, function(err, rows){

                                    //punching in early
                                    for(i = 0; i < rows.length; i++){
                                        problem = {};
                                        problem.ar = false;
                                        problem.mod = false;
                                        problem.name = rows[i].first_name + " " + rows[i].last_name;
                                        problem.id = rows[i].id;
                                        problem.space = " ";
                                        problem.issue = " punched in too early";
                                        problem.description = " punched in at " + (new Date(rows[i].punch_in_punches)).toString() + ", which is before their start time of " + rows[i].correct_date;
                                        problem.note = '';
                                        problem.time = (new Date(rows[i].time_reported)).toString();
                                        problems.push(problem);
                                    }
                                    response.status(200).send(JSON.stringify(problems));
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

/*
 * URL /adminMod/:id - modify an entry in problem table
 */
app.post('/adminMod/:id', function(request, response){
    var id = request.params.id;
    var admin = request.body.admin_id;
    //can modify the correct date time or for vacation request can modify date and hours
    //make a separate one for if you haven't punched out in over 6 hours
    var vacation = request.body.vacation;
    var connection = mysql.createConnection(tablesConnection);
    if(vacation){
        
    }else{
        var query1 = "UPDATE modifications SET admin_id=" + admin.toString() + ", actions='modified', mods=CONCAT('correct_date changed from ', correct_date), correct_date=CONCAT(DATE(correct_date), ' " + request.body.time + "') WHERE id=" + id.toString();
        
        connection.query(query1, function(err, rows){
            if(err){
                connection.end();
                console.log(err);
                response.status(500).send(JSON.stringify(err));
            }
            if(!accept){
                response.status(200).send('rejected');
                return;
            }
            var query2 = "SELECT * FROM modifications where id=" + id.toString();
            connection.query(query2, function(err, rows){
                if(err){
                    connection.end();
                    console.log(err);
                    response.status(500).send(JSON.stringify(err));
                }
                if(rows[0].issue === 'forgot to punch in' || rows[0].issue === 'forgot to punch out' || rows[0].issue === 'is requesting an early punch in to be accepted' || rows[0].issue === 'punched in too early'){
                    var time = rows[0].correct_date;
                    var correct = time.getFullYear().toString() + "-" + (time.getMonth()+1).toString() + "-" + time.getDate().toString() + " " + time.getHours().toString() + ":" + time.getMinutes().toString() + ":" + time.getSeconds().toString();
                    var time2 = rows[0].punch_in_punches;
                    var punch = time2.getFullYear().toString() + "-" + (time2.getMonth()+1).toString() + "-" + time2.getDate().toString() + " " + time2.getHours().toString() + ":" + time2.getMinutes().toString() + ":" + time2.getSeconds().toString();
                    var query3 = "UPDATE punches SET time ='" + correct + "' WHERE employee_id=" + rows[0].employee_id + " AND time='" + punch + "'";
                    connection.query(query3, function(err, rows){
                        connection.end()
                        if(err){
                            console.log(err);
                            response.status(500).send(JSON.stringify(err));
                        } 
                        response.status(200).send('a');
                    });

        }
});

/*
 * URL /adminAR/:id - accept or reject from modification table
 */
app.post('/adminAR/:id/:admin_id', function(request, response){
    var id = request.params.id;
    var admin = request.params.admin_id;
    var accept = request.body.action;
    var connection = mysql.createConnection(tablesConnection);
    var query = "UPDATE modifications SET admin_id=" + admin.toString() + ", actions='";
    if(accept){
        query += "accepted' WHERE id=" + id.toString();
    }else{
        query += "rejected' WHERE id=" + id.toString();
    }
    connection.query(query, function(err, rows){
        if(err){
            connection.end();
            console.log(err);
            response.status(500).send(JSON.stringify(err));
        }
        if(!accept){
            response.status(200).send('rejected');
            return;
        }
        var query2 = "SELECT * FROM modifications where id=" + id.toString();
        connection.query(query2, function(err, rows){
            if(err){
                connection.end();
                console.log(err);
                response.status(500).send(JSON.stringify(err));
            }
            //check if it autoconverts to a Date Object
            if(rows[0].issue === 'forgot to punch in' || rows[0].issue === 'forgot to punch out' || rows[0].issue === 'is requesting an early punch in to be accepted' || rows[0].issue === 'punched in too early'){
                var time = rows[0].correct_date;
                var correct = time.getFullYear().toString() + "-" + (time.getMonth()+1).toString() + "-" + time.getDate().toString() + " " + time.getHours().toString() + ":" + time.getMinutes().toString() + ":" + time.getSeconds().toString();
                var time2 = rows[0].punch_in_punches;
                var punch = time2.getFullYear().toString() + "-" + (time2.getMonth()+1).toString() + "-" + time2.getDate().toString() + " " + time2.getHours().toString() + ":" + time2.getMinutes().toString() + ":" + time2.getSeconds().toString();
                var query3 = "UPDATE punches SET time ='" + correct + "' WHERE employee_id=" + rows[0].employee_id + " AND time='" + punch + "'";
                connection.query(query3, function(err, rows){
                    connection.end()
                    if(err){
                        console.log(err);
                        response.status(500).send(JSON.stringify(err));
                    } 
                    response.status(200).send('a');
                });
            }else{
//                var used = rows[0].hours;
//                var query4 = "INSERT INTO vacations (employee_id, date, hours) VALUES (" + rows[0].employee_id.toString() + ", '" + rows[0].date + "', '" + rows[0].hours + "')";
//                connection.query(query4, function(err, rows){
//                    if(err){
//                        connection.end();
//                        console.log(err);
//                        response.status(500).send(JSON.stringify(err));
//                    }
//                   // var query5 
//                });
            }
        });
    });
    
});

var server = app.listen(3000, '0.0.0.0', function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});
