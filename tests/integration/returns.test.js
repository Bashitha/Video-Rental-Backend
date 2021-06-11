const { User } = require("../../models/user");
const { Rental } = require("../../models/rental");
const { Movie } = require("../../models/movie");
const mongoose = require("mongoose");
const request = require("supertest");
const moment = require("moment");

describe("POST /api/returns", () => {
  let server;
  let rental;
  let customerId;
  let movieId;
  let token;
  let movie;
  exec = () => {
    return request(server)
      .post("/api/returns")
      .set("x-auth-token", token)
      .send({ customerId, movieId });
  };
  beforeEach(async () => {
    server = require("../../index");
    customerId = mongoose.Types.ObjectId();
    movieId = mongoose.Types.ObjectId();
    token = new User().generateAuthToken();

    movie = new Movie({
      _id: movieId,
      title: "12345",
      genre: { name: "12345" },
      numberInStock: 10,
      dailyRentalRate: 2,
    });
    await movie.save();

    rental = new Rental({
      customer: {
        _id: customerId,
        name: "12345",
        phone: "12345",
      },
      movie: {
        _id: movieId,
        title: "12345",
        dailyRentalRate: 2,
      },
    });
    await rental.save();
  });
  afterEach(async () => {
    await server.close();
    await Rental.remove({});
    await Movie.remove({});
  });
  it("should return 401 if the client is not logged in", async () => {
    token = "";
    const res = await exec();
    expect(res.status).toBe(401);
  });
  it("should return 400 if customerId is not provided", async () => {
    customerId = "";
    const res = await exec();
    expect(res.status).toBe(400);
  });
  it("should return 400 if movieId is not provided", async () => {
    movieId = "";
    const res = await exec();
    expect(res.status).toBe(400);
  });
  it("should return 404 if no rental found for the given customerId and movieId", async () => {
    await Rental.remove({});
    const res = await exec();
    expect(res.status).toBe(404);
  });
  it("should return 400 if return is already processed", async () => {
    rental.dateReturned = new Date();
    await rental.save();
    const res = await exec();
    expect(res.status).toBe(400);
  });
  it("should return 200 if we have a valid request", async () => {
    const res = await exec();
    expect(res.status).toBe(200);
  });
  it("should set dateReturned if we have a valid request", async () => {
    const res = await exec();
    const rentalInDb = await Rental.findById(rental._id);
    const diff = new Date() - rentalInDb.dateReturned;
    expect(diff).toBeLessThan(10 * 1000);
  });
  it("should calculate the rental fee if we have a valid request", async () => {
    rental.dateOut = moment().add(-7, "days");
    rental.save();

    const res = await exec();
    const rentalInDb = await Rental.findById(rental._id);
    const rentalFee =
      moment().diff(rentalInDb.dateOut, "days") *
      rentalInDb.movie.dailyRentalRate;
    expect(rentalInDb.rentalFee).toBe(rentalFee);
  });
  it("should increment the movie stock if we have a valid request", async () => {
    const res = await exec();
    const movieInDb = await Movie.findById(movieId);
    expect(movieInDb.numberInStock).toBe(movie.numberInStock + 1);
  });
  it("should return the rental if we have a valid request", async () => {
    const res = await exec();
    expect(Object.keys(res.body)).toEqual(
      expect.arrayContaining([
        "customer",
        "movie",
        "dateOut",
        "dateReturned",
        "rentalFee",
      ])
    );
  });
});
