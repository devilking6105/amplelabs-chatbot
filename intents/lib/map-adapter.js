const googleMapsClient = require("@google/maps").createClient({
  Promise: Promise,
  key: process.env.GOOGLE_MAPS_KEY
});

const getMapsImageUrl = address => {
  const parsedAddress = address.replace("&", " and ");
  let url = `https://maps.googleapis.com/maps/api/staticmap?center=${
    address.latitude == null
      ? parsedAddress
      : address.latitude + "," + address.longitude
  }&zoom=18&size=600x300&maptype=roadmap&markers=color:red%7Clabel:A%7C`;
  url +=
    address.latitude == null
      ? parsedAddress
      : address.latitude + "," + address.longitude;
  return url + "&key=" + process.env.GOOGLE_MAPS_KEY;
};

const getCityFromResult = result => {
  const locality = result.address_components.find(
    component => component.types[0] === "locality"
  );
  if (locality == null) return null;
  return locality.long_name;
};

const getAddressFromResult = result => {
  return result.formatted_address;
};

function getCoordsFromResult(results) {
  const coordinates = results[0].geometry.location;
  return {
    latitude: coordinates.lat,
    longitude: coordinates.lng
  };
}

const MapAdapter = {
  mapsUrl: address => {
    return getMapsImageUrl(address);
  },

  lookupAddress: async address => {
    const response = await googleMapsClient
      .geocode({ address: address })
      .asPromise();
    const results = response.json.results;
    if (results.length < 1) return {};

    return {
      ...getCoordsFromResult(results),
      city: getCityFromResult(results[0]),
      address: getAddressFromResult(results[0])
    };
  },

  lookupCoords: async coords => {
    let response = await googleMapsClient
      .reverseGeocode({ latlng: coords })
      .asPromise();
    const results = response.json.results;
    if (results.length < 1) return {};

    return {
      ...coords,
      city: getCityFromResult(results[0]),
      address: getAddressFromResult(results[0])
    };
  }
};

module.exports = MapAdapter;
