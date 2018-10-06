class MealFinder {
  constructor(meals, location, time, age, gender) {
    this.meals = meals;
    this.location = location;
    this.time = time;
    this.gender = gender;
    this.age = age;
    this.mealsInTime = [];
  }

  isYouth(age) {
    return age >= 16 && age <= 24 ? true : false;
  }

  async findAlt() {
    if (this.location.isOutsideToronto() || this.location.isUnknown()) {
      return [];
    }

    this.meals.forEach(meal => {
      meal.addTimeDiff(this.time);
      if (this.isYouth(this.age)) {
        if (meal.notes.includes("youth")) {
          meal.addDistanceFrom(this.location);
          this.mealsInTime.push(meal);
        }
      } else {
        if (this.gender != null) {
          if (meal.gender === this.gender) {
            meal.addDistanceFrom(this.location);
            this.mealsInTime.push(meal);
          }
        } else {
          if (meal.gender === "mix") {
            meal.addDistanceFrom(this.location);
            this.mealsInTime.push(meal);
          }
        }
      }
    });
    if (this.mealsInTime.length > 0) {
      return this.mealsInTime.sort((x, y) => x.distance - y.distance);
    } else {
      return this.mealsInTime;
    }
  }

  async find() {
    if (this.location.isOutsideToronto() || this.location.isUnknown()) {
      return [];
    }

    this.meals.forEach(meal => {
      meal.addTimeDiff(this.time);
      //check if the user is a youth
      if (this.isYouth(this.age)) {
        if (
          ((meal.startTimeDiff <= 60 && meal.startTimeDiff >= 0) ||
            (meal.endTimeDiff <= 60 && meal.endTimeDiff >= 0)) &&
          meal.notes.includes("youth")
        ) {
          meal.addDistanceFrom(this.location);
          this.mealsInTime.push(meal);
        }
      } else {
        //if the user is not youth, filter the result by gender
        if (this.gender != null) {
          if (
            ((meal.startTimeDiff <= 60 && meal.startTimeDiff >= 0) ||
              (meal.endTimeDiff <= 60 && meal.endTimeDiff >= 0)) &&
            meal.gender === this.gender
          ) {
            meal.addDistanceFrom(this.location);
            this.mealsInTime.push(meal);
          }
        } else {
          //if user didn't want to disclose about their gender, get mix gender options
          if (
            ((meal.startTimeDiff <= 60 && meal.startTimeDiff >= 0) ||
              (meal.endTimeDiff <= 60 && meal.endTimeDiff >= 0)) &&
            meal.gender === "mix"
          ) {
            meal.addDistanceFrom(this.location);
            this.mealsInTime.push(meal);
          }
        }
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
