import { Button, Checkbox, message, notification } from "antd"
import { useState, useEffect } from "react"
import { CheckOutlined, WarningOutlined } from "@ant-design/icons"

import { dashboardRoute } from "../../config/dashboardRoute"
import { requestUrl } from "../../resource/requestUrl"
import makeRequest from "../../utils/makeRequest"

const CheckboxGroup = Checkbox.Group

function AllowedRouteTable({ scope }) {
  const [allowedRoutes, setAllowedRoutes] = useState([])

  const updateScopeAllowedRoute = () => {
    const data = {
      scopeId: scope.id,
      allowedRoutes: JSON.stringify(allowedRoutes),
    }
    if (!scope) message.warn("Bạn chưa chọn nhóm quyền!")
    else {
      makeRequest({
        url: requestUrl.scopeAllowedRoute.updateUrl({ useId: false }),
        method: "PUT",
        data,
      }).then((res) => {
        notification.open({
          message: "Thông báo",
          icon: res.succeeded ? (
            <CheckOutlined style={{ color: "#2fd351" }} />
          ) : (
            <WarningOutlined style={{ color: "#ffb800" }} />
          ),
          description: res.message,
        })
      })
    }
  }

  const onAllowedRouteChange = (routes) => {
    setAllowedRoutes(routes)
    console.log(scope)
  }

  useEffect(() => {
    const getAllowedRoutes = async () => {
      const res = await makeRequest({
        method: "GET",
        url: requestUrl.scopeAllowedRoute.readByIdUrl(scope.id),
      })
      setAllowedRoutes(res.data)
    }
    if (scope && scope.id) getAllowedRoutes()
  }, [scope])

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        border: "thin solid gray",
        borderRadius: 3,
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderBottom: "thin solid gray",
          padding: "15px 15px 5px 15px",
        }}
      >
        <p>
          Danh sách màn hình được truy cập nhóm <b>{scope ? scope.name : ""}</b>
          <b>{scope && scope.scopeName}</b>
        </p>

        <Button type="primary" onClick={updateScopeAllowedRoute}>
          Lưu thay đổi
        </Button>
      </div>
      <div style={{ height: "100%", padding: 10 }}>
        <CheckboxGroup
          options={dashboardRoute}
          value={allowedRoutes}
          onChange={onAllowedRouteChange}
        />
      </div>
    </div>
  )
}

export default AllowedRouteTable
