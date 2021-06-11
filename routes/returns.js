const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { Rental } = require("../models/rental");
const { Movie } = require("../models/movie");
const express = require("express");
const router = express.Router();
const Joi = require("joi");

router.post("/", [auth, validate(validateReturn)], async (req, res) => {
  const rental = await Rental.lookup(req.body.customerId, req.body.movieId);
  if (!rental) res.status(404).send("Rental not found.");

  if (rental.dateReturned) res.status(400).send("Return already processed");

  rental.return();

  await rental.save();

  await Movie.updateOne(
    { _id: rental.movie._id },
    { $inc: { numberInStock: 1 } }
  );
  return res.send(rental);
});
function validateReturn(req) {
  const schema = Joi.object({
    customerId: Joi.objectId().required(),
    movieId: Joi.objectId().required(),
  });
  const result = schema.validate(req);
  return result;
}
module.exports = router;
