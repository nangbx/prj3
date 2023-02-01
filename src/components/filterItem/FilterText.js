import { Input } from "antd"
import { isEqual } from "lodash"

const FilterText = ({
  dataIndex,
  placeholder,
  filter,
  setFilter,
  handleFilter,
  ...props
}) => {
  const handleSearchTextChange = (value) => {
    let newFilterState = { ...filter }
    newFilterState[dataIndex] = value ? value : null
    setFilter(newFilterState)
    handleFilter(newFilterState)
  }

  return (
    <Input
      placeholder={placeholder}
      value={filter[dataIndex] ? filter[dataIndex] : ""}
      onChange={(e) => handleSearchTextChange(e.target.value, dataIndex)}
      allowClear={false}
      {...props}
    />
  )
}

export default FilterText
