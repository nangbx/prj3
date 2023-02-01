/* eslint-disable no-undef */
import {
  Col,
  Row,
  Button,
  DatePicker,
  Input,
  Form,
  Drawer,
  Select,
  Table,
  notification,
  TimePicker,
  Checkbox,
  Typography,
  Tooltip,
  Spin,
} from "antd"
import { useState, useEffect } from "react"
import {
  GoogleMap,
  useJsApiLoader,
  DirectionsRenderer,
  Marker,
  InfoWindow,
  InfoBox,
} from "@react-google-maps/api"
import {
  CheckOutlined,
  ReloadOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons"
import moment from "moment"
import { isEqual } from "lodash"

import { RECORD_MODE } from "../../const/mode"
import makeRequest from "../../utils/makeRequest"
import omitNil from "../../utils/omit"
import { addListKey } from "../../utils/addListKey"
import MarkerDTO from "../../DTOs/marker"
import { markerIcon } from "../../config/markerIcon"
import { dayOfWeek } from "../../const/dayOfWeek"
import SearchSelect from "../seachItem/SearchSelect"
import SearchRangeDate from "../seachItem/SearchRangeDate"
import { convertDirection } from "../../handle/convertDirection"
import { requestUrl, baseUrl } from "../../resource/requestUrl"

import "../../styles/startBtn.css"
import CustomSkeleton from "../skeleton/CustomSkeleton"

const { Option } = Select
const { Text } = Typography
const libraries = ["places"]
const allDayOfWeek = [1, 2, 3, 4, 5, 6, 7]
const timeFormat = "HH:mm"

const Segmentation = () => {
  const [myMap, setMyMap] = useState(null)
  const [center, setCenter] = useState({ lat: 21.0070303, lng: 105.840942 })
  const [mode, setMode] = useState(RECORD_MODE.CREATE)
  const [assets, setAssets] = useState({
    userUnits: [],
    cars: [],
    drivers: [],
    treasures: [],
    atmTechnicans: [],
    sampleRoutes: [],
    points: [],
    segmentations: [],
  })
  const [selectedRecord, setSelectedRecord] = useState({})
  const [selectedRowArr, setSelectedRowArr] = useState([])
  const [visible, setVisible] = useState(false)
  const [direction, setDirection] = useState(null)
  const [backDirection, setBackDirection] = useState(null)
  const [markers, setMarkers] = useState([])
  const [activeMarker, setActiveMarker] = useState(null)
  const [activeInfoWindow, setActiveInfoWindow] = useState(null)
  const [infoBoxs, setInfoBoxs] = useState([])
  const [checkedAll, setCheckedAll] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
  })
  const [filter, setFilter] = useState({
    beginDate: moment(Date.now()).format("YYYY-MM-DD"),
    endDate: moment(Date.now()).add(1, "days").format("YYYY-MM-DD"),
    unitId: "",
    routeId: "",
    carId: "",
  })
  const [lastFilter, setLastFilter] = useState({
    beginDate: moment(Date.now()).format("YYYY-MM-DD"),
    endDate: moment(Date.now()).add(1, "days").format("YYYY-MM-DD"),
    unitId: "",
    routeId: "",
    carId: "",
  })
  // Setup google map and form
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GGMAP_KEY,
    libraries,
  })

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

  // Drawer event
  const onOpenDrawer = () => {
    setMode(RECORD_MODE.CREATE)
    setSelectedRecord({})
    form.resetFields()
    form.setFieldsValue({})
    setVisible(true)
  }

  const onClose = () => {
    setSelectedRowArr([])
    setSelectedRecord({})
    setCheckedAll(false)
    setVisible(false)
  }

  // Select item on sample route table
  const onRowSelected = (record, selected, selectedRows) => {
    setVisible(true)
    let selectedRecord = selectedRows[0]
    selectedRecord = {
      ...selectedRecord,
      beginTime: moment(selectedRecord.beginTime, "HH:mm"),
      endTime: moment(selectedRecord.endTime, "HH:mm"),
      beginDate: moment(selectedRecord.beginDate, "YYYY-MM-DD"),
      endDate: moment(selectedRecord.endDate, "YYYY-MM-DD"),
    }
    const routeId = record.routeId
    const selectedRoute = assets.sampleRoutes.filter(
      (item) => item.routeInfo.id === routeId
    )[0]
    const waypoints = selectedRoute.wayPoints.map((item, index) => ({
      ...item,
      index: index + 1,
    }))
    drawDirection(waypoints, selectedRoute.routeInfo.beginTime)
    setSelectedRecord(selectedRecord)
    let convertedDirection = convertDirection(
      JSON.parse(selectedRoute.routeInfo.direction)
    )
    let convertedBackDirection = convertDirection(
      JSON.parse(selectedRoute.routeInfo.wayBack)
    )
    const mergeBound = mergeFitbound(
      convertedDirection.routes[0].bounds,
      convertedBackDirection.routes[0].bounds
    )
    convertedDirection.routes[0].bounds = mergeBound
    convertedBackDirection.routes[0].bounds = mergeBound
    setDirection(convertedDirection)
    setBackDirection(convertedBackDirection)
    handleDayChange(selectedRecord.day)
    form.resetFields()
    form.setFieldsValue(selectedRecord)
    setMode(RECORD_MODE.UPDATE)
  }

  const onSelectedChange = (selectedRowKeys, selectedRows) => {
    setSelectedRowArr(selectedRowKeys)
  }

  const mergeFitbound = (directionBound, backDirectionBound) => {
    const boundBuilder = new google.maps.LatLngBounds()
    if (directionBound && backDirectionBound) {
      boundBuilder.union(directionBound)
      boundBuilder.union(backDirectionBound)
      myMap.fitBounds(boundBuilder)
      return boundBuilder
    }
  }

  // draw on map
  const drawDirection = (routePoints, beginTime) => {
    const routeInfo = routePoints.map((item) => {
      return assets.points.filter((p) => p.id === item.transactionPointId)[0]
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
  }

  // Handle submit form
  const handleSubmit = (segmentationData) => {
    setLoading(true)
    let method = mode === RECORD_MODE.CREATE ? "POST" : "PUT"
    let url =
      mode === RECORD_MODE.CREATE
        ? requestUrl.segmentation.createUrl()
        : requestUrl.segmentation.updateUrl({ id: segmentationData.id })
    let msg =
      mode === RECORD_MODE.CREATE
        ? "Thêm tuyến mẫu thành công"
        : "Cập nhật thành công"
    const data = {
      ...segmentationData,
      day: JSON.stringify(segmentationData.day),
      beginTime: moment(segmentationData.beginTime).format("HH:mm"),
      endTime: moment(segmentationData.endTime).format("HH:mm"),
      beginDate: moment(segmentationData.beginDate).format("YYYY-MM-DD"),
      endDate: moment(segmentationData.endDate).format("YYYY-MM-DD"),
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
      setVisible(false)
      setCheckedAll(false)
      setLoading(false)
    })
  }

  // Handle on row click
  const onRowClick = (record) => {
    const routeId = record.routeId
    const route = assets.sampleRoutes.filter(
      (item) => item.routeInfo.id === routeId
    )[0]
    const waypoints = route.wayPoints
    let convertedDirection = convertDirection(
      JSON.parse(route.routeInfo.direction)
    )
    let convertedBackDirection = convertDirection(
      JSON.parse(route.routeInfo.wayBack)
    )
    const mergeBound = mergeFitbound(
      convertedDirection.routes[0].bounds,
      convertedBackDirection.routes[0].bounds
    )
    convertedDirection.routes[0].bounds = mergeBound
    convertedBackDirection.routes[0].bounds = mergeBound
    setDirection(convertedDirection)
    setBackDirection(convertedBackDirection)
    drawDirection(waypoints, route.routeInfo.beginTime)
  }

  // handle when search column and pagination change
  const handleSearch = (params, pagination = {}) => {
    setLoading(true)
    let filter = omitNil(params)
    makeRequest({
      method: "GET",
      url: requestUrl.segmentation.readUrl(),
      params: {
        ...filter,
        page: pagination.current,
        record: pagination.pageSize,
      },
    }).then((searchRs) => {
      setAssets({
        ...assets,
        segmentations: addListKey(
          searchRs.data.map((item) => ({ ...item, day: JSON.parse(item.day) }))
        ),
      })
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

  // handle check all day
  const handleCheckedAll = () => {
    setCheckedAll(!checkedAll)
    if (checkedAll) {
      form.setFieldsValue({ day: [] })
    } else {
      form.setFieldsValue({ day: allDayOfWeek })
    }
  }

  useEffect(() => {
    const getSegmentations = async () => {
      const [
        segmentationRs,
        userUnitRs,
        pointRs,
        sampleRouteRs,
        carsRs,
        driverRs,
        treasureRs,
        atmTechnicanRs,
      ] = await Promise.all([
        makeRequest({
          method: "GET",
          url: requestUrl.segmentation.readUrl(),
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
        makeRequest({
          method: "GET",
          url: requestUrl.route.readUrl(),
          params: {
            paging: false,
          },
        }),
        makeRequest({
          method: "GET",
          url: requestUrl.car.readUrl(),
          params: {
            paging: false,
          },
        }),
        makeRequest({
          method: "GET",
          url: requestUrl.driver.readUrl(),
          params: {
            paging: false,
          },
        }),
        makeRequest({
          method: "GET",
          url: requestUrl.treasure.readUrl(),
          params: {
            paging: false,
          },
        }),
        makeRequest({
          method: "GET",
          url: requestUrl.atmTechnican.readUrl(),
          params: {
            paging: false,
          },
        }),
      ])

      setAssets({
        atmTechnicans: addListKey(atmTechnicanRs.data),
        cars: addListKey(carsRs.data),
        drivers: addListKey(driverRs.data),
        points: addListKey(pointRs.data),
        sampleRoutes: addListKey(sampleRouteRs.data),
        userUnits: addListKey(userUnitRs.data),
        treasures: addListKey(treasureRs.data),
        segmentations: addListKey(
          addListKey(
            segmentationRs.data.map((item) => ({
              ...item,
              day: JSON.parse(item.day),
            }))
          )
        ),
      })
      setPagination({
        ...pagination,
        total: segmentationRs.totalRecords,
      })
      setLoading(false)
    }

    getSegmentations()
  }, [])

  // set up tables columns
  const getColumnValue = (record, recordProperty, data = [], dataProperty) => {
    const dataItem = data.filter(
      (item) => item.id === record[recordProperty]
    )[0]
    return dataItem[dataProperty]
  }
  const columns = [
    {
      title: "Mã tuyến",
      dataIndex: "routeId",
      render: (text, record) => (
        <>
          {getColumnValue(
            record,
            "routeId",
            assets.sampleRoutes.map((item) => item.routeInfo),
            "routeCode"
          )}
        </>
      ),
      width: 100,
    },
    {
      title: "Đơn vị",
      dataIndex: "unitId",
      render: (text, record) => (
        <>{getColumnValue(record, "unitId", assets.userUnits, "name")}</>
      ),
      width: 100,
    },
    {
      title: "Xe",
      dataIndex: "carId",
      render: (text, record) => (
        <>{getColumnValue(record, "carId", assets.cars, "licensePlate")}</>
      ),
      width: 100,
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

  // Handle when route Change
  const onRouteChange = (id) => {
    const selectedRoute = assets.sampleRoutes.filter(
      (item) => item.routeInfo.id === id
    )[0]
    let convertedDirection = convertDirection(
      JSON.parse(selectedRoute.routeInfo.direction)
    )
    let convertedBackDirection = convertDirection(
      JSON.parse(selectedRoute.routeInfo.wayBack)
    )
    const mergeBound = mergeFitbound(
      convertedDirection.routes[0].bounds,
      convertedBackDirection.routes[0].bounds
    )
    convertedDirection.routes[0].bounds = mergeBound
    convertedBackDirection.routes[0].bounds = mergeBound
    setDirection(convertedDirection)
    setBackDirection(convertedBackDirection)
    drawDirection(selectedRoute.wayPoints, selectedRoute.routeInfo.beginTime)
  }

  //Handle when choose day of week
  const handleDayChange = (value) => {
    if (isEqual(value.sort(), allDayOfWeek)) {
      setCheckedAll(true)
    } else {
      setCheckedAll(false)
    }
  }

  // reload asset
  const handleReloadAsset = (assetProp, path) => {
    const url = `${baseUrl}${path}`
    makeRequest({
      method: "GET",
      url,
      params: {
        paging: false,
      },
    })
      .then((res) => {
        const newProp = {}
        newProp[assetProp] = addListKey(res.data)
        setAssets({ ...assets, ...newProp })
      })
      .catch((err) => console.log(err))
  }

  return (
    <Row style={{ height: "100%" }} gutter={16}>
      <Col span={15}>
        {isLoaded && (
          <GoogleMap
            mapContainerStyle={{
              height: "100%",
              width: "100%",
            }}
            zoom={17}
            center={center}
            onLoad={(map) => {
              map.fitBounds(
                new google.maps.LatLngBounds(
                  new google.maps.LatLng(20.981840000000002, 105.78991),
                  new google.maps.LatLng(21.01169, 105.85975)
                )
              )
              setMyMap(map)
            }}
            onClick={removeActiveMarker}
          >
            {direction && (
              <DirectionsRenderer
                directions={direction}
                options={{
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
                options={{ pixelOffset: new google.maps.Size(0, -32) }}
              >
                <div>{activeInfoWindow.description}</div>
              </InfoWindow>
            ) : null}
            {infoBoxs.length &&
              infoBoxs.map((item, index) => (
                <InfoBox
                  key={index}
                  position={item.position}
                  options={{
                    pixelOffset: new google.maps.Size(-18, 0),
                    closeBoxURL: "",
                    enableEventPropagation: true,
                  }}
                  zIndex={1001}
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
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="arrow-down h-6 w-6"
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
            <tbody>
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
            </tbody>
          </table>
        </div>
      </Col>
      <Col span={9}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2>Danh sách phân công</h2>
          <Button type="primary" onClick={onOpenDrawer}>
            Tạo phân công tuyến
          </Button>
        </div>
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col span={8}>
            <Text>Mã tuyến</Text>
          </Col>
          <Col span={16}>
            <SearchSelect
              dataIndex="routeId"
              placeholder="Chọn mã tuyến"
              data={assets.sampleRoutes
                .map((route) => route.routeInfo)
                .map((item) => ({
                  value: item.id,
                  label: item.routeCode,
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
            <Text>Đơn vị</Text>
          </Col>
          <Col span={16}>
            <SearchSelect
              dataIndex="unitId"
              placeholder="Chọn đơn vị"
              data={assets.userUnits.map((item) => ({
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
            <Text>Xe</Text>
          </Col>
          <Col span={16}>
            <SearchSelect
              dataIndex="carId"
              placeholder="Chọn xe"
              data={assets.cars.map((item) => ({
                value: item.id,
                label: item.licensePlate,
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
            <Text>Ngày phân công</Text>
          </Col>
          <Col span={16}>
            <SearchRangeDate
              dataIndex={["beginDate", "endDate"]}
              placeholder="Ngày phân công"
              filter={filter}
              setFilter={setFilter}
              setLastFilter={setLastFilter}
              handleSearch={handleSearch}
              pagination={pagination}
              style={{ width: "100%" }}
            ></SearchRangeDate>
          </Col>
        </Row>
        <Table
          dataSource={assets.segmentations}
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
      </Col>
      <Drawer
        title="Thông tin phân công"
        placement="right"
        visible={visible}
        maskStyle={{ opacity: 0 }}
        width="500"
        onClose={onClose}
      >
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
              {assets.userUnits.map((item, index) => (
                <Option value={item.id} key={index}>
                  {item.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="carId"
            label={
              <>
                Xe [
                <Tooltip title="Reload">
                  <ReloadOutlined
                    onClick={() => handleReloadAsset("cars", "/cars")}
                    style={{ color: "#1890ff" }}
                  />
                </Tooltip>
                ]
              </>
            }
            rules={[
              {
                required: true,
                message: "Trường này không được thiếu",
              },
            ]}
          >
            <Select>
              {assets.cars.map((item, index) => (
                <Option value={item.id} key={index}>
                  {item.licensePlate}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="driverId"
            label={
              <>
                Lái xe [
                <Tooltip title="Reload">
                  <ReloadOutlined
                    onClick={() =>
                      handleReloadAsset("drivers", "/members/drivers")
                    }
                    style={{ color: "#1890ff" }}
                  />
                </Tooltip>
                ]
              </>
            }
            rules={[
              {
                required: true,
                message: "Trường này không được thiếu",
              },
            ]}
          >
            <Select>
              {assets.drivers.map((item, index) => (
                <Option value={item.id} key={index}>
                  {item.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="routeId"
            label={
              <>
                Tuyến [
                <Tooltip title="Reload">
                  <ReloadOutlined
                    onClick={() => handleReloadAsset("sampleRoutes", "/routes")}
                    style={{ color: "#1890ff" }}
                  />
                </Tooltip>
                ]
              </>
            }
            rules={[
              {
                required: true,
                message: "Trường này không được thiếu",
              },
            ]}
          >
            <Select onChange={onRouteChange}>
              {assets.sampleRoutes
                .map((route) => route.routeInfo)
                .map((item, index) => (
                  <Option value={item.id} key={index}>
                    {item.routeCode}
                  </Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="treasurerId"
            label={
              <>
                Chủ hàng/ Thủ quỹ [
                <Tooltip title="Reload">
                  <ReloadOutlined
                    onClick={() =>
                      handleReloadAsset("treasures", "/members/treasurers")
                    }
                    style={{ color: "#1890ff" }}
                  />
                </Tooltip>
                ]
              </>
            }
            rules={[
              {
                required: true,
                message: "Trường này không được thiếu",
              },
            ]}
          >
            <Select>
              {assets.treasures.map((item, index) => (
                <Option value={item.id} key={index}>
                  {item.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="atmtechnicanId"
            label={
              <>
                Kỹ thuật viên ATM [
                <Tooltip title="Reload">
                  <ReloadOutlined
                    onClick={() =>
                      handleReloadAsset(
                        "atmTechnicans",
                        "/members/atm-technicans"
                      )
                    }
                    style={{ color: "#1890ff" }}
                  />
                </Tooltip>
                ]
              </>
            }
            rules={[
              {
                required: true,
                message: "Trường này không được thiếu",
              },
            ]}
          >
            <Select>
              {assets.atmTechnicans.map((item, index) => (
                <Option value={item.id} key={index}>
                  {item.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="beginTime" label="Thời điểm khởi hành">
            <TimePicker format="HH:mm" />
          </Form.Item>
          <Form.Item name="endTime" label="Thời điểm kết thúc">
            <TimePicker format="HH:mm" />
          </Form.Item>
          <Form.Item name="beginDate" label="Từ ngày">
            <DatePicker format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="endDate" label="Đến ngày">
            <DatePicker format="YYYY-MM-DD" />
          </Form.Item>
          <Checkbox checked={checkedAll} onChange={handleCheckedAll}>
            Tất cả các ngày trong tuần
          </Checkbox>
          <Form.Item
            wrapperCol={{ offset: 0, span: 24 }}
            style={{ marginTop: 20 }}
            name="day"
          >
            <Checkbox.Group
              onChange={handleDayChange}
              style={{ marginBottom: 20, width: "100%" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {dayOfWeek.map((item, index) => (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      padding: 3,
                      backgroundColor: "#1890ff",
                      color: "white",
                      width: 48,
                      borderRadius: 5,
                    }}
                    key={index}
                  >
                    <Checkbox
                      value={item.value}
                      style={{ margin: "auto" }}
                    ></Checkbox>
                    <p style={{ margin: "auto", textAlign: "center" }}>
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item
            name="control"
            label="Xuất lệnh điều xe"
            valuePropName="checked"
          >
            <Checkbox />
          </Form.Item>
          <Form.Item name="sms" label="Gửi sms" valuePropName="checked">
            <Checkbox />
          </Form.Item>

          <Form.Item
            wrapperCol={{ offset: 0, span: 24 }}
            style={{ marginTop: 20 }}
          >
            <Button type="primary" onClick={() => form.submit()}>
              Lưu
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
      <CustomSkeleton loading={loading} />
    </Row>
  )
}

export default Segmentation
