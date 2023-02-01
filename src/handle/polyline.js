import { isEqual } from "lodash"

const removeDuplicate = (paths) => {
  let rsArr = []
  let currentValue = {}
  paths.forEach((path) => {
    if (!isEqual(currentValue, path)) {
      rsArr.push(path)
      currentValue = path
    }
  })
  return rsArr
}

export default { removeDuplicate }
