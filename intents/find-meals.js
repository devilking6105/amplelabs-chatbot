const moment = require("moment-timezone");
const DialogActions = require("./lib/dialog-actions");
const Location = require("./lib/location");
const DataLoader = require("./lib/data-loader");
const MealFinder = require("./lib/meal-finder");
const parseTime = require("./lib/getTime");
const startDura = new Date().getTime();
let location;
let meals;
let mealCounter = 0;
let mealFinder;
let meal;
let closestMeals;

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

    if (this.slots.Confirmed !== "true" && this.slots.Intersection != null)
      return null;

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
    if (this.slots.useGPS === "No") return;

    if (this.slots.Confirmed !== "true" && this.slots.Intersection != null) {
      return;
    } else if (this.slots.Intersection != null) {
      return;
    } else {
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
  }

  async getLocationFromSlots() {
    if (this.slots.Intesection != null) return;

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
    this.now = ["now", "yes", "yeah", "ya"];
  }

  getTime() {
    if (
      this.slots.mealNow != null &&
      this.now.includes(this.slots.mealNow.toLowerCase())
    ) {
      this.slots.Date = moment()
        .tz("America/New_York")
        .format("YYYY-MM-DD");
      this.slots.Time = moment()
        .tz("America/New_York")
        .format("HH:mm");
    }
  }
}

class Validator {
  constructor(event) {
    this.event = event;
    this.slots = event.currentIntent.slots;
    this.sessionAttributes = event.sessionAttributes;
    this.yes = ["yes", "yeah", "sure", "okay"];
    this.no = ["no", "nah"];
    this.now = ["now", "yes", "yeah", "ya"];
  }

  async validate() {
    // if (
    //   this.slots.mealNow == null &&
    //   this.slots.Date == null &&
    //   this.slots.Time == null
    // ) {
    //   return DialogActions.buttonElicitSlot(
    //     this.event.sessionAttributes,
    //     "mealNow",
    //     this.event.currentIntent.name,
    //     this.slots,
    //     "Are you looking for meals now?",
    //     "now or later?",
    //     ["Yes, it's for now.", "No, it's for a later time."],
    //     ["Now", "Later"]
    //   );
    // }

    if (this.slots.useGPS == null) {
      return DialogActions.buttonElicitSlot(
        this.event.sessionAttributes,
        "useGPS",
        this.event.currentIntent.name,
        this.slots,
        "Can I use your current location?",
        null,
        ["Yes", "No"],
        ["Yes", "No"]
      );
    }

    if (
      this.slots.ShowMore == null &&
      this.slots.Date == null &&
      this.slots.Time == null
    ) {
      this.slots.mealNow = "now";
    }

    if (this.slots.useGPS === "No" && this.slots.Intersection == null) {
      return DialogActions.elicitSlot(
        this.sessionAttributes,
        "Intersection",
        this.event.currentIntent.name,
        this.slots,
        "I need a location to recommend a meal for you. ## Can you give me a intersection or landmark? E.g. Dundas and Yonge or King Station."
      );
    }

    const location = await new LocationFinder(this.event).getLocation();

    if (
      this.slots.useGPS === "Yes" &&
      this.event.currentIntent.confirmationStatus === "None" &&
      this.slots.Confirmed !== "true"
    ) {
      return DialogActions.confirmAddress(
        { ...this.slots },
        this.event.sessionAttributes,
        this.event.currentIntent.name,
        location.address
      );
    }

    const time = new TimeParser(this.event).getTime();

    if (this.slots.Time == null) {
      return DialogActions.delegate(this.slots, this.event.sessionAttributes);
    }

    //Eligibility flow start

    // if (
    //   (this.slots.Eligibility == null && this.slots.Gender == null) ||
    //   (this.slots.Eligibility == null && this.slots.Age == null) ||
    //   (this.slots.Eligibility == null &&
    //     this.slots.Gender == null &&
    //     this.slots.Age == null)
    // ) {
    //   return DialogActions.buttonElicitSlot(
    //     this.event.sessionAttributes,
    //     "Eligibility",
    //     this.event.currentIntent.name,
    //     this.slots,
    //     "Before we find a meal for you, you can answer a few more questions that might help us find a better option for you, based on your identity. ## Would you like to answer a few questions?",
    //     "Feel free to skip any questions you don’t feel comfortable answering.",
    //     ["Yes", "No"],
    //     ["Yes", "No"]
    //   );
    // }

    // if (
    //   this.slots.Eligibility != null &&
    //   this.yes.includes(this.slots.Eligibility.toLowerCase()) &&
    //   this.slots.Age == null &&
    //   this.slots.Gender == null
    // ) {
    //   return DialogActions.elicitSlot(
    //     this.event.sessionAttributes,
    //     "Age",
    //     this.event.currentIntent.name,
    //     this.slots,
    //     "How old are you?"
    //   );
    // } else if (
    //   this.slots.Eligibility != null &&
    //   this.yes.includes(this.slots.Eligibility.toLowerCase()) &&
    //   this.slots.Age != null &&
    //   this.slots.Gender == null
    // ) {
    //   return DialogActions.buttonElicitSlot(
    //     this.event.sessionAttributes,
    //     "Gender",
    //     this.event.currentIntent.name,
    //     this.slots,
    //     "What is your gender?",
    //     "Feel free to skip any questions you don’t feel comfortable answering.",
    //     ["Male", "Female", "Trans", "LGBT", "Skip"],
    //     ["male", "female", "trans", "LGBT", "mix"]
    //   );
    // } else {
    //   this.slots.Eligibility = "no";
    // }

    //Eligibility flow done

    // if (this.slots.Date == null) {
    //   return DialogActions.delegate(this.slots, this.event.sessionAttributes);
    // }

    // if (this.slots.Time == null) {
    //   this.slots.Time = parseTime.getTime(this.event.inputTranscript).miliTime;
    // }

    // if (this.slots.Time == null) {
    //   return DialogActions.delegate(this.slots, this.event.sessionAttributes);
    // }

    return this.validateLocation(location);
  }

