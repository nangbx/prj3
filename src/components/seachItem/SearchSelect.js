import { Select } from "antd"

const { Option } = Select

const SearchSelect = ({
  dataIndex,
  placeholder,
  data = [],
  filter,
  setFilter,
  setLastFilter,
  handleSearch,
  pagination,
  ...props
}) => {
  const handleSearchSelectChange = (value) => {
    let newFilterState = { ...filter }
    newFilterState[dataIndex] = value ? value : null
    setFilter(newFilterState)
    setLastFilter(newFilterState)
    handleSearch(newFilterState, { ...pagination, current: 1 })
  }

  return (
    <Select
      style={{ minWidth: 120 }}
      allowClear
      showSearch
      filterOption={(input, option) =>
        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
      }
      placeholder={placeholder}
      dropdownMatchSelectWidth={false}
      onChange={(value) => handleSearchSelectChange(value)}
      {...props}
    >
      {data.map((item, index) => (
        <Option value={item.value} key={index}>
          {item.label}
        </Option>
      ))}
    </Select>
  )
}

export default SearchSelect
