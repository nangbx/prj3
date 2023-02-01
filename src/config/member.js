const { requestUrl } = require("../resource/requestUrl")

export const memberConfig = {
  driver: {
    url: requestUrl.driver,
    tableTitle: "Danh sách lái xe",
    rfidConfig: {
      type: 2,
      isDistributed: false,
      paging: false,
    },
  },
  treasure: {
    url: requestUrl.treasure,
    tableTitle: "Danh sách thủ quỹ/ chủ hàng",
    rfidConfig: {
      type: 3,
      isDistributed: false,
      paging: false,
    },
  },
  atmTechnican: {
    url: requestUrl.atmTechnican,
    tableTitle: "Danh sách kỹ thuật viên ATM",
    rfidConfig: {
      type: 4,
      isDistributed: false,
      paging: false,
    },
  },
  escort: {
    url: requestUrl.escort,
    tableTitle: "Danh sách người áp tải",
    rfidConfig: {
      type: 5,
      isDistributed: false,
      paging: false,
    },
  },
}