  validateLocation(location) {
    if (location == null) {
      if (
        this.slots.mealNow != null &&
        this.now.includes(this.slots.mealNow.toLowerCase())
      ) {
        return DialogActions.delegate(this.slots, this.event.sessionAttributes);
      } else {
        return DialogActions.elicitSlot(
          this.sessionAttributes,
          "Intersection",
          this.event.currentIntent.name,
          this.slots,
          "Where will you be at that time?"
        );
      }
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

    if (
      this.event.currentIntent.confirmationStatus === "None" &&
      this.slots.Confirmed !== "true"
    ) {
      return DialogActions.confirmAddress(
        { ...this.slots },
        this.event.sessionAttributes,
        this.event.currentIntent.name,
        location.address
      );
    } else if (
      this.event.currentIntent.confirmationStatus === "Denied" &&
      this.slots.Confirmed !== "true"
    ) {
      return DialogActions.elicitSlot(
        this.event.sessionAttributes,
        "Intersection",
        this.event.currentIntent.name,
        { ...this.slots },
        "Let's try again. Can you give me an intersection, or landmark? E.g. Dundas and Yonge or King Station"
      );
    } else {
      this.slots.Confirmed = "true";
      return DialogActions.delegate(
        this.event.currentIntent.slots,
        this.event.sessionAttributes
      );
    }
  }
}

exports.validations = async (event, context, callback) => {
  try {
    mealCounter = 0;
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
  if (event.currentIntent.slots.ShowMore === "Another time") {
    try {
      event.currentIntent.slots.Time = parseTime.getTime(
        event.inputTranscript
      ).miliTime;
    } catch (e) {}

    if (event.currentIntent.slots.Time == null) {
      return DialogActions.elicitSlot(
        event.sessionAttributes,
        "Time",
        event.currentIntent.name,
        event.currentIntent.slots,
        "I couldn't catch time for meals, what time do you want to eat at?"
      );
    }
  }

  const more = ["more", "yes", "yeah", "okay", "sure", "ok", "ya", "please"];
  const now = ["now", "yes", "yeah", "ya"];
  location = await new LocationFinder(event).getLocation();
  meals = await DataLoader.meals();
  mealFinder = new MealFinder(
    meals,
    location,
    moment(event.currentIntent.slots.Date).format("ddd"),
    event.currentIntent.slots.Time,
    event.currentIntent.slots.Age,
    event.currentIntent.slots.Gender
  );
  closestMeals = await mealFinder.find();
  if (
    closestMeals.length === 0 &&
    event.currentIntent.slots.AltResult == null
  ) {
    event.currentIntent.slots.AltResult = "yes";
  }

  if (event.currentIntent.slots.ShowMore == null) {
  } else if (
    event.currentIntent.slots.ShowMore != null &&
    more.includes(event.currentIntent.slots.ShowMore.toLowerCase())
  ) {
    mealCounter++;
  }

  if (
    event.currentIntent.slots.AltResult != null &&
    more.includes(event.currentIntent.slots.AltResult.toLowerCase())
  ) {
    let date =
      event.currentIntent.slots.Time >= "20:00"
        ? moment(event.currentIntent.slots.Date)
            .add(1, "day")
            .format("ddd")
        : moment(event.currentIntent.slots.Date).format("ddd");
    mealFinder = new MealFinder(
      meals,
      location,
      date,
      event.currentIntent.slots.Time,
      event.currentIntent.slots.Age,
      event.currentIntent.slots.Gender
    );
    closestMeals = await mealFinder.findAlt();
  }

  meal = closestMeals[mealCounter];

  if (meal == null) {
    mealCounter = 0;
    return DialogActions.fulfill(`That's all meals I could find`);
  }
  mealString =
    `${
      event.currentIntent.slots.AltResult === "yes"
        ? "There's no meals available within an hour. Here's next available meal. ## "
        : ""
    }` +
    `A free meal closest to you is ${meal.organizationName} at ${
      meal.address
    }.` +
    ` ${
      event.currentIntent.slots.mealNow != null &&
      now.includes(event.currentIntent.slots.mealNow.toLowerCase())
        ? ""
        : `${moment(event.currentIntent.slots.Date).format("LL")}, `
    } ## The meal ${meal.startsInText(
      event.currentIntent.slots.mealNow != null &&
      now.includes(event.currentIntent.slots.mealNow.toLowerCase()) &&
      event.currentIntent.slots.AltResult == null
        ? true
        : false
    )} and it’s ${meal.walkTimeText()} walk from where you are. ## ${
      meal.notes === "na"
        ? "The agency serves for everyone."
        : `The agency serves people that are: <b>${meal.notes}.</b>`
    }` +
    ` You can call <a href="tel:${meal.phonenumber.substring(0, 12)}">${
      meal.phonenumber
    }</a> to find out more information.`;

  if (event.currentIntent.slots.ShowMore === "Another") {
    event.currentIntent.slots.Time = null;
    event.currentIntent.slots.ShowMore = null;
    event.currentIntent.slots.AltResult = null;
    event.currentIntent.slots.mealNow = "no";
    return DialogActions.elicitSlot(
      event.sessionAttributes,
      "Date",
      event.currentIntent.name,
      event.currentIntent.slots,
      "Okay, I can help you look for something that's at different time. What time are you looking for? E.g. Tomorrow at 1pm"
    );
  }

  if (
    event.currentIntent.slots.ShowMore != null &&
    !more.includes(event.currentIntent.slots.ShowMore.toLowerCase())
  ) {
    event.currentIntent.slots.ShowMore = "Good";
  }

  if (event.currentIntent.slots.ShowMore !== "Good") {
    return DialogActions.displayResultBtn(
      event.currentIntent.slots,
      event.sessionAttributes,
      event.currentIntent.name,
      "ShowMore",
      mealString,
      meal.address
    );
  } else {
    if (event.currentIntent.slots.InitFeedback == null) {
      return DialogActions.elicitSlot(
        {
          Intersection: event.currentIntent.slots.Intersection,
          Date: event.currentIntent.slots.Date,
          Time: event.currentIntent.slots.Time,
          Gender: event.currentIntent.slots.Gender,
          Age: event.currentIntent.slots.Age,
          Start: startDura
        },
        "Feedback",
        "FeedbackFlow",
        {
          Feedback: event.inputTranscript,
          Restart: null
        },
        "Great! Glad I could help :)! ## Do you have any feedback for me or suggestions of things I should learn?"
      );
    }
    callback(null, DialogActions.fulfill("Perfect!"));
  }
};
