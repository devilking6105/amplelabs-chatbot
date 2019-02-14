// API Documentation: https://docs.aws.amazon.com/lex/latest/dg/lambda-input-response-format.html#using-lambda-response-format
const MapsAdapter = require("./map-adapter");

function plainMessage(content, contentType = "PlainText") {
  return { contentType, content };
}

class DialogActions {
  static fail(content) {
    return this.close(plainMessage(content), "Failed");
  }

  static fulfill(content) {
    return this.close(plainMessage(content), "Fulfilled");
  }

  static elicitSlotWithInput(
    sessionAttributes,
    slotName,
    intentName,
    slots,
    inputTranscript
  ) {
    return {
      sessionAttributes: sessionAttributes,
      dialogAction: {
        type: "ElicitSlot",
        slotToElicit: slotName,
        intentName: intentName,
        slots,
        inputTranscript: inputTranscript
      }
    };
  }

  static elicitSlot(sessionAttributes, slotName, intentName, slots, message) {
    return {
      sessionAttributes: sessionAttributes,
      dialogAction: {
        type: "ElicitSlot",
        slotToElicit: slotName,
        intentName: intentName,
        message: {
          contentType: "PlainText",
          content: message
        },
        slots
      }
    };
  }

  static close(message, fulfillmentState) {
    return {
      dialogAction: {
        type: "Close",
        fulfillmentState,
        message
      }
    };
  }

  static displayResultBtn(
    slots,
    sessionAttributes,
    intentName,
    slotName,
    content,
    mealAddress
  ) {
    let intersection =
      slots.Intersection == null
        ? null
        : slots.Intersection.replace("&", " and ");
    let directionsMap = `https://www.google.com/maps/dir/?api=1&origin=${
      slots.useGPS === "Yes" &&
      slots.Latitude != null &&
      slots.Longitude != null
        ? `${slots.Latitude},${slots.Longitude}`
        : `${intersection}%20Toronto`
    }&destination=${mealAddress}&travelmode=walking`;

    return {
      sessionAttributes,
      dialogAction: {
        type: "ElicitSlot",
        slotToElicit: slotName,
        message: {
          contentType: "PlainText",
          content: content
        },
        intentName: intentName,
        responseCard: {
          contentType: "application/vnd.amazonaws.card.generic",
          genericAttachments: [
            {
              buttons: [
                { text: "Show me more", value: "more" },
                { text: "Another time", value: "time" },
                { text: "This is fine", value: "fine" },
                { text: "Filter result", value: "result" }
              ],
              title: "Directions",
              subTitle: "Directions",
              imageUrl: MapsAdapter.mapsUrl(mealAddress),
              attachmentLinkUrl: directionsMap
            }
          ]
        },
        slots
      }
    };
  }

  static buttonElicitSlot(
    sessionAttributes,
    slotName,
    intentName,
    slots,
    message,
    cardTitle,
    btnTexts,
    btnValues
  ) {
    let textValuePair = [];
    try {
      for (let i = 0; i < btnTexts.length; i++) {
        textValuePair.push({ text: btnTexts[i], value: btnValues[i] });
      }
    } catch (e) {}

    return {
      sessionAttributes: sessionAttributes,
      dialogAction: {
        type: "ElicitSlot",
        slotToElicit: slotName,
        intentName: intentName,
        message: {
          contentType: "PlainText",
          content: message
        },
        responseCard: {
          contentType: "application/vnd.amazonaws.card.generic",
          genericAttachments: [
            {
              title: cardTitle,
              subTitle: null,
              buttons: textValuePair
            }
          ]
        },
        slots
      }
    };
  }

  static confirmAddress(slots, sessionAttributes, intentName, address) {
    const mapsUrl = MapsAdapter.mapsUrl(address);
    return {
      sessionAttributes,
      dialogAction: {
        type: "ConfirmIntent",
        message: {
          contentType: "PlainText",
          content: `Just to confirm, you are at ${address}. Did I get that right?`
        },
        intentName: intentName,
        responseCard: {
          contentType: "application/vnd.amazonaws.card.generic",
          genericAttachments: [
            {
              title: null,
              subTitle: null,
              imageUrl: mapsUrl,
              attachmentLinkUrl: mapsUrl,
              buttons: [
                {
                  text: "Yes",
                  value: "Yes"
                },
                {
                  text: "No",
                  value: "No"
                }
              ]
            }
          ]
        },
        slots
      }
    };
  }

  static delegate(slots, sessionAttributes) {
    return {
      sessionAttributes: sessionAttributes,
      dialogAction: {
        type: "Delegate",
        slots
      }
    };
  }
}

module.exports = DialogActions;
