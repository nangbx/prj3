import { useState, useEffect, Fragment } from "react"
import { Row, Col, Button, Divider } from "antd"

import PermissionTable from "./PermissionTable"
import CreatePermissionModal from "./CreatePermissionModal"
import makeRequest from "../../utils/makeRequest"
import { requestUrl } from "../../resource/requestUrl"
import AllowedRouteTable from "./AllowedRouteTable"

import "./Permission.css"

const Permission = () => {
  const [scopes, setScopes] = useState([])
  const [scope, setScope] = useState({})
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const data = await makeRequest({
        method: "GET",
        url: requestUrl.scope.readUrl(),
      })

      setScopes(data)
    }

    fetchData()
  }, [])

  const onScopeChange = (scope) => {
    setScope(scope)
  }

  return (
    <Fragment>
      <Row gutter={[16, 16]} style={{ height: "100%" }}>
        <Col span={4} style={{ borderRight: "thin solid gainsboro" }}>
          <Row gutter={[10, 10]}>
            <Col span={24}>Danh sách nhóm quyền</Col>
            {scopes.map((item) => (
              <Col span={24} key={item.id}>
                <Button
                  style={{ width: "100%" }}
                  onClick={() => onScopeChange(item)}
                >
                  {item.name}
                </Button>
              </Col>
            ))}
          </Row>
          <Divider />
          <Row style={{ marginTop: "30px" }}>
            <Col span={24}>
              <Button
                type="primary"
                style={{ width: "100%" }}
                onClick={() => setVisible(true)}
              >
                + Thêm nhóm quyền mới
              </Button>
            </Col>
          </Row>
        </Col>
        <Col span={20}>
          <Row style={{ height: "100%" }} gutter={[16, 16]}>
            <Col span={12}>
              <PermissionTable scope={scope}></PermissionTable>
            </Col>
            <Col span={12}>
              <AllowedRouteTable scope={scope} />
            </Col>
          </Row>
        </Col>
      </Row>
      <CreatePermissionModal
        visible={visible}
        setVisible={setVisible}
        scopes={scopes}
        setScopes={setScopes}
      ></CreatePermissionModal>
    </Fragment>
  )
}

export default Permission
