//Module needed for hashing the password
const bcrypt = require('bcrypt');
const { json } = require('body-parser');
const { name } = require('ejs');

//Module needed for the validator
const { check, validationResult } = require('express-validator');

module.exports = function(app, shopData) {
//redirects users back to login page if they are not logged in
    const redirectLogin = (req, res, next) => {
        if (!req.session.userId ) {
        res.redirect('./login')
        } else { next (); }
        } 

    // Handle our routes
    app.get('/',function(req,res){
        res.render('index.ejs', shopData)
    });
    app.get('/about',function(req,res){
        res.render('about.ejs', shopData);
    });
    //const redirectLogin is added as a parameter the following pages that require users to be logged in.
    app.get('/search',redirectLogin,function(req,res){
        res.render("search.ejs", shopData);
    });

    app.get('/login',function(req,res){
        res.render('login.ejs', shopData)
    });

    app.get('/search-result',[check('name').isEmpty()],function (req, res) {

        //searching in the database
        //res.send("You searched for: " + req.query.keyword);

        const errors = validationResult(req); 
        if (!errors.isEmpty()) {
           res.redirect('./search'); }
        else {
            let sqlquery = "SELECT * FROM books WHERE name LIKE '%" + req.query.keyword + "%'"; // query database to get all the books
            // execute sql query
            db.query(sqlquery, (err, result) => {
                if (err) {
                    res.redirect('./'); 
                }
                let newData = Object.assign({}, shopData, {availableBooks:result});
                console.log(newData)
                res.render("list.ejs", newData)
            }); 
        }

       
    });
    app.get('/register', function (req,res) {
        res.render('register.ejs', shopData);                                                                     
    }); 

// validation for email to check if it includes and @
// validation for first name last name and username to make sure its not empty 
// validation for pass to make sure its 8 characters at the minimum and 50 characters at the max 
    app.post('/registered',[check('email').isEmail()], 
                           [check('password').isLength({min: 8, max: 50})],
                           [check('first').notEmpty()],
                           [check('last').notEmpty()],
                           [check('username').notEmpty()],async (req,res) =>{
                            
        //validates a form input as an email address.
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.redirect('./register');
        }
        else {
            // saving data in database
            let sqlquery = "INSERT INTO userdata (username,firstname,lastname,email,hashedPassword) VALUES (?,?,?,?,?)";

            const bcrypt = require('bcrypt');
            const saltRounds = 10;
            const plainPassword = req.body.password; 
            const hash =  await bcrypt.hash(plainPassword,saltRounds);
            //sanitising each field using req.sanitize

            bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
                let data = [req.sanitize(req.body.username),
                    req.sanitize(req.body.first),
                    req.sanitize(req.body.last),
                    req.sanitize(req.body.email), hashedPassword];


                // Store hashed password in your database.
                db.query(sqlquery, data, (err, result) => {
                    if (err) {
                        return console.error(err.message);
                    }
                    else{
                        let newData = Object.assign({}, shopData, {newUser:data});
                        res.render('registered.ejs',newData)

                    }
                    });
            })
            
}});

   

   


    //const redirectLogin is added as a parameter the following pages that require users to be logged in.
    app.get('/list', redirectLogin,function(req, res) {
        let sqlquery = "SELECT * FROM books"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, shopData, {availableBooks:result});
            console.log(newData)
            res.render("list.ejs", newData)
         });
    });

    //const redirectLogin is added as a parameter the following pages that require users to be logged in.
    app.get('/addbook',redirectLogin ,function (req, res) {
        res.render('addbook.ejs', shopData);
     });

     //Book added secction, inserting into the books table with fields name and price
     //Checks if the price value is a float
     app.post('/bookadded', [check('price').isFloat()],
                            [check('name').isAlpha('en-US', {ignore: ' '})],function (req,res) {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.redirect('./addbook'); }
                                
            else {
                           // saving data in database
           let sqlquery = "INSERT INTO books (name, price) VALUES (?,?)";
           

           //sanitizing newrecord  in delete  
           let newrecord = [req.sanitize(req.body.name), req.sanitize(req.body.price)];
           // execute sql query
           db.query(sqlquery, newrecord, (err, result) => {
             if (err) {
               return console.error(err.message);
             }
             else
             res.send(' This book is added to database, name: '+ req.body.name + ' price '+ req.body.price +" <a href='+'./'+'>Home</a>");
             });

            }



});  

    //const redirectLogin is added as a parameter the following pages that require users to be logged in.
       app.get('/bargainbooks',redirectLogin ,function(req, res) {
        let sqlquery = "SELECT * FROM books WHERE price < 20";
        db.query(sqlquery, (err, result) => {
          if (err) {
             res.redirect('./');
          }
          let newData = Object.assign({}, shopData, {availableBooks:result});
          console.log(newData)
          res.render("bargains.ejs", newData)
        });
    });
    //const redirectLogin is added as a parameter the following pages that require users to be logged in.
    app.get('/listusers',redirectLogin,function(req, res){
        // query database to get all the books

        let sqlquery = "SELECT * FROM userdata";
        // execute sql query

        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, shopData, {availableusers:result});
            console.log(newData)
            res.render('listusers.ejs', newData)
         });

    })
    app.get('/deleteuser',redirectLogin,function(req,res){
        res.render("deleteuser.ejs", shopData);
    });
