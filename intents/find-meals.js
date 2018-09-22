const moment = require("moment");
const DialogActions = require("./lib/dialog-actions");
const Location = require("./lib/location");
const DataLoader = require("./lib/data-loader");
const MealFinder = require("./lib/meal-finder");

class LocationFinder {
  constructor(event) {
    this.event = event;
    this.slots = event.currentIntent.slots;
  }

  async getLocation() {
    const location =
      (await this.getKnownLocation()) ||
      (await this.getLocationFromGps()) ||
      (await this.getLocationFromSlots());

    return location;
  }

  async getKnownLocation() {
    if (!this.slots.Latitude || !this.slots.Longitude) return null;

    try {
      return await Location.fromCoords({
        latitude: this.slots.Latitude,
        longitude: this.slots.Longitude
      });
    } catch (error) {
      return null;
    }
  }

  async getLocationFromGps() {
    //if (this.slots.useGPS === "No") return;
    try {
      if (this.event.sessionAttributes.userPosition == null) return;
    } catch (error) {}

    try {
      const parsedLocation = JSON.parse(
        this.event.sessionAttributes.userPosition
      );
      return await Location.fromCoords(parsedLocation);
    } catch (error) {
      return false;
    }
  }

  async getLocationFromSlots() {
    if (
      this.slots.Intersection === undefined ||
      this.slots.Intersection === null
    )
      return null;

    try {
      return await Location.fromAddress(this.slots.Intersection + " Toronto");
    } catch (error) {
      return null;
    }
  }
}

class TimeParser {
  constructor(event) {
    this.event = event;
    this.slots = event.currentIntent.slots;
  }

  getTime() {
    if (this.slots.Date && this.slots.Time) return;

    if (this.slots.mealNow === "Now") {
      this.slots.Date = moment().format("YYYY-MM-DD");
      this.slots.Time = moment().format("HH:mm");
    }
  }
}

class Validator {
  constructor(event) {
    this.event = event;
    this.slots = event.currentIntent.slots;
    this.sessionAttributes = event.sessionAttributes;
    this.locationConfirmed = false;

    // if (this.event.inputTranscript === "Yes, allow GPS Location") {
    //   this.slots.useGPS = "Yes";
    // } else if (this.event.inputTranscript === "No, don't allow GPS Location") {
    //   this.slots.useGPS = "No";
    // }
  }

  async validate() {
    const location = await new LocationFinder(this.event).getLocation();
    const time = new TimeParser(this.event).getTime();
    return this.validateLocation(location);
  }

  validateLocation(location) {
    if (location == null) {
      return DialogActions.delegate(this.slots);
    }

    if (location.isUnknown()) {
      return DialogActions.fulfill(
        "I am sorry, I do not know where that is. Is it in Toronto?"
      );
    }

    if (location.isOutsideToronto()) {
      return DialogActions.fail(
        "Sorry, we are only serving Toronto at the moment."
      );
    }

    if (this.event.currentIntent.confirmationStatus === "None") {
      return DialogActions.confirmAddress(
        { ...this.slots },
        this.event.sessionAttributes,
        this.event.currentIntent.name,
        location.address
      );
    } else if (
      !this.locationConfirmed &&
      this.event.currentIntent.confirmationStatus === "Denied"
    ) {
      return DialogActions.elicitSlot(
        this.event.sessionAttributes,
        "Intersection",
        this.event.currentIntent.name,
        { ...this.slots }
      );
    } else {
      this.locationConfirmed = true;
      return DialogActions.delegate({
        ...this.slots,
        Latitude: location.latitude,
        Longitude: location.longitude,
        Intersection: location.address
      });
    }
  }
}

exports.validations = async (event, context, callback) => {
  try {
    const validator = new Validator(event);
    let response = await validator.validate();
    callback(null, response);
  } catch (err) {
    callback(err);
  }
};

function formatMeals(closestMeals) {
  const mealString = closestMeals
    .map(meal => `${meal.organizationName}`)
    .join("\n");

  return mealString;
}

exports.fulfillment = async (event, context, callback) => {
  const location = await new LocationFinder(event).getLocation();
  const meals = DataLoader.meals();
  const mealFinder = new MealFinder(meals, location);
  const closestMeals = mealFinder.find(1);

  if (closestMeals.length === 0) {
    callback(null, DialogActions.fulfill("There are no meals available."));
  } else {
    const formattedMeals = formatMeals(closestMeals);
    const meal = meals[0];
    const mealString =
      `The meal closest to you is ${formattedMeals} at ${meal.address}.` +
      `The meal is ending in ${meal.endsIn()}, and it’s a ${meal.walkTime()} walk from where you are.`;

    //callback(null, DialogActions.fulfill(mealString));
    callback(
      null,
      DialogActions.displayMoreResult(
        event.currentIntent.slots,
        event.sessionAttributes,
        event.currentIntent.name,
        mealString,
        meal.address
      )
    );
  }
};
