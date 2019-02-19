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
          (meal.startTimeDiff >= 0 ||
            (meal.startTime < this.time && this.time < meal.endTime)) &&
          meal.gender === this.gender &&
          meal.dayOfWeek.includes(this.date) &&
          this.confirmAge(this.age, meal.age)
        ) {
          meal.addDistanceFrom(this.location);
          this.mealsInTime.push(meal);
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

      const diffTime= (t1, t2) => {
        const t1m = moment().hour(t1.split(':')[0]).minute(t1.split(':')[1])
        const t2m = moment().hour(t2.split(':')[0]).minute(t2.split(':')[1])
        // console.log(Math.abs(t1m.diff(t2m)))
        return Math.abs(t1m.diff(t2m))
      }
      // parameter to tune
      const a = 1
      const b = 10000000000 // the magnitude between time and space is huge!!
      return this.mealsInTime.sort((x, y) =>
        (a*diffTime(this.time, x.startTime) + (b*x.distance)) < 
        (a*diffTime(this.time, y.startTime) + (b*y.distance)) ? -1 : 1
      );
    } else {
      return this.mealsInTime;
    }
  }
}

module.exports = MealFinder;
