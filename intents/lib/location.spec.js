const Location = require('./location')

describe('Location', () => {
  it('returns a new location from an address', async () => {
    const address = '207 Queens Quay W #600, Toronto, ON M5J 1A7'
    const location = await Location.fromAddress(address)

    expect(location).toEqual({
      longitude: -79.380352,
      latitude: 43.6388865,
      city: 'Toronto',
      address: '207 Queens Quay W #600, Toronto, ON M5J 1A7, Canada'
    })
  })

  it('returns a new location with gps coordinates', async () => {
    const coords = {longitude: -74.0059728, latitude: 40.7127753}
    const location = await Location.fromCoords(coords)

    expect(location).toEqual({
      longitude: -74.0059728,
      latitude: 40.7127753,
      city: 'New York',
      address: 'New York City Hall, 11 Centre St, New York, NY 10007, USA'
    })
  })

  it('is converts latitude and longitude to floats', () => {
    const location = new Location({latitude: '40', longitude: '50'})

    expect(location.coords()).toEqual({
      latitude: 40,
      longitude: 50
    })
  })

  describe('when checking if an address is in Toronto', () => {
    it('is false when it is Ecobee', async () => {
      const location = new Location({city: 'Toronto'})

      expect(location.isInsideToronto()).toBe(true)
      expect(location.isOutsideToronto()).toBe(false)
    })

    it('is true when it is Wasaga Beach', async () => {
      const location = new Location({city: 'Not Toronto'})

      expect(location.isInsideToronto()).toBe(false)
      expect(location.isOutsideToronto()).toBe(true)
    })
  })

  describe('unknown locations', () => {
    it('is false when the location is real', () => {
      const location = new Location({latitude: 40, longitude: -74})

      expect(location.isUnknown()).toBe(false)
    })

    it('is false when the coordinates are strings, but still valid', () => {
      const location = new Location({latitude: '40', longitude: '50'})

      expect(location.isUnknown()).toBe(false)
    })

    it('is true when the coordinates are out of range', () => {
      let location

      location = new Location({latitude: 91, longitude: 45})
      expect(location.isUnknown()).toBe(true)

      location = new Location({latitude: -91, longitude: 45})
      expect(location.isUnknown()).toBe(true)

      location = new Location({latitude: 45, longitude: 181})
      expect(location.isUnknown()).toBe(true)

      location = new Location({latitude: 45, longitude: -181})
      expect(location.isUnknown()).toBe(true)
    })

    it('is true when the coordinates are not defined', () => {
      const location = new Location({latitude: null, longitude: null})

      expect(location.isUnknown()).toBe(true)
    })

    it('is true when the coordinates are some other type', () => {
      const location = new Location({latitude: {}, longitude: {}})

      expect(location.isUnknown()).toBe(true)
    })

    it('is true when the location is completely made up', async () => {
      const address = 'Invalid Location'
      const location = await Location.fromAddress(address)

      expect(location.isUnknown()).toBe(true)
    })
  })
})
