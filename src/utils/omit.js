const omitNil = (obj) => {
  let tmpObj = { ...obj }
  for (var propName in tmpObj) {
    if (
      tmpObj[propName] === null ||
      tmpObj[propName] === undefined ||
      tmpObj[propName] === ""
    ) {
      delete tmpObj[propName]
    }
  }
  return tmpObj
}

export default omitNil
