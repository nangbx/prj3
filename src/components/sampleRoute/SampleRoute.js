/* eslint-disable no-undef */
import {
  Col,
  Row,
  Button,
  TimePicker,
  Input,
  Form,
  Radio,
  Select,
  Table,
  Space,
  InputNumber,
  notification,
  message,
  Typography,
  Tabs,
  Checkbox,
} from "antd"
import { useState, useEffect, useRef } from "react"
import {
  GoogleMap,
  useJsApiLoader,
  DirectionsRenderer,
  Marker,
  InfoWindow,
  InfoBox,
} from "@react-google-maps/api"
import {
  MenuOutlined,
  CloseCircleOutlined,
  DragOutlined,
  CheckOutlined,
} from "@ant-design/icons"
import {
  SortableContainer,
  SortableElement,
  SortableHandle,
} from "react-sortable-hoc"
import { arrayMoveImmutable } from "array-move"
import moment from "moment"

import { RECORD_MODE } from "../../const/mode"
import makeRequest from "../../utils/makeRequest"
import omitNil from "../../utils/omit"
import { addListKey } from "../../utils/addListKey"
import { routeType, routeTypeObj } from "../../config/routeType"
import Point from "../../DTOs/point"
import MarkerDTO from "../../DTOs/marker"
import { markerIcon } from "../../config/markerIcon"
import SearchText from "../seachItem/SearchText"
import SearchSelect from "../seachItem/SearchSelect"
import { convertDirection } from "../../handle/convertDirection"
import directionHandle from "../../handle/direction"
import { requestUrl } from "../../resource/requestUrl"

import "./SampleRoute.css"
import "../../styles/startBtn.css"
import CustomSkeleton from "../skeleton/CustomSkeleton"

const { Option } = Select
const { Text } = Typography
const { TabPane } = Tabs
const libraries = ["places"]
const timeFormat = "HH:mm"

