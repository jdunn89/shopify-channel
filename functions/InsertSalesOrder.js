let InsertSalesOrder = function (ncUtil,
                                 channelProfile,
                                 flowContext,
                                 payload,
                                 callback) {

  log("Building response object...");
  let out = {
    ncStatusCode: null,
    response: {},
    payload: {}
  };

  let invalid = false;
  let invalidMsg = "";

  //If channelProfile does not contain channelSettingsValues, channelAuthValues or salesOrderBusinessReferences, the request can't be sent
  if (!channelProfile) {
    invalid = true;
    invalidMsg = "channelProfile was not provided"
  } else if (!channelProfile.channelSettingsValues) {
    invalid = true;
    invalidMsg = "channelProfile.channelSettingsValues was not provided"
  } else if (!channelProfile.channelSettingsValues.protocol) {
    invalid = true;
    invalidMsg = "channelProfile.channelSettingsValues.protocol was not provided"
  } else if (!channelProfile.channelAuthValues) {
    invalid = true;
    invalidMsg = "channelProfile.channelAuthValues was not provided"
  } else if (!channelProfile.channelAuthValues.access_token) {
    invalid = true;
    invalidMsg = "channelProfile.channelAuthValues.access_token was not provided"
  } else if (!channelProfile.channelAuthValues.shop) {
    invalid = true;
    invalidMsg = "channelProfile.channelAuthValues.shop was not provided"
  } else if (!channelProfile.salesOrderBusinessReferences) {
    invalid = true;
    invalidMsg = "channelProfile.salesOrderBusinessReferences was not provided"
  } else if (!Array.isArray(channelProfile.salesOrderBusinessReferences)) {
    invalid = true;
    invalidMsg = "channelProfile.salesOrderBusinessReferences is not an array"
  } else if (channelProfile.salesOrderBusinessReferences.length === 0) {
    invalid = true;
    invalidMsg = "channelProfile.salesOrderBusinessReferences is empty"
  }

  //If a sales order document was not passed in, the request is invalid
  if (!payload) {
    invalid = true;
    invalidMsg = "payload was not provided"
  } else if (!payload.doc) {
    invalid = true;
    invalidMsg = "payload.doc was not provided";
  }

  //If callback is not a function
  if (!callback) {
    throw new Error("A callback function was not provided");
  } else if (typeof callback !== 'function') {
    throw new TypeError("callback is not a function")
  }

  if (!invalid) {
    const extractBusinessReference = require('../util/extractBusinessReference');

    let endPoint = "/admin/orders.json";

    let request = require('request');

    let url = channelProfile.channelSettingsValues.protocol + "://" + channelProfile.channelAuthValues.shop + endPoint;

    /*
     Format url
     */
    let headers = {
      "X-Shopify-Access-Token": channelProfile.channelAuthValues.access_token
    };

    log("Using URL [" + url + "]");

    /*
     Set URL and headers
     */
    let options = {
      url: url,
      method: "POST",
      headers: headers,
      body: payload.doc,
      json: true
    };

    try {
      // Pass in our URL and headers
      request(options, function (error, response, body) {
        if (!error) {
          log("Do InsertSalesOrder Callback");
          out.response.endpointStatusCode = response.statusCode;
          out.response.endpointStatusMessage = response.statusMessage;

          // If we have an order object, set out.payload.doc to be the order document
          if (body.order) {
            out.payload = {
              doc: body,
              salesOrderRemoteID: body.order.id,
              salesOrderBusinessReference: extractBusinessReference(channelProfile.salesOrderBusinessReferences, body),
            };

            out.ncStatusCode = 201;
          } else if (response.statusCode == 429) {
            out.ncStatusCode = 429;
            out.payload.error = body;
          } else if (response.statusCode == 500) {
            out.ncStatusCode = 500;
            out.payload.error = body;
          } else {
            out.ncStatusCode = 400;
            out.payload.error = body;
          }
          callback(out);
        } else {
          logError("Do InsertSalesOrder Callback error - " + error);
          out.ncStatusCode = 500;
          out.payload.error = error;
          callback(out);
        }
      });
    } catch (err) {
      logError("Exception occurred in InsertSalesOrder - " + err);
      out.ncStatusCode = 500;
      out.payload.error = {err: err, stack: err.stackTrace};
      callback(out);
    }
  } else {
    log("Callback with an invalid request - " + invalidMsg);
    out.ncStatusCode = 400;
    out.payload.error = invalidMsg;
    callback(out);
  }
};

function logError(msg) {
  console.log("[error] " + msg);
}

function log(msg) {
  console.log("[info] " + msg);
}

module.exports.InsertSalesOrder = InsertSalesOrder;
