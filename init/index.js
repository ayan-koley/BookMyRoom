const mongoose = require("mongoose");
const Hotel = require("../module/listings");
const hotelData = require("./data");

Hotel.insertMany(hotelData.data)
  .then((res) => {
    console.log("data successfully store");
  })
  .catch((err) => {
    console.log(err.name);
  });
