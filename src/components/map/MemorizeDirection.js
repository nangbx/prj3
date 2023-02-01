import { memo } from "react"
import { DirectionsRenderer } from "@react-google-maps/api"

const MemorizeDirection = memo(({ direction, options }) => {
  return direction ? (
    <DirectionsRenderer directions={direction} options={options} />
  ) : (
    <></>
  )
})

export default MemorizeDirection
