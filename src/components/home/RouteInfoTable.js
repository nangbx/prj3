/* eslint-disable no-undef */
import moment from "moment"
import { useState, useEffect } from "react"
import {
  Table,
  Select,
  TimePicker,
  Button,
  Checkbox,
  Typography,
  notification,
} from "antd"
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

import Point from "../../DTOs/point"
import directionHandle from "../../handle/direction"

// css
import "./customTable.css"
import "./routeInfoTable.css"
import makeRequest from "../../utils/makeRequest"
import { requestUrl } from "../../resource/requestUrl"

const { Option } = Select
const { Text } = Typography

const RouteInfoTable = ({
  segmentation,
  treasurers,
  drivers,
  atmTechnicans,
  transactionPoints,
  wayPoints,
  setVisible,
  autoTurnBack,
  reloadSegmentation,
}) => {
  const [routes, setRoutes] = useState([])
  const [pointIndex, setPointIndex] = useState(1)
  const [routeAutoTurnBack, setRouteAutoTurnBack] = useState(false)

  useEffect(() => {
    setRoutes(wayPoints.map((item, index) => ({ ...item, index: index + 1 })))
    setPointIndex(wayPoints.length + 1)
    setRouteAutoTurnBack(autoTurnBack)
  }, [wayPoints])

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

  const handleDelPoint = (index) => {
    const pointIndex = routes.findIndex((item) => item.index === index)
    let tmpRoutes = [...routes]
    tmpRoutes.splice(pointIndex, 1)
    setRoutes(tmpRoutes)
  }

  const handleAddPoint = () => {
    let data = new Point(pointIndex)
    let tmpRoutes = [...routes]
    tmpRoutes.push(data)
    setRoutes(tmpRoutes)
    setPointIndex(pointIndex + 1)
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

  const handleSubmit = () => {
    const routeInformation = routes.map((item) => {
      return transactionPoints.filter(
        (p) => p.id === item.transactionPointId
      )[0]
    })
    const { origin, destination, waypoints, backOrigin, backDestination } =
      directionHandle.getDirectionServiceOptions(
        routeInformation,
        routeAutoTurnBack
      )
    const DirectionService = new google.maps.DirectionsService()
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
      let mergeBound = new google.maps.LatLngBounds()
      mergeBound.union(goRs.routes[0].bounds)
      mergeBound.union(backRs.routes[0].bounds)
      goRs.routes[0].bounds = mergeBound
      backRs.routes[0].bounds = mergeBound
      const updatedRoutes = routes.map((item, index) => ({
        transactionPointId: item.transactionPointId,
        order: index,
        time: item.time,
      }))
      const data = {
        segmentationId: segmentation.id,
        direction: JSON.stringify(goRs),
        wayBack: JSON.stringify(backRs),
        route: JSON.stringify(updatedRoutes),
        editedin: moment().format("YYYY-MM-DD"),
        autoTurnBack: routeAutoTurnBack,
      }
      makeRequest({
        method: "PUT",
        url: requestUrl.segmentationRoute.updateUrl({ useId: false }),
        data,
      }).then((rs) => {
        reloadSegmentation()
        setVisible(false)
        notification.open({
          message: "Thông báo",
          icon: <CheckOutlined style={{ color: "#2fd351" }} />,
          description: "Cập nhật thành công",
        })
      })
    })
  }

  const pointColumns = [
    {
      title: <DragOutlined />,
      dataIndex: "sort",
      width: 30,
      align: "center",
      className: "drag-visible",
      render: () => <DragHandle />,
    },
    {
      title: "Điểm giao dịch",
      width: 150,
      render: (text, record) => (
        <Select
          style={{ width: "100%" }}
          showSearch
          optionFilterProp="children"
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
          onSelect={(value) => onSelect(value, record.index)}
          value={record.transactionPointId}
        >
          {transactionPoints.map((item, index) => (
            <Option value={item.id} key={index}>
              {item.pointName}
            </Option>
          ))}
        </Select>
      ),
      className: "drag-visible",
    },
    {
      title: "Địa chỉ",
      render: (text, record) => (
        <Select
          style={{ width: 600 }}
          showSearch
          optionFilterProp="children"
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
          onSelect={(value) => onSelect(value, record.index)}
          value={record.transactionPointId}
        >
          {transactionPoints.map((item, index) => (
            <Option value={item.id} key={index}>
              {item.address}
            </Option>
          ))}
        </Select>
      ),
      width: 600,
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
      align: "center",
      render: (text, record) => (
        <CloseCircleOutlined
          style={{ color: "red" }}
          onClick={() => handleDelPoint(record.index)}
        />
      ),
    },
  ]
  return (
    <>
      <table
        className="car-info-box"
        style={{ margin: "auto", marginBottom: 20 }}
      >
        <tbody>
          <tr>
            <td>Tuyến</td>
            <td colSpan={3}>{segmentation.route.routeCode}</td>
          </tr>
          <tr>
            <td>Lái xe</td>
            <td>
              {
                drivers.filter(
                  (driver) => driver.id === segmentation.driverId
                )[0].name
              }
            </td>
            <td>Chủ hàng</td>
            <td>
              {
                treasurers.filter(
                  (treasurer) => treasurer.id === segmentation.treasurerId
                )[0].name
              }
            </td>
          </tr>
          <tr>
            <td>KTV ATM</td>
            <td>
              {
                atmTechnicans.filter(
                  (atmTechnican) =>
                    atmTechnican.id === segmentation.atmtechnicanId
                )[0].name
              }
            </td>
            <td>An ninh</td>
            <td></td>
          </tr>
          <tr>
            <td>Khởi hành</td>
            <td>{`${segmentation.beginTime} ${moment(
              segmentation.beginDate
            ).format("DD-MM-YYYY")}`}</td>
            <td>Kết thúc</td>
            <td>{`${segmentation.endTime} ${moment(segmentation.endDate).format(
              "DD-MM-YYYY"
            )}`}</td>
          </tr>
        </tbody>
      </table>
      <div style={{ display: "flex", justifyContent: "right" }}>
        <Button type="primary" onClick={() => handleAddPoint()}>
          Thêm điểm
        </Button>
      </div>
      <Checkbox
        checked={routeAutoTurnBack}
        onChange={() => setRouteAutoTurnBack(!routeAutoTurnBack)}
      >
        <Text type="danger">Mặc định quay về điểm bắt đầu</Text>
      </Checkbox>
      <Table
        size="small"
        pagination={false}
        dataSource={routes}
        columns={pointColumns}
        rowKey="index"
        className="custom-scroll-bar"
        components={{
          body: {
            wrapper: DraggableContainer,
            row: DraggableBodyRow,
          },
        }}
        style={{ margin: "20px 0", maxHeight: 200, overflowY: "auto" }}
      />
      <div style={{ display: "flex", justifyContent: "right" }}>
        <Button type="primary" onClick={() => handleSubmit()}>
          Cập nhật
        </Button>
      </div>
    </>
  )
}
export default RouteInfoTable
