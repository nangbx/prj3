import { memo } from "react"
import { Marker, InfoBox } from "@react-google-maps/api"
import { markerIcon } from "../../config/markerIcon"

const MemorizeRoutePoint = memo(({ routePoints = [] }) => {
  console.log("rerender routePoint")
  return routePoints.length ? (
    routePoints.map((item, index) => (
      <>
        <Marker
          key={`marker-${item.id}`}
          position={item.position}
          icon={{
            url: markerIcon[item.type],
            size: { width: 44, height: 20 },
          }}
        ></Marker>
        <InfoBox
          position={item.position}
          key={`infoBox-${item.id}`}
          options={{
            pixelOffset: new google.maps.Size(-20, 1),
            closeBoxURL: "",
            enableEventPropagation: true,
            boxStyle: {
              width: "unset",
              padding: "1px",
              border: "thin solid",
              "border-radius": "2px",
              background: "#005c9a",
              color: "#ffffff",
            },
          }}
          zIndex={101}
        >
          <>{`${item.description}(${item.displayTime})`}</>
        </InfoBox>

        {index === 0 && (
          <InfoBox
            position={item.position}
            options={{
              pixelOffset: new google.maps.Size(-25, -70),
              closeBoxURL: "",
              enableEventPropagation: true,
            }}
            zIndex={99}
          >
            <div className="start-point">
              <p>Start</p>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 arrow-down"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </InfoBox>
        )}
      </>
    ))
  ) : (
    <></>
  )
})
export default MemorizeRoutePoint