// Validation for delete to see if username is blank
    app.post('/delete',[check('username').notEmpty()],function(req,res){
        const errors = validationResult(req); 
         if (!errors.isEmpty()) {
            res.redirect('./deleteuser'); }
        else {
            //sanitizing username in delete 
            const username = req.sanitize(req.body.username);
            let sqlQuery = "DELETE FROM userdata WHERE username='"+username+"'";
            
            

            db.query(sqlQuery, (err, result) => {
                if(err) {
                    return console.log("Error on the deleteUser path: ", err);
                }
                if(result.affectedRows==0){
                    res.send("User doesn't exsist ")
                }
                else{
                    res.render('delete.ejs',shopData)
                }
                
    
            });

        }


    });

    app.get('/login',function(req,res){
        // Saves user session, given log in is successful
        req.session.userId = req.sanitize(req.body.username); 
        res.render("login.ejs", shopData);
    });

// Validation to make sure username is not empty and makes sure the password is at least 8 characters long.
    app.post('/loggedin',[check('username').notEmpty()],
                         [check('password').isLength({min: 8, max: 50})], function(req,res){
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.redirect('./login'); }
        else {
            let sqlQuery = "SELECT * FROM userdata WHERE username='"+req.sanitize(req.body.username)+"'";
            req.session.userId = req.sanitize(req.body.username);
        
        
            db.query(sqlQuery, function (err, result) {
                let hashedpassword = result[0].hashedPassword;
                console.log('result', result[0]);
                if(err) {
                    res.redirect("./");
                }
                
                
                bcrypt.compare(req.body.password,hashedpassword, function(err,result){
                    if(err){
                        res.redirect(err);
                    }
                    else if(result === true){
                        res.redirect("./correct");
                    }
                    else{
                        res.redirect("./incorrect");
                    }
                
                });
            });

        }

});
    app.get('/correct',function(req,res){
        res.render("correct.ejs", shopData);
    });
    app.get('/incorrect',function(req,res){
        res.render("incorrect.ejs", shopData);
    });

    app.get('/loggedout',function(req,res){
        res.render("loggedout.ejs", shopData);
    });

    //Page that is redirected to when user is logged in and wants to log out.
    app.get('/logout', redirectLogin, (req,res) => {
        req.session.destroy(err => {
        if (err) {
        return res.redirect('./')
        }
        res.redirect("./loggedout");
        })
    })

    app.get('/weather',function(req,res){
        res.render("weather.ejs", shopData);
    });

    app.get('/weather-search',function(req,res){

        const request = require('request');
        //unique api key that was generated by open weather api
        let apiKey = 'c0e4b57c150bd75364ae158a5fc4ec62';
        //url that will be used to draw data from api
        let url =`http://api.openweathermap.org/data/2.5/weather?q=${req.query.city}&units=metric&appid=${apiKey}`
        request(url, function (err, response, body) {
            if(err){
                console.log('error:', error);
            } else {
                
                let weather = JSON.parse(body)
                //validation if there is nothing store in weather from the city they entered then it shows an error message.
                if (weather!==undefined && weather.main!==undefined) {
                    //combining all the information to display 
                    let wmsg = "<center><h1><font color = 3289a8><font size = +2>"+'It is '+ weather.main.temp +
                    ' degrees in '+ weather.name +'! <br> The humidity now is: '+weather.main.humidity+"%"+ " <br> The wind speed is: " 
                    + weather.wind.speed + "mph" +" <br> The wind degree is: " + weather.wind.deg+"</h1>";
                    return res.send ("<h1><font-family: Arial, Helvetica, sans-serif>"+wmsg+"<br>"+"<a href= ./  >Back</a>"+"</h1></center>");
                }
                else {
                    return res.send ("No data found"+"<br>"+ "<a href= ./weather>Back</a>");
                };

            }
            });


    });

    app.get('/api', function (req, res) {
        res.render("api.ejs",shopData);
    });
    
    app.get('/api-list', function (req,res) {
        // Query database to get all the books
        let sqlquery = "SELECT * FROM books";
        // Execute the sql query
        db.query(sqlquery, (err, result) => {
        if (err) {
        res.redirect('./');
        }
        // Return results as a JSON object
        res.json(result);
        });
    });


// I do not have contact details of anyone on the course to do the api extension 
    app.get('/api-search',[check('name').isEmpty()], function (req,res) {
        const errors = validationResult(req); 
        const keyword = req.sanitize(req.body.book);
        if (!errors.isEmpty()) {
           res.redirect('./search'); }
        else {
            let sqlquery = "SELECT * FROM books WHERE name LIKE '%" + req.query.keyword + "%'"; // query database to get all the books
            // execute sql query
            db.query(sqlquery, (err, result) => {
                if (err) {
                    res.redirect('./'); 
                }
                let newData = Object.assign({}, shopData, {availableBooks:result});
                console.log(newData)
                res.render("list.ejs", newData)
            }); 
        }

    });





    app.get('/movies',function(req,res){
        res.render("movies.ejs", shopData);
    });

    app.get('/movie-search',function(req,res){

        const request = require('request');
         //url that will be used to draw data from api
        let url =` https://api.tvmaze.com/singlesearch/shows?q=${req.query.name}`
        request(url, function (err, response, body) {
            if(err){
                console.log('error:', error);
            } else {
                let search = JSON.parse(body);
                //validation if there is nothing stored in search from the movie they entered then it shows an error message.
                if (search !==undefined && search !== null) {
                    let wmsg = "<h1> <font-family: Arial, Helvetica, sans-serif><font color = 3289a8> Name of show: " + search.name + 
                    "<br>Type of show: " +search.type  +"<br>Genres of show: "+search.genres +" <br>Average runtime: "+ search.runtime+
                    "<br> Average rating: "+search.rating.average +"</h1>";
                    return res.send ("<h1><font-family: Arial, Helvetica, sans-serif>"+wmsg+"<br>"+"<a href= ./  >Back</a>"+"</h1>");
                }
                else {
                    return res.send ("<h1><font-family: Arial, Helvetica, sans-serif> No data found"+"<br>"+ "<a href= ./movies>Back</a> </h1>");
                };
            }
            });


    });






//
    

}
