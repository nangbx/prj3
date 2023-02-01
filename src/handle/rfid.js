import { isEmpty } from "lodash"
import omitNil from "../utils/omit"
import { addListKey } from "../utils/addListKey"
import { RECORD_MODE } from "../const/mode"

const setListRfid = (rfidList = [], rfid = {}, mode) => {
  let rs
  switch (mode) {
    case RECORD_MODE.CREATE: {
      rs = addListKey(rfidList)
      break
    }
    case RECORD_MODE.UPDATE: {
      if (!isEmpty(omitNil(rfid))) {
        rs = addListKey([...rfidList, rfid])
      } else {
        rs = addListKey([...rfidList])
      }
      break
    }
    default:
      rs = addListKey(rfidList)
  }
  return rs
}

const rmDistributedRfid = (rfidList = [], rfid = {}) => {
  let rfids = [...rfidList]
  if (!isEmpty(omitNil(rfid))) {
    const rmIndex = rfids.findIndex((item) => item.id === rfid.id)
    if (rmIndex >= 0) {
      rfids.splice(rmIndex, 1)
    }
  }
  return addListKey(rfids)
}

export default {
  setListRfid,
  rmDistributedRfid,
}
