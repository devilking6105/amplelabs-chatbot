const request = require("request");
const moment = require("moment");

class MealFinder {
  constructor(meals, location, date, time, age, gender) {
    this.meals = meals;
    this.location = location;
    this.date = date;
    this.time = time;
    this.gender = gender;
    this.age = age;
    this.mealsInTime = [];
    this.mealsLaterTime = [];

    if (gender == "Female") {
      this.gender = "female";
    } else if (gender == "Skip") {
      this.gender = "mix";
    } else if (gender == "LGBTQ") {
      this.gender = "LGBTO";
    } else if (gender == "Male") {
      this.gender = "mix";
    } else if (gender == "" || gender == null) {
      this.gender = "mix";
    }
  }

  confirmAge(userAge, ageRange) {
    return ageRange[0] != null && ageRange[1] != null
      ? userAge >= ageRange[0] && userAge <= ageRange[1]
      : false;
  }

  findAlt() {
    if (this.location.isOutsideToronto() || this.location.isUnknown()) {
      return [];
    }

    this.meals.forEach(meal => {
      meal.addTimeDiff(this.time);
      if (meal.age[0] != null && meal.age[1] != null) {
        if (
          meal.gender === this.gender &&
          meal.dayOfWeek.includes(this.date) &&
          this.confirmAge(this.age, meal.age)
        ) {
          meal.addDistanceFrom(this.location);
          this.mealsInTime.push(meal);
        }
      } else {
        if (meal.gender === this.gender && meal.dayOfWeek.includes(this.date)) {
          meal.addDistanceFrom(this.location);
          this.mealsInTime.push(meal);
        }
      }
    });

    if (this.mealsInTime.length > 0) {
      return this.mealsInTime.sort((x, y) =>
        x.startTime < y.startTime ? -1 : 1
      );
    } else {
      return this.mealsInTime;
    }
  }

  getTravelInfo(origin, dest) {
    console.log("function called");
    return new Promise((resolve, reject) => {
      request(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&key=${
          process.env.GOOGLE_MAPS_KEY
        }`,
        { json: true },
        (err, res, body) => {
          if (err) {
            reject(err);
          }
          resolve(body.routes[0].legs[0].duration.value / 60);
        }
      );
    });
  }

  async find() {
    if (this.location.isOutsideToronto() || this.location.isUnknown()) {
      return [];
    }

    this.meals.forEach(meal => {
      meal.addTimeDiff(this.time);
      if (meal.age[0] != null && meal.age[1] != null) {
        if (
          meal.startTime <= this.time &&
          this.time < meal.endTime &&
          meal.gender === this.gender &&
          meal.dayOfWeek.includes(this.date) &&
          this.confirmAge(this.age, meal.age)
        ) {
          meal.addDistanceFrom(this.location);
          this.mealsInTime.push(meal);
        } else if (
          meal.startTime > this.time &&
          this.gender === this.gender &&
          meal.dayOfWeek.includes(this.date) &&
          this.confirmAge(this.age, meal.age)
        ) {
          meal.addDistanceFrom(this.location);
          this.mealsLaterTime.push(meal);
        }
      } else {
        if (
          (meal.startTimeDiff >= 0 ||
            (meal.startTime < this.time && this.time < meal.endTime)) &&
          meal.gender === this.gender &&
          meal.dayOfWeek.includes(this.date)
        ) {
          meal.addDistanceFrom(this.location);
          this.mealsInTime.push(meal);
        } else if (
          meal.startTime > this.time &&
          meal.gender === this.gender &&
          meal.dayOfWeek.includes(this.date)
        ) {
          meal.addDistanceFrom(this.location);
          this.mealsLaterTime.push(meal);
        }
      }
    });

    if (this.mealsInTime.length > 0) {
      let removeIndex = [];
      let adjustCounter = 0;
      for (var i = 0; i < this.mealsInTime.length; i++) {
        let meal = this.mealsInTime[i];
        if (meal.endTimeDiff <= 30) {
          if (
            (await this.getTravelInfo(this.location, meal.address)) >
            meal.endTimeDiff
          )
            removeIndex.push(i);
        }
      }
      for (var i = 0; i < removeIndex.length; i++) {
        this.mealsInTime.splice(removeIndex[i] - adjustCounter, 1);
        adjustCounter++;
      }
      this.mealsInTime.sort((x, y) => (x.distance < y.distance ? -1 : 1));
      if (this.mealsLaterTime > 0) {
        this.mealsLaterTime.sort((x, y) =>
          x.startTime < y.startTime ? -1 : 1
        );
      }
      this.mealsInTime.push(...this.mealsLaterTime);
      return this.mealsInTime;
    } else {
      this.mealsInTime.push(...this.mealsLaterTime);
      return this.mealsInTime;
    }
  }
}

module.exports = MealFinder;
