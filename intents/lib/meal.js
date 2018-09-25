const haversine = require("haversine");
const moment = require("moment-timezone");

class Meal {
  static fromJson(orgInfo) {
    return orgInfo.meals.map(
      meal => new Meal(Object.assign({}, orgInfo, meal))
    );
  }

  constructor(m) {
    this.address = m.address;
    this.organizationName = m.organizationName;
    this.program = m.program;
    this.startTime = m.startTime;
    this.endTime = m.endTime;
    this.dayOfWeek = m.dayOfWeek;
    this.type = m.type;
    this.notes = m.notes;
    this.latitude = m.latitude;
    this.longitude = m.longitude;
    this.gender = m.gender;
    this.age = m.age;
    this.race = m.race;
    this.distance = m.distance;
    this.toMealStartTime = m.toMealStartTime;
    this.toMealEndTime = m.toMealEndTime;
  }

  addDistanceFrom(location) {
    this.location = location;
    this.distance = haversine(location, this, { unit: "meter" });
  }

  // add 'time distance here'
  addTimeMetrics(timeIn) {
    if (timeIn === null || timeIn === undefined) {
      // use meal start and end time instead
      // undefined / null for toMealStartTime / toMealEndTime indicated no meal found
      this.toMealStartTime = null;
      this.toMealEndTime = null;
      return null;
    }
    // put output in mins
    // console.log(moment(this.startTime,"HH:mm").tz("America/Toronto").format("HH:mm"))
    // console.log(moment(this.endTime,"HH:mm").tz("America/Toronto").format("HH:mm"))
    // console.log(now.tz("America/Toronto").format("HH:mm"))

    // console.log(`startin: ${this.toMealStartTime}`)
  }

  startsIn() {
    const msecToMin = 1.0 / 1000.0 / 60.0;
    const now = () => {
      const tmp = moment(t, "HH:mm").tz("America/Toronto");
      // console.log(tmp.isValid())
      // console.log(tmp.format("HH:mm"))
      if (!tmp.isValid()) {
        return moment().tz("America/Toronto"); // make a global constant js file for this
      }
      return tmp;
    };
    this.toMealStartTime = Math.floor(
      moment(this.startTime, "HH:mm")
        .tz("America/Toronto")
        .diff(now) * msecToMin
    );
    return this.toMealStartTime;
  }

  endsIn() {
    const msecToMin = 1.0 / 1000.0 / 60.0;
    const now = () => {
      const tmp = moment(t, "HH:mm").tz("America/Toronto");
      // console.log(tmp.isValid())
      // console.log(tmp.format("HH:mm"))
      if (!tmp.isValid()) {
        return moment().tz("America/Toronto"); // make a global constant js file for this
      }
      return tmp;
    };

    this.toMealEndTime = Math.floor(
      moment(this.endTime, "HH:mm")
        .tz("America/Toronto")
        .diff(now) * msecToMin
    );
    return this.toMealEndTime;
  }

  startsInText() {
    const msecToMin = 1.0 / 1000.0 / 60.0;
    const now = () => {
      const tmp = moment(t, "HH:mm").tz("America/Toronto");
      // console.log(tmp.isValid())
      // console.log(tmp.format("HH:mm"))
      if (!tmp.isValid()) {
        return moment().tz("America/Toronto"); // make a global constant js file for this
      }
      return tmp;
    };

    this.toMealStartTime = Math.floor(
      moment(this.startTime, "HH:mm")
        .tz("America/Toronto")
        .diff(now) * msecToMin
    );

    if (this.toMealStartTime > 0) {
      if (this.toMealStartTime < 59) {
        return `is starting in ${this.toMealStartTime} min`;
      } else {
        return `is starting in ${Math.floor(
          this.toMealStartTime / 60.0
        )} hr and ${Math.floor(this.toMealStartTime % 60.0)} min`;
      }
    } else {
      return `started ${-this.toMealStartTime} min ago`;
    }
  }

  endsInText() {
    const msecToMin = 1.0 / 1000.0 / 60.0;
    const now = () => {
      const tmp = moment(t, "HH:mm").tz("America/Toronto");
      // console.log(tmp.isValid())
      // console.log(tmp.format("HH:mm"))
      if (!tmp.isValid()) {
        return moment().tz("America/Toronto"); // make a global constant js file for this
      }
      return tmp;
    };

    this.toMealEndTime = Math.floor(
      moment(this.endTime, "HH:mm")
        .tz("America/Toronto")
        .diff(now) * msecToMin
    );

    if (this.toMealEndTime > 0 && this.toMealEndTime < 59) {
      return `finishing in ${this.toMealEndTime} min`;
    } else {
      return `finishing in ${Math.floor(
        this.toMealEndTime / 60.0
      )} hr and ${Math.floor(this.toMealEndTime % 60.0)} min`;
    }
  }

  walkTime() {
    const avgWalkingSpeed = 1.3; // m/sec (see google)
    return Math.ceil((this.distance * avgWalkingSpeed) / 60.0);
  }

  walkTimeText() {
    return `${this.walkTime()} min`;
  }
}

module.exports = Meal;
