import { DatePicker } from "antd"
import moment from "moment"

const SearchDate = ({
  dataIndex,
  placeholder,
  filter,
  setFilter,
  setLastFilter,
  handleSearch,
  pagination,
  ...props
}) => {
  const onChange = (date, dateString) => {
    const newFilterState = { ...filter }
    newFilterState[dataIndex] = date
      ? moment(dateString).format("YYYY-MM-DD")
      : null
    setFilter(newFilterState)
    setLastFilter(newFilterState)
    handleSearch(newFilterState, { ...pagination, current: 1 })
  }

  return (
    <DatePicker
      allowClear
      placeholder={placeholder}
      onChange={onChange}
      {...props}
    />
  )
}

export default SearchDate
