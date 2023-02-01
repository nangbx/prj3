import { useEffect, useState } from "react"
import { Tree, Button, notification } from "antd"
import { without } from "lodash"
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons"
import AutoSizer from "react-virtualized-auto-sizer"

import {
  isArrayEqual,
  getDifference,
  getPresent,
  removeDuplicate,
} from "../../utils/arrHandle"
import makeRequest from "../../utils/makeRequest"
import { getTreeData, extractChangedPermission } from "../../handle/permission"
import { requestUrl } from "../../resource/requestUrl"

const PermissionTable = ({ scope }) => {
  const [permissions, setPermissions] = useState([])
  const [checkedKeys, setcheckedKeys] = useState([])
  const [expandedKeys, setExpandedKeys] = useState([])
  const [originCheckedKey, setOriginCheckedKey] = useState([])
  const [deactivePermission, setDeactivePermission] = useState([])
  const [permissionChange, setPermissionChange] = useState([])
  const [checkedNode, setCheckedNode] = useState([])

  useEffect(() => {
    const getPermissions = async () => {
      const data = await makeRequest({
        method: "GET",
        url: requestUrl.scopePermission.readUrl(),
        params: {
          scopeId: scope.id,
        },
      })
      const { treeData, defaultCheckedKeys, expandedKeys } = getTreeData(data)
      setPermissions(treeData)
      setOriginCheckedKey(defaultCheckedKeys)
      setcheckedKeys(defaultCheckedKeys)
      setExpandedKeys(expandedKeys)
    }

    getPermissions()
  }, [scope])

  const onSavePermission = async () => {
    const changedPermission = checkedNode.filter((item) =>
      permissionChange.includes(item.key)
    )
    let data = {}
    data.PermissionChange = JSON.stringify(
      extractChangedPermission(changedPermission, checkedNode)
    )
    data.PermissionDeActive = JSON.stringify(deactivePermission)
    const rs = await makeRequest({
      url: requestUrl.permission.updateUrl({ useId: false }),
      method: "PUT",
      data,
    })

    let notificationData = {}
    notificationData.message = "Thông báo"
    notificationData.description = rs.data

    switch (rs.statusCode) {
      case 200:
        notificationData.icon = (
          <CheckCircleOutlined style={{ color: "#108ee9" }} />
        )
        break
      case 500:
        notificationData.icon = (
          <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
        )
        break
    }
    notification.open(notificationData)
  }

  const onCheck = (checkKeys, info) => {
    setcheckedKeys(checkKeys)
    const diff = getDifference(checkKeys, originCheckedKey)
    let activeKey = getPresent(diff, checkKeys)
    let deactivatekey = getPresent(diff, originCheckedKey)

    let deactivePermissions = deactivatekey.filter(
      (item) => typeof item === "number"
    )
    let deactiveChange = deactivatekey.filter(
      (item) => typeof item !== "number"
    )
    let change = activeKey.concat(deactiveChange)
    let ChangedPermission = change.map((item) => item.toString().split("-")[0])
    ChangedPermission = removeDuplicate(ChangedPermission).map((item) =>
      parseInt(item)
    )
    ChangedPermission = without(ChangedPermission, ...deactivePermission)

    setDeactivePermission(deactivePermissions)
    setPermissionChange(ChangedPermission)
    setCheckedNode(info.checkedNodes)
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        border: "thin solid gray",
        borderRadius: 3,
        backgroundColor: "#fff",
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
          Danh sách quyền nhóm <b>{scope && scope.name}</b>
        </p>
        {/* {!isArrayEqual(checkedKeys, originCheckedKey) && ( */}
        <Button
          type="primary"
          onClick={async () => {
            await onSavePermission()
          }}
        >
          Lưu thay đổi
        </Button>
        {/* )} */}
      </div>
      {permissions.length ? (
        <div style={{ flex: 1 }}>
          <AutoSizer disableWidth>
            {({ height, width }) => (
              <Tree
                checkable
                height={height}
                style={{ overflowY: "auto" }}
                expandedKeys={expandedKeys}
                checkedKeys={checkedKeys}
                selectable={false}
                treeData={permissions}
                onCheck={onCheck}
              />
            )}
          </AutoSizer>
        </div>
      ) : (
        <></>
      )}
    </div>
  )
}

export default PermissionTable
