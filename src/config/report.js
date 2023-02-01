import moment from "moment"

const dateFormat = "DD-MM-YYYY"

export const reportConfig = {
  subject: [
    {
      value: 0,
      label: "Xe",
    },
    {
      value: 1,
      label: "Lái xe",
    },
    {
      value: 2,
      label: "Chủ hàng",
    },
  ],
  reportType: [
    {
      value: 0,
      label: "Tổng hợp",
    },
    {
      value: 1,
      label: "Nhật ký hoạt động",
    },
    {
      value: 2,
      label: "Theo dõi hoạt động xe",
    },
    {
      value: 3,
      label: "Tổng Km theo xe",
    },
    {
      value: 4,
      label: "Sự kiện cảnh báo",
    },
  ],
  sos: [
    {
      value: 0,
      label: "Mất tín hiệu GSM/3G",
    },
    {
      value: 1,
      label: "Ra khỏi vùng phủ",
    },
    {
      value: 2,
      label: "Dừng quá thời gian",
    },
    {
      value: 3,
      label: "Mở khoang két không đúng điểm dừng",
    },
    {
      value: 4,
      label: "Báo động SOS",
    },
    {
      value: 5,
      label: "Chủ hàng rời vị trí",
    },
    {
      value: 6,
      label: "KTV ATM rời vị trí",
    },
    {
      value: 7,
      label: "Lái xe không đúng phân công",
    },
    {
      value: 8,
      label: "Chủ hàng, thủ quỹ ATM không đúng phân công",
    },
    {
      value: 9,
      label: "KTV ATM không đúng phân công",
    },
    {
      value: 10,
      label: "Xe rời bến chưa được phân công",
    },
    {
      value: 11,
      label: "Lái xe rời vị trí",
    },
    {
      value: 12,
      label: "Lái xe không mang thẻ",
    },
    {
      value: 13,
      label: "Chủ hàng không mang thẻ",
    },
    {
      value: 14,
      label: "KSV không mang thẻ",
    },
  ],
  fileType: [
    { value: 0, label: "Pdf" },
    { value: 1, label: "Excel" },
  ],
  tableHeader: {
    carReport: {
      0: [
        {
          title: "Biển số xe",
          render: (text, record) => <>{record.carLicensePlate}</>,
        },
        {
          title: "Ngày tháng",
          render: (text, record) => (
            <>{moment(record.reportTime).format(dateFormat)}</>
          ),
        },
        {
          title: "Mã tuyến",
          render: (text, record) => <>{record.routeCode}</>,
        },
        {
          title: "Tổng Km chạy",
          render: (text, record) => <>{record.totalKm.toFixed(1)}</>,
        },
        {
          title: "SL mở khoang két",
          dataIndex: "openSafeBox",
        },
        {
          title: "SL lệch lộ trình",
          dataIndex: "routeDeviation",
        },
        {
          title: "SL lệch thời gian",
          dataIndex: "timeDeviation",
        },
      ],
      3: [
        {
          title: "Biển số",
          render: (text, record) => <>{record.carLicensePlate}</>,
        },
        {
          title: "Lái xe",
          dataIndex: "driver",
        },
        {
          title: "Chủ hàng",
          dataIndex: "treasure",
        },
        {
          title: "Tổng số Km chạy",
          render: (text, record) => <>{record.totalKm.toFixed(1)}</>,
        },
        {
          title: "Đơn vị",
          render: (text, record) => <>{record.unitName}</>,
        },
        {
          title: "Ngày tháng",
          render: (text, record) => (
            <>{moment(record.reportTime).format(dateFormat)}</>
          ),
        },
      ],
    },
  },
}
