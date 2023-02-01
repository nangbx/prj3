const calTimeAndDuration = (legs = []) => {
  let calculatedRs = { distance: 0, arrivalTime: 0 }
  legs.forEach((leg) => {
    calculatedRs.distance += leg.distance.value
    calculatedRs.arrivalTime += leg.duration.value
  })
  calculatedRs.distance = (calculatedRs.distance / 1000).toFixed(1)
  calculatedRs.arrivalTime = (calculatedRs.arrivalTime / 60).toFixed()
  return calculatedRs
}

const getDirectionServiceOptions = (routeInfo = [], checked) => {
  const routeInfoCount = routeInfo.length
  let waypoints
  let origin
  let destination
  let backOrigin
  let backDestination
  origin = `${routeInfo[0].latitude}, ${routeInfo[0].longtitude}`
  if (checked) {
    waypoints = routeInfo.slice(1, routeInfoCount - 1).map((item) => ({
      location: `${item.latitude}, ${item.longtitude}`,
      stopover: true,
    }))
    destination = `${routeInfo[routeInfoCount - 1].latitude}, ${
      routeInfo[routeInfoCount - 1].longtitude
    }`
    backOrigin = `${routeInfo[routeInfoCount - 1].latitude}, ${
      routeInfo[routeInfoCount - 1].longtitude
    }`
    backDestination = `${routeInfo[0].latitude}, ${routeInfo[0].longtitude}`
  } else {
    waypoints = routeInfo.slice(1, routeInfoCount - 2).map((item) => ({
      location: `${item.latitude}, ${item.longtitude}`,
      stopover: true,
    }))
    destination = `${routeInfo[routeInfoCount - 2].latitude}, ${
      routeInfo[routeInfoCount - 2].longtitude
    }`
    backOrigin = `${routeInfo[routeInfoCount - 2].latitude}, ${
      routeInfo[routeInfoCount - 2].longtitude
    }`
    backDestination = `${routeInfo[routeInfoCount - 1].latitude}, ${
      routeInfo[routeInfoCount - 1].longtitude
    }`
  }

  return { origin, destination, waypoints, backOrigin, backDestination }
}

const convertLatLng = (latLng) => {
  const { lat, lng } = latLng
  return { lat: parseFloat(lat), lng: parseFloat(lng) }
}

export default { calTimeAndDuration, getDirectionServiceOptions, convertLatLng }
