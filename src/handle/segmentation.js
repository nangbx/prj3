import moment from "moment"
const dateFormat = "YYYY-MM-DD"
const extractSegmentation = (
  segmentations = [],
  filterTime = { begin: moment(), end: moment() }
) => {
  const now = moment()
  const rs = []
  segmentations.forEach((segmemtation) => {
    const days = JSON.parse(segmemtation.day)
    const rangeDate = getDateInRange(
      segmemtation.beginDate,
      segmemtation.endDate
    )
    rangeDate.forEach((date) => {
      if (
        days.includes(date.isoWeekday()) &&
        isDayBetweenRange(date, filterTime.begin, filterTime.end)
      ) {
        rs.push({ ...segmemtation, assignIn: date })
      }
    })
  })
  return rs
}

const getSegmentationEditedRoute = (segmemtation) => {
  const editedRoutes = segmemtation.editedSegmentationRoutes
  const editedRouteToday = editedRoutes.filter((item) =>
    moment(item.editedIn).isSame(segmemtation.assignIn, "date")
  )
  return editedRouteToday.length ? editedRouteToday[0] : segmemtation.route
}

const getUpdateTimeObject = (time) => {
  let timeList = time.split(":")
  timeList = timeList.map((item) => parseInt(item))
  console.log({
    hour: timeList[0],
    minute: timeList[1],
    second: timeList[2],
  })
  return {
    hour: timeList[0],
    minute: timeList[1],
    second: timeList[2],
  }
}

const getDateInRange = (start, end) => {
  let now = moment.utc(start, dateFormat)
  end = moment.utc(end, dateFormat)
  let dates = []
  while (now.isValid() && end.isValid() && now.isSameOrBefore(end, "day")) {
    dates.push(now)
    now = moment(now).add(1, "days")
  }
  return dates
}

const isDayBetweenRange = (day, start, end) => {
  return day.isSameOrAfter(start, "date") && day.isSameOrBefore(end, "date")
}

export default {
  extractSegmentation,
  getSegmentationEditedRoute,
  getUpdateTimeObject,
}
