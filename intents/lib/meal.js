const haversine = require('haversine')

class Meal {
  static fromJson (orgInfo) {
    return orgInfo.meals
      .map((meal) => new Meal(Object.assign({}, orgInfo, meal)))
  }

  constructor ({address, organizationName, program, startTime, endTime, dayOfWeek, type, notes, latitude, longitude}) {
    this.address = address
    this.organizationName = organizationName
    this.program = program
    this.startTime = startTime
    this.endTime = endTime
    this.dayOfWeek = dayOfWeek
    this.type = type
    this.notes = notes
    this.latitude = latitude
    this.longitude = longitude
  }

  addDistanceFrom (location) {
    this.location = location
    this.distance = haversine(location, this)
  }

  endsIn() {
    return `45 min`
  }

  walkTime() {
    return `${Math.ceil((this.distance / 4) * 60)} min`
  }
}

module.exports = Meal
