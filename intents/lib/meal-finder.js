class MealFinder {
  constructor(meals, location, date, time, age, gender) {
    this.meals = meals;
    this.location = location;
    this.date = date;
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
        if (
          (meal.notes.includes("youth") || meal.gender === this.gender) &&
          meal.dayOfWeek.includes(this.date)
        ) {
          meal.addDistanceFrom(this.location);
          this.mealsInTime.push(meal);
        }
      } else {
        if (this.gender != null) {
          if (
            meal.gender === this.gender &&
            meal.dayOfWeek.includes(this.date)
          ) {
            meal.addDistanceFrom(this.location);
            this.mealsInTime.push(meal);
          }
        } else {
          if (
            (meal.startTimeDiff >= 0 ||
              (meal.startTime < this.time &&
                this.time < meal.endTime &&
                meal.endTimeDiff >= 30)) &&
            meal.gender === "mix" &&
            meal.dayOfWeek.includes(this.date)
          ) {
            meal.addDistanceFrom(this.location);
            this.mealsInTime.push(meal);
          }
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

  async findCloserTime() {
    if (this.location.isOutsideToronto() || this.location.isUnknown()) {
      return [];
    }

    this.meals.forEach(meal => {
      meal.addTimeDiff(this.time);

      //if user didn't want to disclose about their gender, get mix gender options
      if (
        meal.startTimeDiff >= 0 &&
        meal.gender === "mix" &&
        meal.dayOfWeek.includes(this.date)
      ) {
        meal.addDistanceFrom(this.location);
        this.mealsInTime.push(meal);
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
            (meal.endTimeDiff <= 60 && meal.endTimeDiff >= 30)) &&
          (meal.notes.includes("youth") || meal.gender === this.gender) &&
          meal.dayOfWeek.includes(this.date)
        ) {
          meal.addDistanceFrom(this.location);
          this.mealsInTime.push(meal);
        }
      } else {
        //if the user is not youth, filter the result by gender
        if (this.gender != null) {
          if (
            ((meal.startTimeDiff <= 60 && meal.startTimeDiff >= 0) ||
              (meal.endTimeDiff <= 60 && meal.endTimeDiff >= 30)) &&
            meal.gender === this.gender &&
            meal.dayOfWeek.includes(this.date)
          ) {
            meal.addDistanceFrom(this.location);
            this.mealsInTime.push(meal);
          }
        } else {
          //if user didn't want to disclose about their gender, get mix gender options
          if (
            (meal.startTimeDiff >= 0 ||
              (meal.startTime < this.time &&
                this.time < meal.endTime &&
                meal.endTimeDiff >= 30)) &&
            meal.gender === "mix" &&
            meal.dayOfWeek.includes(this.date)
          ) {
            meal.addDistanceFrom(this.location);
            this.mealsInTime.push(meal);
          }
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
}

module.exports = MealFinder;
