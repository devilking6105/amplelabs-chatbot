class MealFinder {
  constructor(meals, location, time) {
    this.meals = meals;
    this.location = location;
    this.time = time;
    this.mealsInTime = [];
  }

  async find() {
    if (this.location.isOutsideToronto() || this.location.isUnknown()) {
      return [];
    }

    this.meals.forEach(meal => {
      meal.addTimeDiff(this.time);
      if (
        (meal.startTimeDiff <= 60 && meal.startTimeDiff >= 0) ||
        (meal.endTimeDiff <= 60 && meal.endTimeDiff >= 0)
      ) {
        meal.addDistanceFrom(this.location);
        this.mealsInTime.push(meal);
      }
    });

    if (this.mealsInTime.length > 0) {
      return this.mealsInTime.sort((x, y) => x.distance - y.distance);
    } else {
      return this.mealsInTime;
    }
  }
}

module.exports = MealFinder;
