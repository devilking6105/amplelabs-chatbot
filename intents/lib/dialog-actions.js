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

  static displayResultNav(
    slots,
    sessionAttributes,
    intentName,
    slotName,
    content,
    mealAddress
  ) {
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
              title: "Direction",
              subTitle: "Direction",
              attachmentLinkUrl:
                "https://www.google.com/maps/dir/?api=1&origin=" +
                slots.Intersection +
                "%20Toronto&destination=" +
                mealAddress +
                "&travelmode=walking"
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
          content: `From your response, I see that you are at ${address}. Did I get that right?`
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
                  text: "Yes, that's right",
                  value: "Yes"
                },
                {
                  text: "No, wrong location",
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

  static delegate(slots) {
    return {
      dialogAction: {
        type: "Delegate",
        slots
      }
    };
  }
}

module.exports = DialogActions;
