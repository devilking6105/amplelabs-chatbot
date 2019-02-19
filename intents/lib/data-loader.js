// const mealInfoFile = require("../../data/meal.json");
const mealInfoFile = require("../../data/mock-meals-50.json");
const Meal = require("./meal");

module.exports = {
  meals: async (mealInfo = mealInfoFile) => { // <- why async here??
    const concat = (x, y) => x.concat(y);
    const flatMap = (xs, f) => xs.map(f).reduce(concat, []);
    return flatMap(mealInfo, orgInfo => Meal.fromJson(orgInfo));
  }
};
