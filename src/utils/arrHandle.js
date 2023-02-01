import _ from "lodash"

export const isArrayEqual = (x = [], y = []) => {
  return _(x).xorWith(y, _.isEqual).isEmpty()
}

export const getDifference = (x = [], y = []) => {
  return _.xor(x, y)
}

export const getPresent = (x = [], y = []) => {
  return _.intersectionWith(x, y, _.isEqual)
}

export const removeDuplicate = (x = []) => {
  return _.sortedUniq(x)
}

export const isObjectEmpty=(x={})=>{
  return _.isEmpty(x)
}