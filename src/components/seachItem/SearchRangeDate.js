import { Space, Typography, DatePicker } from "antd"
import moment from "moment"

const { RangePicker } = DatePicker
const { Text } = Typography

const SearchRangeDate = ({
  dataIndex = [],
  placeholder,
  filter,
  setFilter,
  setLastFilter,
  handleSearch,
  pagination,
  ...props
}) => {
  const onRangeTimeChange = (value, dateString) => {
    let newFilterState = { ...filter }
    if (value) {
      newFilterState[dataIndex[0]] = value[0]
        ? moment(value[0]).format("YYYY-MM-DD")
        : null
      newFilterState[dataIndex[1]] = value[1]
        ? // ? moment(value[1]).add(1, "days").format("YYYY-MM-DD")
          moment(value[1]).format("YYYY-MM-DD")
        : null
    } else {
      newFilterState[dataIndex[0]] = null
      newFilterState[dataIndex[1]] = null
    }
    setFilter(newFilterState)
    setLastFilter(newFilterState)
    handleSearch(newFilterState, { ...pagination, current: 1 })
  }
  return (
    <RangePicker
      format="YYYY-MM-DD"
      allowClear={false}
      defaultValue={[moment(Date.now()), moment(Date.now())]}
      onChange={(value, dateString) => onRangeTimeChange(value, dateString)}
      {...props}
    />
  )
}

export default SearchRangeDate
