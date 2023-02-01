import { memo } from "react"
import { Polyline } from "@react-google-maps/api"
const MemorizePolyline = memo(({ path = [], options }) => {
  console.log("rerender polyline")
  return path && path.length ? (
    <Polyline path={path} options={options} />
  ) : (
    <></>
  )
})

export default MemorizePolyline
