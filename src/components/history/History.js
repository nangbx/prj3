/* global google */
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api"
import {
  Row,
  Col,
  Tabs,
  DatePicker,
  Select,
  Button,
  message,
  Table,
  Spin,
} from "antd"
import moment from "moment"
import React, { useState, useEffect } from "react"
import { markerIcon } from "../../config/markerIcon"
import makeRequest from "../../utils/makeRequest"
import { requestUrl } from "../../resource/requestUrl"
import segmentationHandler from "../../handle/segmentation"
import { convertDirection } from "../../handle/convertDirection"
import MarkerDTO from "../../DTOs/marker"
import omitNil from "../../utils/omit"
import HistoryList from "../debugHistory/HistoryList"
import MemorizeRoutePoint from "../map/MemorizeRoutePoint"
import MemorizePolyline from "../map/MemorizePolyline"
import MemorizeDirection from "../map/MemorizeDirection"
import { mapConfig } from "../../config/map"
import CustomSkeleton from "../skeleton/CustomSkeleton"

import "../../styles/customScrollBar.css"
import "../../styles/antdTable.css"
import "../../styles/filterItem.css"

const libraries = ["places"]
const dateTimeFormat = "YYYY-MM-DDTHH:mm:ss"
const dateFormat = "YYYY-MM-DD"
const carMarkerICon = 6
const { TabPane } = Tabs
const { Option } = Select

