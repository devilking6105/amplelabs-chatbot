class MealFinder {
  constructor (meals, location) {
    this.meals = meals
    this.location = location
  }

  find (numberOfMeals = 1) {
    if (this.location.isOutsideToronto() || this.location.isUnknown()) { return [] }

    this.meals
      .forEach((meal) => meal.addDistanceFrom(this.location))

    return this.meals
      .sort((x, y) => x.distance - y.distance)
      .slice(0, numberOfMeals)
  }
}

module.exports = MealFinder
