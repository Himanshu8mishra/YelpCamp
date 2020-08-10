var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var Comment = require("./models/comment");
var Campground = require("./models/campground");
var seedDB      = require("./seed");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var User = require("./models/user");

mongoose.connect("mongodb://localhost/yelp_camp", {useNewUrlParser: true, useUnifiedTopology: true});
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.use(require("express-session")({
    secret: "Himanshu Mishra",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.set("view engine", "ejs");
app.use(function(request, response, next){
   response.locals.currentUser = request.user;
   next();
});

seedDB();

app.get("/", function(request, response){
   response.render("homepage");
});

app.get("/campgrounds", function(request, response){
   Campground.find({}, function(err, allCampgrounds){
      if(err){
         console.log(err);
      }
      else{
         response.render("campgrounds/campgrounds", {campgrounds: allCampgrounds, currentUser: request.user});
      }
   });
});

app.get("/campgrounds/new", function(request, response){
   response.render("campgrounds/new");
});

app.get("/campgrounds/:id", function(request, response) {
    Campground.findById(request.params.id).populate("comments").exec(function(err, found){
       if(err){
           console.log(err);
       }
       else{
           response.render("campgrounds/show", {campground: found});
       }
    });
});

app.get("/campgrounds/:id/comments/new", isLoggedIn, function(request, response) {
   Campground.findById(request.params.id, function(err, campground){
      if(err){
          console.log(err);
      } 
      else{
          response.render("comments/new", {campground: campground});
      }
   });
});

app.get("/register", function(request, response) {
   response.render("register"); 
});

app.get("/login", function(request, response) {
   response.render("login"); 
});

app.get("/logout", function(request, response) {
   request.logout();
   response.redirect("/campgrounds");
});

app.post("/campgrounds", function(request, response){
   var name = request.body.name;
   var image = request.body.image;
   var desc = request.body.description;
   var newCampground = { name: name, image: image, description: desc};
   
   Campground.create(newCampground, function(err, newlyCreated){
      if(err){
          console.log(err);
      }
      else{
          response.redirect("campgrounds/campgrounds");
      }
   });
});

app.post("/campgrounds/:id/comments", isLoggedIn, function(request, response){
   Campground.findById(request.params.id, function(err, campground){
      if(err){
          console.log(err);
          response.redirect("/campgrounds");
      }
      else{
          Comment.create(request.body.comment, function(err, comment){
             if(err){
                 console.log(err);
             } 
             else{
                 campground.comments.push(comment);
                 campground.save();
                 response.redirect("/campgrounds/"+campground._id);
             }
          });
      }
   });
});

app.post("/register", function(request, response) {
   var newUser = new User({username: request.body.username});
   User.register(newUser, request.body.password, function(err,user){
       if(err){
           console.log(err);
           return response.render("register");
       }
       passport.authenticate("local")(request, response, function(){
          response.redirect("/campgrounds"); 
       });
   }); 
});

app.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login"
    }), 
    function(request, response) {
});

function isLoggedIn(request, response, next){
    if(request.isAuthenticated()){
        return next();
    }
    response.redirect("/login");
}

app.listen(process.env.PORT, process.env.IP, function(){
   console.log("Server Started!!!"); 
});