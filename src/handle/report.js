import moment from "moment"
const dateFormat = "DD-MM-YYYY"

const getTableHeader = (columns = []) => {
  return `<tr>${columns.map((column) => `<th>${column}</th>`).join("")}</tr>`
}

const getDailyCarReportBody = (dailyCars = []) => {
  return dailyCars
    .map(
      (item) => `
      <tr>
        <td>${item.carLicensePlate}</td>
        <td>${moment(item.reportTime).format(dateFormat)}</td>
        <td>${item.routeCode}</td>
        <td>${item.totalKm.toFixed(1)}</td>
        <td>${item.openSafeBox}</td>
        <td>${item.routeDeviation}</td>
        <td>${item.timeDeviation}</td>
      </tr>
    `
    )
    .join("")
}

const getDailyKmCarReportBody = (dailyKmCars = []) => {
  return dailyKmCars
    .map(
      (item) => `
    <tr>
      <td>${item.carLicensePlate}</td>
      <td>${item.driver}</td>
      <td>${item.treasure}</td>
      <td>${item.totalKm.toFixed(1)}</td>
      <td>${item.unitName}</td>
      <td>${moment(item.reportTime).format(dateFormat)}</td>
    </tr>
  `
    )
    .join("")
}

export default {
  getTableHeader,
  getDailyCarReportBody,
  getDailyKmCarReportBody,
}