const SampleRoute = () => {
  const [myMap, setMyMap] = useState(null)
  const [center, setCenter] = useState({ lat: 21.0070303, lng: 105.840942 })
  const [mode, setMode] = useState(RECORD_MODE.CREATE)
  const [userUnit, setUserUnit] = useState([])
  const [selectedRowArr, setSelectedRowArr] = useState([])
  const [activeKey, setActiveKey] = useState("1")
  const [points, setPoints] = useState([])
  const [routes, setRoutes] = useState([])
  const [sampleRoutes, setSampleRoutes] = useState([])
  const [selectedRecord, setSelectedRecord] = useState({})
  const [pointIndex, setPointIndex] = useState(1)
  const [direction, setDirection] = useState(null)
  const [backDirection, setBackDirection] = useState(null)
  const [markers, setMarkers] = useState([])
  const [activeMarker, setActiveMarker] = useState(null)
  const [activeInfoWindow, setActiveInfoWindow] = useState(null)
  const [infoBoxs, setInfoBoxs] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
  })
  const [filter, setFilter] = useState({
    pointCode: "",
    pointName: "",
    address: "",
  })
  const [lastFilter, setLastFilter] = useState({
    pointCode: "",
    pointName: "",
    address: "",
  })

  //Set up google map and form
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GGMAP_KEY,
    libraries,
  })

  const DRRef = useRef(null)
  const BackDRRef = useRef(null)
  const MapRef = useRef(null)

  const handleActiveMarker = (id) => {
    if (id === activeMarker) {
      return
    }
    setActiveMarker(id)
    setActiveInfoWindow(markers.filter((item) => item.id === id)[0])
  }

  const removeActiveMarker = () => {
    setActiveMarker(null)
    setActiveInfoWindow(null)
  }

  const [form] = Form.useForm()

  //Set up for drag drop on routes
  const DragHandle = SortableHandle(() => (
    <MenuOutlined style={{ cursor: "grab", color: "#999" }} />
  ))

  const SortableItem = SortableElement((props) => <tr {...props} />)
  const SortableBody = SortableContainer((props) => <tbody {...props} />)

  const onSortEnd = ({ oldIndex, newIndex }) => {
    if (oldIndex !== newIndex) {
      const newData = arrayMoveImmutable(
        [].concat(routes),
        oldIndex,
        newIndex
      ).filter((el) => !!el)
      setRoutes(newData)
    }
  }

  const DraggableContainer = (props) => (
    <SortableBody
      useDragHandle
      disableAutoscroll
      helperClass="row-dragging"
      onSortEnd={onSortEnd}
      {...props}
    />
  )

  const DraggableBodyRow = ({ className, style, ...restProps }) => {
    const index = routes.findIndex((x) => x.index === restProps["data-row-key"])
    return <SortableItem index={index} {...restProps} />
  }

  // handle when create new route
  const onOpenCreateForm = () => {
    setActiveKey("2")
    setMode(RECORD_MODE.CREATE)
    setSelectedRecord({})
    form.resetFields()
    form.setFieldsValue({})
    setPointIndex(1)
  }

  // Select item on sample route table
  const onRowSelected = (record, selected, selectedRows) => {
    let selectedRecord = selectedRows[0]
    selectedRecord = {
      ...selectedRecord,
      beginTime: moment(selectedRecord.beginTime, "HH:mm:ss"),
    }
    const id = record.id
    const selectedRoute = sampleRoutes.filter(
      (item) => item.routeInfo.id === id
    )[0]
    const waypoints = selectedRoute.wayPoints.map((item, index) => ({
      ...item,
      index: index + 1,
    }))
    setPointIndex(waypoints.length + 1)
    drawDirection(waypoints, selectedRecord.beginTime, false)
    let convertedDirection = convertDirection(
      JSON.parse(selectedRecord.direction)
    )
    let convertedBackDirection = convertDirection(
      JSON.parse(selectedRecord.wayBack)
    )
    const mergeBound = mergeFitbound(
      convertedDirection.routes[0].bounds,
      convertedBackDirection.routes[0].bounds
    )
    convertedDirection.routes[0].bounds = mergeBound
    convertedBackDirection.routes[0].bounds = mergeBound
    setDirection(convertedDirection)
    setBackDirection(convertedBackDirection)
    setRoutes(waypoints)
    setSelectedRecord(selectedRecord)
    form.resetFields()
    form.setFieldsValue(selectedRecord)
    setMode(RECORD_MODE.UPDATE)
    setActiveKey("2")
  }

  const onSelectedChange = (selectedRowKeys, selectedRows) => {
    setSelectedRowArr(selectedRowKeys)
  }

  // add, delete transaction point to route
  const handleAddPoint = () => {
    let data = new Point(pointIndex)
    let tmpRoutes = [...routes]
    tmpRoutes.push(data)
    setRoutes(tmpRoutes)
    setPointIndex(pointIndex + 1)
  }

  const handleDelPoint = (index) => {
    const pointIndex = routes.findIndex((item) => item.index === index)
    let tmpRoutes = [...routes]
    tmpRoutes.splice(pointIndex, 1)
    setRoutes(tmpRoutes)
  }

  // Handle event when select value of transaction point
  const onSelect = (value, index, property) => {
    let tmpRoute = [...routes]
    const rowIndex = tmpRoute.findIndex((item) => item.index === index)
    tmpRoute[rowIndex]["transactionPointId"] = value
    setRoutes(tmpRoute)
  }

  const onTimeChange = (time, timeString, index) => {
    let tmpRoute = [...routes]
    const rowIndex = tmpRoute.findIndex((item) => item.index === index)
    tmpRoute[rowIndex]["time"] = timeString
    setRoutes(tmpRoute)
  }

  // draw on map
  const drawDirection = (routePoints, beginTime, reDraw) => {
    const checked = form.getFieldValue("autoTurnBack")
    const DirectionService = new google.maps.DirectionsService()
    const routeInfo = routePoints.map((item) => {
      return points.filter((p) => p.id === item.transactionPointId)[0]
    })
    const markerList = routeInfo.map(
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
    setMarkers(markerList)
    const routeInfoCount = routeInfo.length
    // get time each point
    let timeList = []
    let startTime = moment(beginTime, timeFormat)
    for (let i = 0; i < routeInfoCount; i++) {
      const pointTime = moment(routePoints[i].time, timeFormat)
      const minute = pointTime.hour() * 60 + pointTime.minute()
      startTime.add(minute, "minutes")
      let timeItem = {
        position: markerList[i].position,
        displayTime: startTime.format(timeFormat),
      }
      timeList.push(timeItem)
    }
    setInfoBoxs(timeList)

    if (reDraw) {
      const { origin, destination, waypoints, backOrigin, backDestination } =
        directionHandle.getDirectionServiceOptions(routeInfo, checked)

      Promise.all([
        DirectionService.route({
          origin,
          destination,
          waypoints,
          optimizeWaypoints: true,
          travelMode: google.maps.TravelMode.DRIVING,
        }),
        DirectionService.route({
          origin: backOrigin,
          destination: backDestination,
          waypoints: [],
          optimizeWaypoints: true,
          travelMode: google.maps.TravelMode.DRIVING,
        }),
      ]).then(([goRs, backRs]) => {
        const mergeBound = mergeFitbound(
          goRs.routes[0].bounds,
          backRs.routes[0].bounds
        )
        goRs.routes[0].bounds = mergeBound
        backRs.routes[0].bounds = mergeBound
        setDirection(goRs)
        setBackDirection(backRs)
        const goLegs = goRs.routes[0].legs
        const backLegs = backRs.routes[0].legs
        const calculateGoRs = directionHandle.calTimeAndDuration(goLegs)
        const calculateBackRs = directionHandle.calTimeAndDuration(backLegs)
        form.setFieldsValue({
          distance: (
            parseFloat(calculateGoRs.distance) +
            parseFloat(calculateBackRs.distance)
          ).toFixed(1),
          arrivalTime:
            parseInt(calculateGoRs.arrivalTime) +
            parseInt(calculateBackRs.arrivalTime),
        })
      })
    }
  }

  // Handle submit form
  const handleSubmit = (routeData) => {
    setLoading(true)
    let method = mode === RECORD_MODE.CREATE ? "POST" : "PUT"
    let url =
      mode === RECORD_MODE.CREATE
        ? requestUrl.route.createUrl()
        : requestUrl.route.updateUrl({ id: routeData.id })
    let msg =
      mode === RECORD_MODE.CREATE
        ? "Thêm tuyến mẫu thành công"
        : "Cập nhật thành công"
    const route = routes.map((item, index) => ({
      transactionPointId: item.transactionPointId,
      order: index,
      time: item.time,
    }))
    const data = {
      ...routeData,
      route: JSON.stringify(route),
      direction: DRRef.current
        ? JSON.stringify(DRRef.current.state.directionsRenderer.directions)
        : JSON.stringify(direction),
      wayBack: BackDRRef.current
        ? JSON.stringify(BackDRRef.current.state.directionsRenderer.directions)
        : JSON.stringify(backDirection),
      beginTime: moment(routeData.beginTime).format("HH:mm:ss"),
    }
    makeRequest({
      method,
      url,
      data,
    }).then((rs) => {
      notification.open({
        message: "Thông báo",
        icon: <CheckOutlined style={{ color: "#2fd351" }} />,
        description: msg,
      })
      handleSearch(filter, pagination)
      setSelectedRowArr([])
      setSelectedRecord({})
      setRoutes([])
      setActiveKey("1")
      setLoading(false)
    })
  }

  // Handle on row click
  const onRowClick = (record) => {
    const id = record.id
    const route = sampleRoutes.filter((item) => item.routeInfo.id === id)[0]
    const waypoints = route.wayPoints
    let convertedDirection = convertDirection(JSON.parse(record.direction))
    let convertedBackDirection = convertDirection(JSON.parse(record.wayBack))
    const mergeBound = mergeFitbound(
      convertedDirection.routes[0].bounds,
      convertedBackDirection.routes[0].bounds
    )
    convertedDirection.routes[0].bounds = mergeBound
    convertedBackDirection.routes[0].bounds = mergeBound
    setDirection(convertedDirection)
    setBackDirection(convertedBackDirection)
    drawDirection(waypoints, record.beginTime, false)
  }

  const handleSearch = async (params, pagination = {}) => {
    setLoading(true)
    let filter = omitNil(params)
    makeRequest({
      method: "GET",
      url: requestUrl.route.readUrl(),
      params: {
        ...filter,
        page: pagination.current,
        record: pagination.pageSize,
      },
    }).then((searchRs) => {
      setSampleRoutes(addListKey(searchRs.data))
      setPagination({
        ...pagination,
        total: searchRs.totalRecords,
      })
      setLoading(false)
    })
  }

  const handlePaginationChange = (page, pageSize) => {
    let newPagination = { ...pagination, current: page, pageSize }
    handleSearch(filter, newPagination)
  }

  const handleFindDirection = () => {
    const checked = form.getFieldValue("autoTurnBack")
    if (!form.getFieldValue("beginTime")) {
      message.warning("Bạn chưa chọn thời điểm bắt đầu!")
    } else if (routes.length < 2) {
      message.warning("Số điểm dừng phải lớn hơn 2!")
    } else if (routes.length === 2 && checked !== true) {
      message.warning("Chưa chọn điểm dừng cuối!")
    } else {
      drawDirection(routes, form.getFieldValue("beginTime"), true)
    }
  }

  const onTabChange = (key) => {
    setActiveKey(key)
    if (key === "1") {
      setSelectedRowArr([])
      setSelectedRecord({})
      setRoutes([])
      setPointIndex(1)
    }
  }

  const mergeFitbound = (directionBound, backDirectionBound) => {
    let boundBuilder = new google.maps.LatLngBounds()
    if (directionBound && backDirectionBound) {
      boundBuilder.union(directionBound)
      boundBuilder.union(backDirectionBound)
      myMap.fitBounds(boundBuilder)
      return boundBuilder
    }
  }

  // Handle on direction change
  const onDirectionChange = () => {
    console.log("direction change")
    if (DRRef.current && BackDRRef.current) {
      const goLegs =
        DRRef.current.state.directionsRenderer.directions.routes[0].legs
      const backLegs =
        BackDRRef.current.state.directionsRenderer.directions.routes[0].legs
      const calculateGoRs = directionHandle.calTimeAndDuration(goLegs)
      const calculateBackRs = directionHandle.calTimeAndDuration(backLegs)
      form.setFieldsValue({
        distance: (
          parseFloat(calculateGoRs.distance) +
          parseFloat(calculateBackRs.distance)
        ).toFixed(1),
        arrivalTime:
          parseInt(calculateGoRs.arrivalTime) +
          parseInt(calculateBackRs.arrivalTime),
      })
    }
  }

  useEffect(() => {
    const getRoutes = async () => {
      const [sampleRouteRs, userUnitRs, pointRs] = await Promise.all([
        makeRequest({
          method: "GET",
          url: requestUrl.route.readUrl(),
        }),
        makeRequest({
          method: "GET",
          url: requestUrl.userUnit.readUrl(),
        }),
        makeRequest({
          method: "GET",
          url: requestUrl.transactionPoint.readUrl(),
          params: {
            paging: false,
          },
        }),
      ])
      setPagination({
        ...pagination,
        total: sampleRouteRs.totalRecords,
      })
      setUserUnit(addListKey(userUnitRs.data))
      setPoints(addListKey(pointRs.data))
      setSampleRoutes(addListKey(sampleRouteRs.data))
      setLoading(false)
    }

    getRoutes()
  }, [])

  const columns = [
    {
      title: "Mã tuyến",
      dataIndex: "routeCode",
      width: 150,
    },
    {
      title: "Đơn vị quản lý",
      render: (text, record) => <>{record.unit.name}</>,
    },
    {
      title: "Loại tuyến",
      render: (text, record) => <>{routeTypeObj[record.type]}</>,
    },
    {
      title: "Xoá",
      render: (text, record) => (
        <CloseCircleOutlined style={{ color: "red" }} />
      ),
      align: "center",
      width: 50,
    },
  ]

  const pointColumns = [
    {
      title: <DragOutlined />,
      dataIndex: "sort",
      width: 30,
      className: "drag-visible",
      render: () => <DragHandle />,
      align: "center",
    },
    {
      title: "Điểm giao dịch",
      render: (text, record) => (
        <Select
          style={{ width: 130 }}
          showSearch
          optionFilterProp="children"
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
          onSelect={(value) => onSelect(value, record.index)}
          value={record.transactionPointId}
        >
          {points.map((item, index) => (
            <Option value={item.id} key={index}>
              {item.pointName}
            </Option>
          ))}
        </Select>
      ),
      className: "drag-visible",
      width: 130,
    },
    {
      title: "Địa chỉ",
      render: (text, record) => (
        <Select
          style={{ width: 250 }}
          showSearch
          optionFilterProp="children"
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
          onSelect={(value) => onSelect(value, record.index)}
          value={record.transactionPointId}
        >
          {points.map((item, index) => (
            <Option value={item.id} key={index}>
              {item.address}
            </Option>
          ))}
        </Select>
      ),
      width: 250,
    },
    {
      title: "Số giờ đi",
      render: (text, record) => (
        <TimePicker
          format="HH:mm"
          defaultValue={moment("00:00")}
          value={moment(record.time, "HH:mm")}
          onChange={(time, timeString) =>
            onTimeChange(time, timeString, record.index)
          }
          allowClear={false}
        />
      ),
      width: 100,
    },
    {
      title: "Xoá",
      render: (text, record) => (
        <CloseCircleOutlined
          style={{ color: "red" }}
          onClick={() => handleDelPoint(record.index)}
        />
      ),
      align: "center",
    },
  ]

  return (
    <Row style={{ height: "100%" }} gutter={16}>
      <Col span={17}>
        {isLoaded && (
          <GoogleMap
            mapContainerStyle={{
              height: "100%",
              width: "100%",
            }}
            ref={MapRef}
            zoom={17}
            center={center}
            onLoad={(map) => {
              setMyMap(map)
              map.fitBounds(
                new google.maps.LatLngBounds(
                  new google.maps.LatLng(20.981840000000002, 105.78991),
                  new google.maps.LatLng(21.01169, 105.85975)
                )
              )
            }}
            onClick={removeActiveMarker}
            options={{ draggable: true }}
          >
            {direction && (
              <DirectionsRenderer
                directions={direction}
                ref={DRRef}
                onDirectionsChanged={onDirectionChange}
                options={{
                  preserveViewport: true,
                  draggable: true,
                  polylineOptions: {
                    path: [],
                    strokeColor: "#008fd5",
                    strokeWeight: 3,
                    icons: [
                      {
                        icon: {
                          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        },
                        repeat: "80px",
                        offset: "100%",
                      },
                    ],
                  },
                  markerOptions: { visible: false },
                }}
              />
            )}
            {backDirection && (
              <DirectionsRenderer
                directions={backDirection}
                onDirectionsChanged={onDirectionChange}
                ref={BackDRRef}
                options={{
                  draggable: true,
                  polylineOptions: {
                    path: [],
                    strokeColor: "#dd1717",
                    strokeWeight: 3,
                    icons: [
                      {
                        icon: {
                          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        },
                        repeat: "80px",
                        offset: "100%",
                      },
                    ],
                  },
                  markerOptions: { visible: false },
                }}
              />
            )}
            {markers.map(({ id, description, position, type }) => (
              <Marker
                key={id}
                position={position}
                onClick={() => handleActiveMarker(id)}
                icon={{
                  url: markerIcon[type],
                  size: { width: 44, height: 20 },
                }}
              ></Marker>
            ))}
            {activeInfoWindow ? (
              <InfoWindow
                position={activeInfoWindow.position}
                onCloseClick={removeActiveMarker}
                options={{ pixelOffset: new google.maps.Size(0, -20) }}
                zIndex={100}
              >
                <div>{activeInfoWindow.description}</div>
              </InfoWindow>
            ) : null}
            {infoBoxs.length &&
              infoBoxs.map((item, index) => (
                <InfoBox
                  position={item.position}
                  key={index}
                  options={{
                    pixelOffset: new google.maps.Size(-18, 0),
                    closeBoxURL: "",
                    enableEventPropagation: true,
                  }}
                  zIndex={101}
                >
                  <div
                    style={{
                      backgroundColor: "#005c9a",
                      color: "#ffffff",
                      padding: 3,
                    }}
                  >
                    <div style={{ fontSize: 12 }}>{item.displayTime}</div>
                  </div>
                </InfoBox>
              ))}
            {infoBoxs.length && (
              <InfoBox
                position={infoBoxs[0].position}
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
          </GoogleMap>
        )}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 8,
            padding: 10,
            backgroundColor: "#e5e0e0",
            borderTop: "thin solid black",
            borderRight: "thin solid black",
            borderTopRightRadius: 7,
          }}
        >
          <table>
            <tr>
              <td>
                <div
                  style={{ width: 50, height: 3, backgroundColor: "#008fd5" }}
                ></div>
              </td>
              <td style={{ paddingLeft: 10 }}>Đường đi</td>
            </tr>
            <tr>
              <td>
                <div
                  style={{ width: 50, height: 3, backgroundColor: "#dd1717" }}
                ></div>
              </td>
              <td style={{ paddingLeft: 10 }}>Đường về</td>
            </tr>
          </table>
        </div>
      </Col>
      <Col
        span={7}
        style={{
          height: "calc(100vh - 60px)",
          overflowX: "hidden",
          overflowY: "scroll",
          scrollbarWidth: "thin",
        }}
        id="custom-scroll-bar"
      >
        <Tabs defaultActiveKey="1" activeKey={activeKey} onChange={onTabChange}>
          <TabPane tab="Danh sách tuyến" key="1">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h2>Danh sách tuyến mẫu</h2>
              <Button type="primary" onClick={onOpenCreateForm}>
                Tạo tuyến mẫu
              </Button>
            </div>
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
              <Col span={8}>
                <Text>Mã tuyến</Text>
              </Col>
              <Col span={16}>
                <SearchText
                  dataIndex="routeCode"
                  placeholder="Điền mã tuyến"
                  filter={filter}
                  lastFilter={lastFilter}
                  setFilter={setFilter}
                  setLastFilter={setLastFilter}
                  handleSearch={handleSearch}
                  pagination={pagination}
                  style={{ width: "100%" }}
                ></SearchText>
              </Col>
              <Col span={8}>
                <Text>Đơn vị</Text>
              </Col>
              <Col span={16}>
                <SearchSelect
                  dataIndex="unitId"
                  placeholder="Chọn đơn vị"
                  data={userUnit.map((item) => ({
                    value: item.id,
                    label: item.name,
                  }))}
                  filter={filter}
                  setFilter={setFilter}
                  setLastFilter={setLastFilter}
                  handleSearch={handleSearch}
                  pagination={pagination}
                  style={{ width: "100%" }}
                ></SearchSelect>
              </Col>
              <Col span={8}>
                <Text>Loại tuyến</Text>
              </Col>
              <Col span={16}>
                <SearchSelect
                  dataIndex="type"
                  placeholder="Chọn loại tuyến"
                  data={routeType}
                  filter={filter}
                  setFilter={setFilter}
                  setLastFilter={setLastFilter}
                  handleSearch={handleSearch}
                  pagination={pagination}
                  style={{ width: "100%" }}
                ></SearchSelect>
              </Col>
            </Row>
            <Table
              dataSource={addListKey(
                sampleRoutes.map((item) => item.routeInfo)
              )}
              columns={columns}
              pagination={{
                position: ["bottomRight"],
                ...pagination,
                onChange: handlePaginationChange,
              }}
              size="small"
              rowSelection={{
                selectedRowKeys: selectedRowArr,
                columnTitle: <div>Sửa</div>,
                type: "checkbox",
                onSelect: (record, selected, selectedRows) =>
                  onRowSelected(record, selected, selectedRows),
                onChange: (selectedRowKeys, selectedRows) =>
                  onSelectedChange(selectedRowKeys, selectedRows),
              }}
              onRow={(record) => ({
                onClick: () => onRowClick(record),
              })}
            />
          </TabPane>
          <TabPane tab="Thông tin tuyến" key="2" activeKey={activeKey} disabled>
            <Form
              labelCol={{ span: 10 }}
              wrapperCol={{ span: 14 }}
              form={form}
              initialValues={selectedRecord}
              onFinish={handleSubmit}
              labelAlign="left"
              labelWrap={true}
            >
              <Form.Item label="id" name="id" noStyle>
                <Input type="hidden" />
              </Form.Item>
              <Form.Item
                name="unitId"
                label="Đơn vị quản lý"
                rules={[
                  {
                    required: true,
                    message: "Trường này không được thiếu",
                  },
                ]}
              >
                <Select>
                  {userUnit.map((item, index) => (
                    <Option value={item.id} key={index}>
                      {item.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                label="Mã tuyến"
                name="routeCode"
                rules={[
                  {
                    required: true,
                    message: "Trường này không được thiếu",
                  },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Loại tuyến"
                name="type"
                rules={[
                  {
                    required: true,
                    message: "Trường này không được thiếu",
                  },
                ]}
              >
                <Radio.Group>
                  {routeType.map((item, index) => (
                    <Radio value={item.value} key={index}>
                      {item.label}
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>
              <Form.Item
                label="Thời gian xuất phát trong ngày"
                name="beginTime"
                rules={[
                  {
                    required: true,
                    message: "Trường này không được thiếu",
                  },
                ]}
              >
                <TimePicker format="HH:mm" />
              </Form.Item>
              <Form.Item name="permanent" valuePropName="checked">
                <Checkbox>
                  <Text type="danger">Tuyến cố định</Text>
                </Checkbox>
              </Form.Item>
              <Form.Item name="autoTurnBack" valuePropName="checked">
                <Checkbox>
                  <Text type="danger">
                    Điểm trở về mặc định là điểm bắt đầu
                  </Text>
                </Checkbox>
              </Form.Item>
              <Table
                size="small"
                pagination={false}
                dataSource={routes}
                columns={pointColumns}
                rowKey="index"
                components={{
                  body: {
                    wrapper: DraggableContainer,
                    row: DraggableBodyRow,
                  },
                }}
              />
              <Space style={{ margin: "20px 0" }}>
                <Button type="primary" onClick={handleAddPoint}>
                  Thêm điểm
                </Button>
                <Button type="primary">Xoá tất cả</Button>
                <Button type="primary" onClick={handleFindDirection}>
                  Tìm đường
                </Button>
              </Space>
              <Form.Item
                label="Thời gian đến muộn cho phép(phút)"
                name="overTimeAllowed"
                rules={[
                  {
                    required: true,
                    message: "Trường này không được thiếu",
                  },
                ]}
              >
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                label="Dung sai lộ trình cho phép(km)"
                name="toleranceAllowed"
                rules={[
                  {
                    required: true,
                    message: "Trường này không được thiếu",
                  },
                ]}
              >
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="Khoảng cách dự tính(km)" name="distance">
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="Thời gian dự tính(phút)" name="arrivalTime">
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item wrapperCol={{ offset: 0, span: 24 }}>
                <Button type="primary" onClick={() => form.submit()}>
                  Lưu
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Col>
      <CustomSkeleton loading={loading} />
    </Row>
  )
}

export default SampleRoute
