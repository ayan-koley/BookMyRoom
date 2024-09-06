const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const ExpressError = require("./util/ExpressError");
const Hotel = require("./module/listings");
const wrapAsync = require("./util/wrapAsync");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
// sesstion & mongo-store
const session = require("express-session");
// const mongoStore = require("connect-mongo");
// authentication
const passport = require("passport");
const LocalStatergy = require("passport-local");
const User = require("./module/Users");

const app = express();

app.set("view engine", "ejs");
app.engine("ejs", ejsMate);
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));

// session
const sessionOption = {
  secret: "supersecrectcode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};
app.use(session(sessionOption));
// 1st passport initialize
app.use(passport.initialize());
app.use(passport.session());
// 2nd new LocalStatergy
passport.use(new LocalStatergy(User.authenticate()));
// 3rd
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// localy user
app.use((req, res, next) => {
  res.locals.currUser = req.user;
  console.log(res);
  next();
})



app.get(
  "/home",
  wrapAsync(async (req, res) => {
    let allData = await Hotel.find({});
    res.render("hotels/index.ejs", { allData });
  })
);
app.get(
  "/hotels/show/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    let data = await Hotel.findById(id);
    if (!data) {
      return res.redirect("/home");
    }
    res.render("hotels/show.ejs", { data });
  })
);
app.get(
  "/hotels/edit/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    let data = await Hotel.findById(id);
    res.render("hotels/edit.ejs", { data });
  })
);
app.patch(
  "/hotels/edit/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const data = await Hotel.findByIdAndUpdate(id, { ...req.body.hotel });
    res.redirect(`/hotels/show/${id}`);
  })
);
app.delete(
  "/hotels/delete/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const del = await Hotel.findByIdAndDelete(id);
    res.redirect("/home");
  })
);
app.get("/home/signUp", (req, res) => {
  res.render("users/signUp.ejs");
});
app.post(
  "/home/signUp",
  // wrapAsync(async (req, res) => {
  //   let { username, email, password } = req.body;
  //   let newUser = new User({
  //     username,
  //     email,
  //   });
  //   const save = await User.register(newUser, password);
  // })
  async (req, res) => {
    try {
      let { username, email, password } = req.body;
      let newUser = new User({
        username,
        email,
      });
      const registerUser = await User.register(newUser, password);
      req.login(registerUser, (err) => {
        if (err) {
          return next(err);
        } else {
          res.redirect("/home");
        }
      });
    } catch (error) {
      res.redirect("/home/signUp");
    }
  }
);
app.get(
  "/home/login",
  wrapAsync((req, res) => {
    res.render("users/login.ejs");
  })
);

// Login Route with Passport Middleware
app.post('/home/login', passport.authenticate('local', {
  failureRedirect: '/home/login', // Redirect to login page on failure
}), (req, res) => {
  // If authentication was successful, redirect to the home page
  res.redirect('/home');
});

app.get("/home/logout", (req, res, next) => {
  req.logOut((err) => {
    return next(err);
  })
  return res.redirect("/home");
})



// Eroor handling section

app.get("*", (err, req, res) => {
  throw new ExpressError(404, "Page not found");
});
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something Went Wrong" } = err;
  res.status(statusCode).render("hotels/error.ejs", { message });
});

app.listen(8080, () => {
  console.log("server is started at 8080 port");
});
