const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const { User } = require("../models/user");
const validate = require("../middleware/validate");
const Joi = require("joi");

router.post("/", validate(validateAuth), async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) res.status(400).send("Invalid email or password.");

  const validatePassword = await bcrypt.compare(
    req.body.password,
    user.password
  );
  if (!validatePassword) res.status(400).send("Invalid email or password.");

  const token = user.generateAuthToken();
  res.send(token);
});

function validateAuth(req) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
  });
  return schema.validate(req);
}
module.exports = router;
