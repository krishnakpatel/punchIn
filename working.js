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

var tablesConnection = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'db',
    timezone: 'est'
};

app.get('/adminFunc/problems', function(request, response){
    var problems = [];
    var connection = new DB(tablesConnection);
    connection.query("SELECT modifications.id, employees.first_name, employees.last_name, time_reported, correct_date, punch_in_punches, issue FROM modifications INNER JOIN employees ON employees.id = modifications.employee_id WHERE issue='forgot to punch out' AND actions IS NULL").then((rows) => {
        for(var i = 0; i < rows.length; i++){
            var problem = {};
            problem.id = rows[i].id;
            problem.name = rows[i].first_name + " " + rows[i].last_name;
            problem.space = ' ';
            problem.issue = rows[i].issue;
            problem.description = " is currently listed as punching out at " + (new Date(rows[i].correct_date)).toString() + " and reported that they should have punched out at " + (new Date(rows[i].punch_in_punches)).toString() + ".";
            problem.note = '';
            problem.time = (new Date(rows[i].time_reported)).toString();
            problems.push(problem);
        }
    }, (err) => {
        connection.end();
        console.log(err);
        response.status(500).send(JSON.stringify(err));
    });
    
});