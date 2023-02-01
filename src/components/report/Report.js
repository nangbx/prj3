import {
  Col,
  Row,
  DatePicker,
  Select,
  Button,
  Space,
  Tooltip,
  message,
  Table,
} from "antd"
import { useState, useEffect } from "react"
import { CloudDownloadOutlined, SnippetsOutlined } from "@ant-design/icons"
import moment from "moment"
import { saveAs } from "file-saver"

import makeRequest, { parseRequestParams } from "../../utils/makeRequest"
import { requestUrl, host } from "../../resource/requestUrl"
import { reportConfig } from "../../config/report"
import CustomSkeleton from "../skeleton/CustomSkeleton"
import reportHandler from "../../handle/report"
import { FILEACTION } from "../../const/fileAction"

import "./Report.css"
import "../../styles/filterItem.css"

const { Option } = Select
const dateFormat = "YYYY-MM-DD"

const Report = () => {
  const [assets, setAssets] = useState({
    userUnits: [],
    cars: [],
    drivers: [],
    treasurers: [],
    sampleRoutes: [],
  })
  const [reportFilter, setReportFilter] = useState({
    beginDate: moment(),
    endDate: moment(),
    unitId: null,
    object: 0, // Báo cáo theo
    type: 0, // Loại báo cáo
    additional: null, // Thông tin thêm khi loại báo cáo là sự kiện cảnh báo
    objectList: [], // Danh sách các đối tượng được liệt kê trong báo cáo
  })
  const [loading, setLoading] = useState(true)
  const [objectList, setObjectList] = useState([])
  const [tableConfig, setTableConfig] = useState({
    columns: [],
    data: [],
  })

  useEffect(() => {
    const getAssetData = async () => {
      const [userUnitsRs, carsRs, driversRs, treasurersRs, sampleRoutesRs] =
        await Promise.all([
          makeRequest({
            method: "GET",
            url: requestUrl.userUnit.readUrl(),
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
            url: requestUrl.route.readUrl(),
            params: {
              paging: false,
            },
          }),
        ])
      setAssets({
        userUnits: userUnitsRs.data,
        cars: carsRs.data,
        drivers: driversRs.data,
        treasurers: treasurersRs.data,
        sampleRoutes: sampleRoutesRs.data,
      })
      setObjectList(
        carsRs.data.map((item) => ({
          value: item.id,
          label: item.licensePlate,
        }))
      )
      setReportFilter({ ...reportFilter, unitId: userUnitsRs.data[0].id })
      setLoading(false)
    }
    getAssetData()
  }, [])

  const getSelectMultipleValue = (value, all) => {
    if (value && value.length && value.includes("all")) {
      if (value.length === all.length + 1) {
        return []
      }
      return [...all]
    }
    return value
  }

  const handleSelectAllSos = (value) => {
    const all = reportConfig.sos.map((item) => item.value)
    const selectValue = getSelectMultipleValue(value, all)
    setReportFilter({ ...reportFilter, additional: selectValue })
  }

  const handleObjectChange = (objectValue) => {
    setReportFilter({ ...reportFilter, object: objectValue, objectList: [] })
    switch (objectValue) {
      case 0:
        setObjectList(
          assets.cars.map((item) => ({
            value: item.id,
            label: item.licensePlate,
          }))
        )
        break
      case 1:
        setObjectList(
          assets.drivers.map((item) => ({
            value: item.id,
            label: item.name,
          }))
        )
        break
      default:
        setObjectList(
          assets.treasurers.map((item) => ({
            value: item.id,
            label: item.name,
          }))
        )
    }
  }

  const handleSelectAllObject = (value) => {
    const all = objectList.map((item) => item.value)
    const selectValue = getSelectMultipleValue(value, all)
    console.log(selectValue)
    setReportFilter({ ...reportFilter, objectList: selectValue })
  }

  const handleGetReport = () => {
    // Nếu báo cáo là xe và báo cáo là báo cáo tổng hợp, km theo xe
    if (reportFilter.object === 0 && [0, 3].includes(reportFilter.type)) {
      if (reportFilter.objectList.length) {
        getReportData()
      } else {
        message.warn("Bạn chưa chọn đối tượng nào!")
      }
    } else {
      message.warn("không có dữ liệu về báo cáo này!")
    }
  }

  const getReportData = () => {
    const formatedFilter = {
      ...reportFilter,
      beginDate: reportFilter.beginDate.format(dateFormat),
      endDate: reportFilter.endDate.format(dateFormat),
    }
    const parseParams = parseRequestParams(formatedFilter)
    setLoading(true)
    makeRequest({
      method: "GET",
      url: requestUrl.carReport.readUrl(),
      params: parseParams,
    })
      .then((res) => {
        setTableConfig({
          columns: reportConfig.tableHeader.carReport[reportFilter.type],
          data: res.data,
        })
      })
      .catch((err) => console.log(err))
      .finally(() => {
        setLoading(false)
      })
  }

  const handleExportReport = (action) => {
    setLoading(true)
    const columns = tableConfig.columns.map((item) => item.title)
    const tableHeader = reportHandler.getTableHeader(columns)
    let tableBody
    if (reportFilter.type === 0) {
      tableBody = reportHandler.getDailyCarReportBody(tableConfig.data)
    } else if (reportFilter.type === 3) {
      tableBody = reportHandler.getDailyKmCarReportBody(tableConfig.data)
    }
    const data = {
      obj: "Xe",
      type: reportFilter.type,
      reportBody: `${tableHeader}${tableBody}`,
      beginDate: reportFilter.beginDate.format("DD/MM/YYYY"),
      endDate: reportFilter.endDate.format("DD/MM/YYYY"),
    }
    makeRequest({
      method: "POST",
      url: requestUrl.report.createUrl(),
      data,
    }).then((res) => {
      const fileName = res.data
      const fileLocation = `${host}/reports/${fileName}`
      switch (action) {
        case FILEACTION.DOWNLOAD:
          saveAs(fileLocation, fileName)
          break
        default:
          window.open(fileLocation, "_blank", "noopener,noreferrer")
      }
      setLoading(false)
    })
  }

  return (
    <Row style={{ height: "100%" }} gutter={[6, 6]}>
      <Col span={4}>
        <div className="filter-wrapper">
          <label className="filter-label">Từ ngày</label>
          <DatePicker
            className="filter-item"
            value={reportFilter.beginDate}
            onChange={(time) => {
              setReportFilter({ ...reportFilter, beginDate: time })
            }}
          />
        </div>
        <div className="filter-wrapper">
          <label className="filter-label">Đến ngày</label>
          <DatePicker
            className="filter-item"
            value={reportFilter.endDate}
            onChange={(time) => {
              setReportFilter({ ...reportFilter, endDate: time })
            }}
          />
        </div>
        <div className="filter-wrapper">
          <label className="filter-label">Đơn vị</label>
          <Select
            className="filter-item"
            style={{ overflowX: "hidden" }}
            value={reportFilter.unitId}
            onChange={(value) =>
              setReportFilter({ ...reportFilter, unitId: value })
            }
          >
            {assets.userUnits.map((item, index) => (
              <Option value={item.id} key={index}>
                {item.name}
              </Option>
            ))}
          </Select>
        </div>
        <div className="filter-wrapper">
          <label className="filter-label">Báo cáo theo</label>
          <Select
            className="filter-item"
            style={{ overflowX: "hidden" }}
            value={reportFilter.object}
            onChange={(value) => handleObjectChange(value)}
          >
            {reportConfig.subject.map((item, index) => (
              <Option value={item.value} key={index}>
                {item.label}
              </Option>
            ))}
          </Select>
        </div>
        <div className="filter-wrapper">
          <label className="filter-label">Loại báo cáo</label>
          <Select
            className="filter-item"
            style={{ overflowX: "hidden" }}
            value={reportFilter.type}
            onChange={(value) =>
              setReportFilter({ ...reportFilter, type: value })
            }
          >
            {reportConfig.reportType.map((item, index) => (
              <Option value={item.value} key={index}>
                {item.label}
              </Option>
            ))}
          </Select>
        </div>
        {reportFilter.type === 4 && (
          <div className="filter-wrapper">
            <label className="filter-label">Loại cảnh báo</label>
            <Select
              className="filter-item"
              style={{ overflowX: "hidden" }}
              mode="multiple"
              maxTagCount={0}
              onChange={handleSelectAllSos}
              value={reportFilter.additional}
              allowClear
            >
              <Option value="all" key="all">
                Tất cả
              </Option>
              {reportConfig.sos.map((item, index) => (
                <Option value={item.value} key={index}>
                  {item.label}
                </Option>
              ))}
            </Select>
          </div>
        )}
        <div className="filter-wrapper">
          <label className="filter-label">
            {
              reportConfig.subject.filter(
                (item) => item.value === reportFilter.object
              )[0].label
            }
          </label>
          <Select
            className="filter-item"
            style={{ overflowX: "hidden" }}
            mode="multiple"
            maxTagCount={0}
            onChange={handleSelectAllObject}
            value={reportFilter.objectList}
            allowClear
          >
            <Option value="all" key="all">
              Tất cả
            </Option>
            {objectList.map((item) => (
              <Option value={item.value} key={item.value}>
                {item.label}
              </Option>
            ))}
          </Select>
        </div>
        <Button type="primary" onClick={handleGetReport}>
          Xem báo cáo
        </Button>
      </Col>
      <Col span={20} style={{ backgroundColor: "#e2e2e2" }}>
        <div className="toolbar">
          <Space>
            <Tooltip
              title="Export report and save to the disk"
              placement="bottomLeft"
            >
              <CloudDownloadOutlined
                style={{ fontSize: 18, margin: "auto" }}
                onClick={() => handleExportReport(FILEACTION.DOWNLOAD)}
              />
            </Tooltip>
            <Tooltip
              title="Export report and open in new window"
              placement="bottomLeft"
            >
              <SnippetsOutlined
                style={{ fontSize: 18, margin: "auto" }}
                onClick={() => handleExportReport(FILEACTION.OPEN)}
              />
            </Tooltip>
            <Select size="small" style={{ minWidth: 70, fontSize: 12 }}>
              {reportConfig.fileType.map((item) => (
                <Option value={item.value}>{item.label}</Option>
              ))}
            </Select>
          </Space>
        </div>
        {tableConfig.columns.length && (
          <Table
            columns={tableConfig.columns}
            dataSource={tableConfig.data}
            style={{ marginTop: 45 }}
            pagination={{
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total}`,
            }}
          />
        )}
      </Col>
      <CustomSkeleton loading={loading} />
    </Row>
  )
}

export default Report
