/* global google */
/* eslint-disable no-undef */
export const mapConfig = {
  directionOptions: {
    preserveViewport: true,
    polylineOptions: {
      path: [],
      strokeColor: "#1fb75a",
      strokeWeight: 10,
      strokeOpacity: 0.3,
    },
    markerOptions: { visible: false },
  },
  backDirectionOptions: {
    polylineOptions: {
      path: [],
      strokeColor: "#dd1717",
      strokeWeight: 10,
      strokeOpacity: 0.3,
    },
    markerOptions: { visible: false },
  },
  carHistoryPolylineConfig: {
    strokeColor: "#FF0000",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#FF0000",
    fillOpacity: 0.35,
    clickable: false,
    draggable: false,
    editable: false,
    visible: true,
    radius: 30000,
    icons: [
      {
        icon: {
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        },
        repeat: "80px",
        offset: "100%",
      },
    ],
    zIndex: 1,
  },
}
