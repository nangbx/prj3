/* eslint-disable no-undef */

export const convertDirection = (direction = {}) => {
  let directionRs = { ...direction }
  let { request, routes } = directionRs
  let { destination, origin, waypoints } = request

  destination = new google.maps.LatLng(destination.location)
  origin = new google.maps.LatLng(origin.location)
  if (waypoints) {
    waypoints = waypoints.map((waypoint, index) => ({
      ...waypoint,
      location: {
        location: new google.maps.LatLng(waypoint.location.location),
      },
    }))
  }
  request = {
    ...request,
    destination: { location: destination },
    origin: { location: origin },
    waypoints: waypoints ? waypoints : [],
  }

  let route = routes[0]
  let { legs, overview_path, bounds } = route
  legs = legs.map((leg) => {
    let legRs = { ...leg }
    legRs.start_location = new google.maps.LatLng(legRs.start_location)
    legRs.end_location = new google.maps.LatLng(legRs.end_location)
    let { steps } = leg
    steps = steps.map((step) => {
      let { lat_lngs, path } = step
      lat_lngs = lat_lngs.map((lat_lng) => new google.maps.LatLng(lat_lng))
      path = path.map((item) => new google.maps.LatLng(item))
      return {
        ...step,
        lat_lngs,
        path,
        start_location: new google.maps.LatLng(step.start_location),
        end_location: new google.maps.LatLng(step.end_location),
        start_point: new google.maps.LatLng(step.start_point),
        end_point: new google.maps.LatLng(step.end_point),
      }
    })
    legRs.steps = steps
    return legRs
  })

  overview_path = overview_path.map((item) => new google.maps.LatLng(item))
  route = {
    ...route,
    overview_path,
    legs,
    bounds: new google.maps.LatLngBounds(
      new google.maps.LatLng(bounds.south, bounds.west),
      new google.maps.LatLng(bounds.north, bounds.east)
    ),
  }
  routes[0] = route
  return { ...directionRs, request, routes }
}
