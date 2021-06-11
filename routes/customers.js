const express = require("express");
const router = express.Router();
const { Customer, validateCustomer } = require("../models/customer");
const validate = require("../middleware/validate");

router.get("/", async (req, res) => {
  const customers = await Customer.find().sort({ name: 1 });
  res.send(customers);
});

router.get("/:id", async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer)
    return res.status(404).send("The customer with the given Id not found.");

  res.send(customer);
});

router.post("/", validate(validateCustomer), async (req, res) => {
  const customer = new Customer({
    name: req.body.name,
    isGold: req.body.isGold,
    phone: req.body.phone,
  });
  await customer.save();
  res.send(customer);
});

router.put("/:id", validate(validateCustomer), async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    { name: req.body.name, phone: req.body.phone, isGold: req.body.isGold },
    { new: true }
  );
  if (!customer)
    return res.status(404).send("The customer with the given Id not found.");

  res.send(customer);
});

router.delete("/:id", async (req, res) => {
  const customer = await Customer.findByIdAndRemove(req.params.id);
  if (!customer)
    return res.status(404).send("The customer with the given Id not found.");

  res.send(customer);
});

module.exports = router;
