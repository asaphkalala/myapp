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
    app.get('/search',function(req,res){
        res.render("search.ejs", shopData);
    });

    app.get('/login',function(req,res){
        res.render('login.ejs', shopData)
    });

//Validation checj if search is empty if it is then it redirects back to the search page 
    app.get('/search-result',[check('keyword').notEmpty()],function (req, res) {
        const errors = validationResult(req); 

        if (!errors.isEmpty()) {
           res.redirect('./search'); }
        else {
            let sqlquery = "SELECT * FROM shop WHERE name LIKE '%" + req.sanitize(req.query["keyword"]) + "%'"; // query database to get all the books
            // execute sql query
            db.query(sqlquery, (err, result) => {
                if (err) {
                    res.redirect('./'); 
                } 
                if (result[0] === undefined) {
                    res.send('No matching food has been found. Click <a href=' + '/search-food' + '>here</a> to go back to the search page or <a href=' + './' + '>here</a> to go back to the home page.');
                } else {
                    let newData = Object.assign({}, shopData, {availableFood: result});
                    res.render("list.ejs", newData);
                }
                
            }); 
        }

       
    });

    app.get('/delete-food', function (req,res) {
        let sqlquery = "DELETE FROM shop WHERE foodID=?"; // query database to delete only the food with the id to match which was searched
        // execute sql query
        var id = req.query.id;
        db.query(sqlquery, [id],(err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            //message is sent if food is deleted
            res.send('This food item has been successfully deleted. Click <a href=' + './' + '>here</a> to go back to the home page.');
         });
        
                                                                    
    }); 

    app.get('/update-food',function(req,res){ 
        let sqlQuery = "SELECT * FROM shop WHERE foodID=?"; // query database to update  the food with the id to match which was searched
        var id = req.query.id;

        db.query(sqlQuery, [id],function(err, result) {
            if (err) {
                return console.error(err.message);
            }
            let newData = Object.assign({}, shopData, {availableFood:result});
            res.render("update-food.ejs",newData);
        });


    });


    app.post('/update-food',function(req,res){

        var name = req.sanitize(req.body.name);
        var value = req.sanitize(req.body.values_per); 
        var unit = req.sanitize(req.body.unit_value);
        var carbs = req.sanitize(req.body.carbs); 
        var fat = req.sanitize(req.body.fat); 
        var protein = req.sanitize(req.body.protein); 
        var salt = req.sanitize(req.body.salt); 
        var sugar = req.sanitize(req.body.sugar); 
        var id = req.sanitize(req.body.id);
         

        let newrecord = [name,value,unit,carbs,fat,protein,salt,sugar,id];
 
        //query database to update the inputted values into the respected food 
        let sqlQuery = "UPDATE shop set name=?, values_per=?,unit_value=?,carbs=?,fat=?,protein=?,salt=?,sugar=? where foodID=?";

        db.query(sqlQuery, newrecord,(err, result,rows, fields) => {
            if (err) {
                return console.error(err.message);
            }
            res.redirect("./updatelist")

        });

    });


    app.get('/search-update',redirectLogin,function(req,res){
        res.render('search-update.ejs', shopData)
    });

    //identical to search except it redirects to updatelist.ejs which has a delete and update function 
    app.get('/update-search',[check('keyword').notEmpty()],function (req, res) {
        const errors = validationResult(req); 
        
        if (!errors.isEmpty()) {
           res.redirect('./search-update '); }
        else {
            let sqlquery = "SELECT * FROM shop WHERE name LIKE '%" + req.sanitize(req.query["keyword"]) + "%'"; // query database to get all the food that was searched
            // execute sql query
            db.query(sqlquery, (err, result) => {
                if (err) {
                    res.redirect('./'); 
                }else {
                    let newData = Object.assign({}, shopData, {availableFood: result});
                    res.render("updatelist.ejs", newData);
                }
            }); 
        }

    });


    app.get('/register', function (req,res) {
        res.render('register.ejs', shopData);                                                                     
    }); 

    app.get('/updatelist', function (req,res) {

        let sqlquery = "SELECT * FROM shop"; // query database to get all the food from shop 
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, shopData, {availableFood:result});
            console.log(newData)
            res.render("updatelist.ejs", newData)
         }); 
                                                                    
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
    app.get('/list',redirectLogin,function(req, res) {
        let sqlquery = "SELECT * FROM shop"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, shopData, {availableFood:result});
            console.log(newData)
            res.render("list.ejs", newData)
         });
    });


    app.get('/addfood',redirectLogin ,function (req, res) {
        res.render('addfood.ejs', shopData);
     });


    app.post('/foodadded', function (req,res) {

        // saving data in database
        let sqlquery = "INSERT INTO shop (name,values_per,unit_value,carbs,fat,protein,salt,sugar) VALUES (?,?,?,?,?,?,?,?)";
        

        //sanitizing newrecord in food added
        let newfood = [req.sanitize(req.body.name),req.sanitize(req.body.values_per), 
                        req.sanitize(req.body.unit_value),req.sanitize(req.body.carbs), 
                        req.sanitize(req.body.fat),req.sanitize(req.body.protein),
                        req.sanitize(req.body.salt), req.sanitize(req.body.sugar)];  
        //adding the inputted food in our database
        db.query(sqlquery, newfood, (err, result) => {
            if (err) { 
                return console.error(err.message);
            }
            else{
                let newData = Object.assign({}, shopData, {foodAdded: newfood});
                res.render("food-added.ejs", newData);
            }

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

    

    app.get('/login',function(req,res){
        // Saves user session, given log in is successful
        req.session.userId = req.sanitize(req.body.username); 
        res.render("login.ejs", shopData);
    });

// Validation to make sure username is not empty and makes sure the password is at least 8 characters long.
    app.post('/loggedin',[check('username').notEmpty()],
                         [check('password').isLength({min: 8, max: 50})], function(req,res){
        const errors = validationResult(req);
        let sqlQuery = "SELECT * FROM userdata WHERE username='"+req.sanitize(req.body.username)+"'";
        req.session.userId = req.sanitize(req.body.username);


        db.query(sqlQuery,  (err, result) => {
            if (err) {
                return console.log(err.message);
            }
            else if( result[0] == undefined){
                res.render("incorrect.ejs",shopData);
            }else{
                let hashedpassword = result[0].hashedPassword;
                
                bcrypt.compare(req.body.password,hashedpassword, function(err,result){
                    if(err){
                        res.redirect(err);
                    }
                    else if(result === true){
                        res.redirect("./correct");
                    }
                    else{
                        res.render("./incorrect");
                    }
                
                });

            }
        });
        


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


    app.get('/api', function (req, res) {
        res.render("api.ejs",shopData);
    });

    app.get('/api-list', function (req,res) {
        // Query database to get all the books
        let sqlquery = "SELECT * FROM shop";
        // Execute the sql query
        db.query(sqlquery, (err, result) => {
        if (err) {
        res.redirect('./');
        }
        // Return results as a JSON object
        res.json(result);
        });
    });
    

    app.get('/api-search',[check('name').isEmpty()], function (req,res) {
        const errors = validationResult(req); 
        const keyword = req.sanitize(req.body.book);
        if (!errors.isEmpty()) {
           res.redirect('./search'); }
        else {
            let sqlquery = "SELECT * FROM shop WHERE name LIKE '%" + req.query.keyword + "%'"; // query database to get all the books
            // execute sql query
            db.query(sqlquery, (err, result) => {
                if (err) {
                    res.redirect('./'); 
                }
                let newData = Object.assign({}, shopData, {availableFood:result});
                console.log(newData)
                // Return results as a JSON object
                res.json(result);
            }); 
        }

    });



    

}
