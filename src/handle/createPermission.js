import _ from "lodash"

import { stringToSlug } from "./permission"

const groupByResource = (scopePermissions = []) => {
  let result = _(scopePermissions)
    .groupBy((x) => x.resource.displayName)
    .map((value, key) => ({ resource: key, permisison: value }))
    .value()
  return result
}

export const getCreatePermissionTreeData = (permissions = []) => {
  permissions.map((item) => {
    item.resource = JSON.parse(item.resource)
    item.filterValue = item.filterValue ? JSON.parse(item.filterValue) : ""
    return item
  })

  let permissionsGroup = groupByResource(permissions)

  let treeData = []
  let expandedKeys = []

  permissionsGroup.forEach((item, index) => {
    let treePaNode = {}
    treePaNode.title = (
      <span style={{ fontWeight: "bold" }}>{item.resource}</span>
    )
    treePaNode.key = stringToSlug(item.resource)
    treePaNode.checkable = false
    treePaNode.children = []
    expandedKeys.push(treePaNode.key)

    let permissions = item.permisison
    permissions.forEach((permission) => {
      let permissionNode = {}
      permissionNode.title = (
        <span style={{ fontStyle: "italic" }}>{permission.action}</span>
      )
      permissionNode.key = permission.id
      permissionNode.children = []

      expandedKeys.push(permissionNode.key)

      let filters = permission.filterValue
      if (filters !== "") {
        filters.forEach((filter) => {
          let filterTypeNode = {}
          filterTypeNode.title = filter.displayName
          filterTypeNode.key = `${permissionNode.key}-${filter.field}`
          filterTypeNode.children = []
          filterTypeNode.checkable = false

          expandedKeys.push(filterTypeNode.key)

          let filterValues = filter.value
          filterValues.forEach((value) => {
            let valueNode = {}
            valueNode.title = value.description
            valueNode.key = `${filterTypeNode.key}-${value.valueName}`

            filterTypeNode.children.push(valueNode)
          })

          permissionNode.children.push(filterTypeNode)
        })
      }

      treePaNode.children.push(permissionNode)
    })

    treeData.push(treePaNode)
  })

  return { treeData, expandedKeys }
}

export const getCreatedScopePermissionData = (
  scopeName,
  checkedKeys = [],
  data = []
) => {
  let rs = {}
  rs.scopeName = scopeName
  rs.permissionData = []
  data.map((item) => {
    let scopePermission = {}
    scopePermission.permissionId = item.key
    scopePermission.filter = []
    let filters = item.children

    if (filters.length) {
      filters.forEach((filter) => {
        let filterObj = {}
        let fieldKey = filter.key.split("-")
        filterObj.field = fieldKey[fieldKey.length - 1]
        filterObj.displayName = filter.title
        filterObj.value = []

        let filterValues = filter.children
        filterValues.forEach((filterValue) => {
          if (checkedKeys.includes(filterValue.key)) {
            let filterValueObj = {}
            let filterValueKey = filterValue.key.split("-")
            filterValueObj.valueName = filterValueKey[filterValueKey.length - 1]
            filterValueObj.description = filterValue.title

            filterObj.value.push(filterValueObj)
          }
        })

        scopePermission.filter.push(filterObj)
      })
    }

    rs.permissionData.push(scopePermission)
  })

  rs.permissionData = JSON.stringify(rs.permissionData)
  return rs
}