const History = () => {
  const [myMap, setMyMap] = useState(null)
  const [center, setCenter] = useState({ lat: 21.0070303, lng: 105.840942 })
  const [assets, setAssets] = useState({
    userUnits: [],
    cars: [],
    transactionPoints: [],
    sampleRoutes: [],
  })
  // const [cars, setCars] = useState([])
  const [segmentations, setSegmentations] = useState([])
  const [carHistoryFilter, setCarHistoryFilter] = useState({
    carId: null,
    beginTime: moment().startOf("day"),
    endTime: moment().endOf("day"),
  })
  const [segmentationFilter, setSegmentationFilter] = useState({
    beginDate: moment(),
    endDate: moment(),
    unitId: null,
  })
  const [carHistory, setCarHistory] = useState({
    histories: [],
    statistical: {},
  })
  const [historyPath, setHistoryPath] = useState([])
  const [direction, setDirection] = useState(null)
  const [backDirection, setBackDirection] = useState(null)
  const [routePoints, setRoutePoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedHistory, setSelectedHistory] = useState(null)

  useEffect(() => {
    const getAssets = async () => {
      let today = moment().format("YYYY-MM-DD")
      const [
        carsRs,
        segmentationsRs,
        userUnitRs,
        sampleRoutesRs,
        transactionPointsRs,
      ] = await Promise.all([
        makeRequest({
          method: "GET",
          url: requestUrl.car.readUrl(),
          params: {
            paging: false,
          },
        }),
        makeRequest({
          method: "GET",
          url: requestUrl.segmentation.readUrl(),
          params: {
            beginDate: today.toString(),
            endDate: today.toString(),
          },
        }),
        makeRequest({
          method: "GET",
          url: requestUrl.userUnit.readUrl(),
        }),
        makeRequest({
          method: "GET",
          url: requestUrl.route.readUrl(),
          params: {
            paging: false,
          },
        }),
        makeRequest({
          method: "GET",
          url: requestUrl.transactionPoint.readUrl(),
          params: {
            paging: false,
          },
        }),
      ])
      setAssets({
        cars: carsRs.data,
        sampleRoutes: sampleRoutesRs.data,
        transactionPoints: transactionPointsRs.data,
        userUnits: userUnitRs.data,
      })
      setSegmentations(
        segmentationHandler.extractSegmentation(segmentationsRs.data)
      )
      setLoading(false)
    }
    getAssets()
  }, [])

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GGMAP_KEY,
    libraries,
  })

  const segmentationColumns = [
    {
      title: "Mã tuyến",
      render: (text, record) => <>{record.route.routeCode}</>,
    },
    {
      title: "Xe",
      render: (text, record) => (
        <>
          {
            assets.cars.filter((item) => item.id === record.carId)[0]
              .licensePlate
          }
        </>
      ),
    },
    {
      title: "Chạy ngày",
      render: (text, record) => <>{record.assignIn.format("DD-MM-YYYY")}</>,
    },
  ]

  const getCarHistory = (filter, segmentationRouteBound) => {
    setLoading(true)
    const formatedFilter = {
      carId: filter.carId,
      beginTime: filter.beginTime.format(dateTimeFormat),
      endTime: filter.endTime.format(dateTimeFormat),
    }
    makeRequest({
      method: "GET",
      url: requestUrl.history.readUrl(),
      params: formatedFilter,
    }).then((rs) => {
      const { histories } = rs.data
      const point = histories.map((item) => ({
        lat: item.gpsLat,
        lng: item.gpsLon,
      }))
      setCarHistory(rs.data)
      setHistoryPath(point)
      if (point.length) {
        let boundBuilder = new google.maps.LatLngBounds()
        point.forEach((item) => {
          boundBuilder.extend(item)
        })
        if (segmentationRouteBound) boundBuilder.union(segmentationRouteBound)
        else {
          setRoutePoints([])
          setDirection(null)
          setBackDirection(null)
        }
        myMap.fitBounds(boundBuilder)
        // when map not fitbound correctly
        setTimeout(() => {
          myMap.fitBounds(boundBuilder)
        }, 100)
      } else {
        message.warn("Không có thông tin lịch sử xe trong ngày này")
      }
      setLoading(false)
    })
  }

  const onSegmentationSelected = (record) => {
    const segmentationRoute =
      segmentationHandler.getSegmentationEditedRoute(record)
    const historyFilter = {
      carId: record.carId,
      beginTime: record.assignIn
        .clone()
        .set(segmentationHandler.getUpdateTimeObject(record.beginTime)),
      endTime: record.assignIn
        .clone()
        .set(segmentationHandler.getUpdateTimeObject(record.endTime)),
    }
    const { route, direction, wayBack } = segmentationRoute
    const wayPoints = JSON.parse(route)
    let convertedDirection = convertDirection(JSON.parse(direction))
    let convertedBackDirection = convertDirection(JSON.parse(wayBack))
    const mergeBound = mergeFitbound(
      convertedDirection.routes[0].bounds,
      convertedBackDirection.routes[0].bounds
    )
    convertedDirection.routes[0].bounds = mergeBound
    convertedBackDirection.routes[0].bounds = mergeBound
    // when mergebound not run correctly
    myMap.fitBounds(mergeBound)
    setTimeout(() => {
      myMap.fitBounds(mergeBound)
    }, 100)
    setDirection(convertedDirection)
    setBackDirection(convertedBackDirection)
    drawRoutePoint(wayPoints, record.beginTime)
    getCarHistory(historyFilter, mergeBound)
  }

  const drawRoutePoint = (wayPoints, beginTime) => {
    const routeInfo = wayPoints.map((item) => {
      return assets.transactionPoints.filter(
        (p) => p.id === item.transactionPointId
      )[0]
    })

    let markerList = routeInfo.map(
      (item, index) =>
        new MarkerDTO(
          index + 1,
          item.pointName,
          {
            lat: item.latitude,
            lng: item.longtitude,
          },
          item.pointType
        )
    )
    const routeInfoCount = routeInfo.length
    // get time each point
    let timeList = []
    let startTime = moment(beginTime, "HH:mm")
    for (let i = 0; i < routeInfoCount; i++) {
      const pointTime = moment(wayPoints[i].time, "HH:mm")
      const minute = pointTime.hour() * 60 + pointTime.minute()
      startTime.add(minute, "minutes")
      let timeItem = {
        displayTime: startTime.format("HH:mm"),
      }
      timeList.push(timeItem)
    }

    for (let index = 0; index < routeInfoCount; index++) {
      markerList[index] = { ...markerList[index], ...timeList[index] }
    }
    setRoutePoints(markerList)
  }

  const mergeFitbound = (directionBound, backDirectionBound) => {
    let boundBuilder = new google.maps.LatLngBounds()
    if (directionBound && backDirectionBound) {
      boundBuilder.union(directionBound)
      boundBuilder.union(backDirectionBound)
      return boundBuilder
    }
  }

  const onLoadSegmentation = () => {
    let omitFilter = omitNil(segmentationFilter)
    omitFilter = {
      ...omitFilter,
      beginDate: omitFilter.beginDate.format(dateFormat),
      endDate: omitFilter.endDate.format(dateFormat),
      paging: false,
    }
    makeRequest({
      method: "GET",
      url: requestUrl.segmentation.readUrl(),
      params: omitFilter,
    }).then((rs) => {
      setSegmentations(
        segmentationHandler.extractSegmentation(rs.data, {
          begin: segmentationFilter.beginDate,
          end: segmentationFilter.endDate,
        })
      )
    })
  }

  return (
    <Row style={{ height: "100%" }} gutter={[8, 8]}>
      <Col span={4}>
        <Tabs
          defaultActiveKey="1"
          className="custom-scroll-bar"
          style={{ height: "100%" }}
        >
          <TabPane tab="Lịch sử tuyến" key="1">
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ marginBottom: 10 }}>
                <div className="filter-wrapper">
                  <label className="filter-label">Từ ngày</label>
                  <DatePicker
                    className="filter-item"
                    defaultValue={moment()}
                    onChange={(date, dateString) => {
                      setSegmentationFilter({
                        ...segmentationFilter,
                        beginDate: date,
                      })
                    }}
                    // cmt for can select day after today
                    // disabledDate={(d) => !d || d.isAfter(moment().endOf("day"))}
                  />
                </div>
                <div className="filter-wrapper">
                  <label className="filter-label">Đến ngày</label>
                  <DatePicker
                    className="filter-item"
                    defaultValue={moment()}
                    onChange={(date, dateString) => {
                      setSegmentationFilter({
                        ...segmentationFilter,
                        endDate: date,
                      })
                    }}
                    // cmt for can select day after today
                    // disabledDate={(d) => !d || d.isAfter(moment().endOf("day"))}
                  />
                </div>
                <div className="filter-wrapper">
                  <label className="filter-label">Đơn vị</label>
                  <Select
                    allowClear
                    className="filter-item"
                    placeholder="Chọn đơn vị"
                    style={{ overflow: "hidden" }}
                    showSearch
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                    onChange={(value) => {
                      setSegmentationFilter({
                        ...segmentationFilter,
                        unitId: value ? value : null,
                      })
                    }}
                  >
                    {assets.userUnits.map((item, index) => (
                      <Option value={item.id} key={item.id}>
                        {item.name}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div className="filter-wrapper">
                  <label className="filter-label"></label>
                  <Button type="primary" onClick={onLoadSegmentation}>
                    Tìm kiếm
                  </Button>
                </div>
              </div>
              <Table
                size="small"
                columns={segmentationColumns}
                rowClassName="antd-tblrow-cursor"
                dataSource={segmentations}
                pagination={{ pageSize: 5 }}
                className="custom-scroll-bar"
                onRow={(record, index) => {
                  return {
                    onClick: () => onSegmentationSelected(record),
                  }
                }}
              ></Table>
            </div>
          </TabPane>
          <TabPane tab="Lịch sử xe" key="2">
            <div className="filter-wrapper">
              <label className="filter-label">Bắt đầu</label>
              <DatePicker
                format="DD-MM-YYYY HH:mm"
                className="filter-item"
                showTime
                value={carHistoryFilter.beginTime}
                onChange={(date, dateString) => {
                  setCarHistoryFilter({ ...carHistoryFilter, beginTime: date })
                }}
              />
            </div>
            <div className="filter-wrapper">
              <label className="filter-label">Kết thúc</label>
              <DatePicker
                format="DD-MM-YYYY HH:mm"
                className="filter-item"
                showTime
                value={carHistoryFilter.endTime}
                onChange={(date, dateString) => {
                  setCarHistoryFilter({ ...carHistoryFilter, endTime: date })
                }}
              />
            </div>
            <div className="filter-wrapper">
              <label className="filter-label">Xe</label>
              <Select
                className="filter-item"
                placeholder="Danh sách xe"
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >=
                  0
                }
                onChange={(value) =>
                  setCarHistoryFilter({ ...carHistoryFilter, carId: value })
                }
                style={{ overflow: "hidden" }}
              >
                {assets.cars.map((item) => (
                  <Option value={item.id} key={item.id}>
                    {item.licensePlate}
                  </Option>
                ))}
              </Select>
            </div>
            <Button
              type="primary"
              style={{ marginTop: 10 }}
              onClick={() => getCarHistory(carHistoryFilter, null)}
            >
              Xem lịch sử
            </Button>
          </TabPane>
        </Tabs>
      </Col>
      <Col span={17}>
        {isLoaded && (
          <GoogleMap
            mapContainerStyle={{
              height: "100%",
              width: "100%",
            }}
            zoom={17}
            center={center}
            onLoad={(map) => {
              setMyMap(map)
            }}
          >
            <MemorizePolyline
              path={historyPath}
              options={mapConfig.carHistoryPolylineConfig}
            />
            <MemorizeDirection
              direction={direction}
              options={mapConfig.directionOptions}
            />
            <MemorizeDirection
              direction={backDirection}
              options={mapConfig.backDirectionOptions}
            />
            <MemorizeRoutePoint routePoints={routePoints} />
            {selectedHistory ? (
              <Marker
                key="car-history-icon"
                position={{
                  lat: selectedHistory.gpsLat,
                  lng: selectedHistory.gpsLon,
                }}
                icon={{
                  url: markerIcon[carMarkerICon],
                  size: { width: 40, height: 20 },
                }}
              ></Marker>
            ) : (
              <></>
            )}
          </GoogleMap>
        )}
      </Col>
      <Col span={3} style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{ border: "1px solid gray", marginBottom: 10, height: 140 }}
        >
          <div
            style={{
              backgroundColor: "#56eaa0",
              textAlign: "center",
              padding: 4,
            }}
          >
            Hành trình xe
          </div>
          <div style={{ padding: 4 }}>
            <table style={{ width: "100%", fontSize: 12 }}>
              <tbody>
                <tr>
                  <td>Vận tốc TB</td>
                  <td>{carHistory.statistical.averageSpeed} km/h</td>
                </tr>
                <tr>
                  <td>Vận tốc tối thiểu</td>
                  <td>{carHistory.statistical.minimumSpeed} km/h</td>
                </tr>
                <tr>
                  <td>Vận tốc tối đa</td>
                  <td>{carHistory.statistical.maximumSpeed} km/h</td>
                </tr>
                <tr>
                  <td>Quãng đường chạy</td>
                  <td>{carHistory.statistical.distance} km</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <HistoryList
          histories={carHistory.histories}
          setSelectedHistory={setSelectedHistory}
        />
      </Col>
      <CustomSkeleton loading={loading} />
    </Row>
  )
}

export default History
