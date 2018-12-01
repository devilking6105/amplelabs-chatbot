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
        return `will begin ${
          this.startTimeDiff == 0
            ? "now"
            : `in ${
                this.startTimeDiff > 60
                  ? `${Math.floor(this.startTimeDiff / 60)} hours ${
                      this.startTimeDiff % 60 === 0
                        ? ""
                        : `and ${this.startTimeDiff % 60} minutes`
                    }`
                  : `${this.startTimeDiff} minutes`
              }`
        }`;
      } else if (this.endTimeDiff >= 30) {
        return `began at ${moment(this.startTime, "HH:mm").format(
          "h:mm"
        )}; it will end in ${
          this.endTimeDiff > 60
            ? `${Math.floor(this.endTimeDiff / 60)} hours and ${
                this.endTimeDiff % 60 === 0
                  ? ""
                  : `${this.endTimeDiff % 60} minutes`
              }`
            : `${this.endTimeDiff} minutes`
        }`;
      }
    } else {
      const start = moment(this.startTime, "HH:mm").format("HH:mm");
      const end = moment(this.endTime, "HH:mm").format("HH:mm");
      const startText = moment(this.startTime, "HH:mm").format("h:mm");
      const endText = moment(this.endTime, "HH:mm").format("h:mm");
      return `will be served between ${
        start >= "12:00" ? startText + " pm" : startText + " am"
      } to ${end >= "12:00" ? endText + " pm" : endText + " am"}`;
    }
  }

  walkTime() {
    const avgWalkingSpeed = 1.1; // m/sec (see google)
    const magicNumber = 0.7747234935;
    return Math.ceil(((this.distance * avgWalkingSpeed) / 60.0) * magicNumber);
  }

  walkTimeText() {
    return `approximately ${
      this.walkTime() > 60
        ? `${Math.floor(this.walkTime() / 60)} hours ${
            this.walkTime() % 60 === 0
              ? ``
              : ` and ${this.walkTime() % 60} minutes`
          }`
        : `${this.walkTime()} minutes`
    }`;
  }

  phoneNumber() {
    return `Please call ${this.phonenumber} to confirm the meal's availability`;
  }
}

module.exports = Meal;
