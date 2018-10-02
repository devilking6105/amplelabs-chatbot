const haversine = require("haversine");
const moment = require("moment");

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
    this.phonenumber = m.phone_number;
  }

  addDistanceFrom(location) {
    this.location = location;
    this.distance = haversine(location, this, { unit: "meter" });
  }

  addTimeDiff(time) {
    const msecToMin = 1.0 / 1000.0 / 60.0;
    this.startTimeDiff =
      moment(this.startTime, "HH:mm").diff(moment(time, "HH:mm")) * msecToMin;
    this.endTimeDiff =
      moment(this.endTime, "HH:mm").diff(moment(time, "HH:mm")) * msecToMin;
  }

  startsInText(isNow) {
    if (isNow) {
      if (this.startTimeDiff >= 0) {
        return `is starting in ${this.startTimeDiff} min`;
      } else if (this.endTimeDiff <= 60) {
        return `is ending in ${this.endTimeDiff} min`;
      }
    } else {
      const start = moment(this.startTime, "HH:mm").format("h:mm");
      const end = moment(this.endTime, "HH:mm").format("h:mm");
      return `will be served between ${start} to ${end}`;
    }
  }

  walkTime() {
    const avgWalkingSpeed = 1.3; // m/sec (see google)
    return Math.ceil((this.distance * avgWalkingSpeed) / 60.0);
  }

  walkTimeText() {
    return `${this.walkTime()} min`;
  }

  phoneNumber() {
    return `Please call ${this.phonenumber} to check`;
  }
}

module.exports = Meal;
