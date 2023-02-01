import { Input } from "antd"
import { isEqual } from "lodash"

const SearchText = ({
  dataIndex,
  placeholder,
  filter,
  lastFilter,
  setFilter,
  setLastFilter,
  handleSearch,
  pagination,
  ...props
}) => {
  const handleSearchTextChange = (value) => {
    let newFilterState = { ...filter }
    newFilterState[dataIndex] = value ? value : null
    setFilter(newFilterState)
  }

  const handleSearchTextBlur = () => {
    if (!isEqual(filter, lastFilter)) {
      setFilter({ ...lastFilter })
    }
  }

  const handleSearchTextConfirm = () => {
    setLastFilter({ ...filter })
    handleSearch(filter, { ...pagination, current: 1 })
  }

  return (
    <Input
      placeholder={placeholder}
      value={filter[dataIndex] ? filter[dataIndex] : ""}
      onChange={(e) => handleSearchTextChange(e.target.value, dataIndex)}
      onBlur={handleSearchTextBlur}
      onPressEnter={handleSearchTextConfirm}
      allowClear={false}
      {...props}
    />
  )
}

export default SearchText
