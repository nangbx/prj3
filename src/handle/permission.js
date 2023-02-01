import _ from "lodash"

export const parseJsonData = (permission = []) => {
  permission = permission.map((item) => {
    let permission = item.permission
    permission.resource = JSON.parse(permission.resource)
    permission.filterValue = permission.filterValue
      ? JSON.parse(permission.filterValue)
      : ""
    item.filter = item.filter ? JSON.parse(item.filter) : ""
    item = { permission, ...item }
    return item
  })

  return permission
}

export const isEq = (a, b) => {
  var aProps = Object.getOwnPropertyNames(a)
  var bProps = Object.getOwnPropertyNames(b)
  if (aProps.length !== bProps.length) {
    return false
  }
  for (var i = 0; i < aProps.length; i++) {
    var propName = aProps[i]
    if (a[propName] !== b[propName]) {
      return false
    }
  }
  return true
}

export const getArrObjPresent = (arr1, arr2) => {
  var presents = _.intersectionWith(arr1, arr2, _.isEqual)
  return presents
}

export const getArrObjDifference = (arrA, arrB) => {
  let diff = []
  arrA.forEach((itemA) => {
    if (!arrB.some((itemB) => isEq(itemA, itemB))) {
      diff.push(itemA)
    }
  })
  arrB.forEach((itemB) => {
    if (
      !diff.some((p) => isEq(itemB, p)) &&
      !arrA.some((itemA) => isEq(itemA, itemB))
    ) {
      diff.push(itemB)
    }
  })
  return diff
}

export const flattenData = (scopePermission = []) => {
  let parseData = parseJsonData(scopePermission)
  let scopePermissions = []
  parseData.forEach((item) => {
    let scpFilter = item.filter
    let pFilter = item.permission.filterValue

    if (item.permission.filter) {
      let filters = []
      for (let i = 0; i < pFilter.length; i++) {
        let filterData = {}
        filterData.field = pFilter[i].field
        filterData.displayName = pFilter[i].displayName

        let pres
        let diff
        if (Array.isArray(scpFilter)) {
          pres = getArrObjPresent(scpFilter[i].value, pFilter[i].value)
          diff = getArrObjDifference(scpFilter[i].value, pFilter[i].value)
        } else {
          pres = getArrObjPresent([], pFilter[i].value)
          diff = getArrObjDifference([], pFilter[i].value)
        }
        pres.map((item) => (item.allowed = true))
        diff.map((item) => (item.allowed = false))
        filterData.value = [...pres, ...diff]
        filters.push(filterData)
      }

      let permission = {
        id: item.id,
        resource: item.permission.resource,
        action: item.permission.action,
        filter: item.permission.filter,
        filterData: filters,
        allowed: item.allowed,
      }
      scopePermissions.push(permission)
    } else {
      let permission = {
        id: item.id,
        resource: item.permission.resource,
        action: item.permission.action,
        filter: item.permission.filter,
        filterData: "",
        allowed: item.allowed,
      }
      scopePermissions.push(permission)
    }
  })

  return scopePermissions
}

export const groupByResource = (scopePermissions = []) => {
  let flatten = flattenData(scopePermissions)
  let result = _(flatten)
    .groupBy((x) => x.resource.displayName)
    .map((value, key) => ({ resource: key, permisison: value }))
    .value()
  return result
}

export const stringToSlug = (str) => {
  // remove accents
  var from =
      "àáãảạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđùúủũụưừứửữựòóỏõọôồốổỗộơờớởỡợìíỉĩịäëïîöüûñçýỳỹỵỷ",
    to =
      "aaaaaaaaaaaaaaaaaeeeeeeeeeeeduuuuuuuuuuuoooooooooooooooooiiiiiaeiiouuncyyyyy"
  for (var i = 0, l = from.length; i < l; i++) {
    str = str.replace(RegExp(from[i], "gi"), to[i])
  }

  str = str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\-]/g, "-")
    .replace(/-+/g, "-")

  return str
}

export const getTreeData = (scopePermissions = []) => {
  const groupData = groupByResource(scopePermissions)

  let treeData = []
  let defaultCheckedKeys = []
  let expandedKeys = []

  groupData.forEach((item, index) => {
    let treePaNode = {}
    treePaNode.title = (
      <span style={{ fontWeight: "bold" }}>{item.resource}</span>
    )
    treePaNode.key = stringToSlug(item.resource)
    treePaNode.checkable = false
    treePaNode.children = []
    expandedKeys.push(treePaNode.key)

    let permissions = item.permisison
    permissions.forEach((permisison) => {
      let actionNode = {}
      actionNode.title = (
        <span style={{ fontStyle: "italic" }}>{permisison.action}</span>
      )
      actionNode.key = permisison.id
      expandedKeys.push(actionNode.key)
      actionNode.children = []
      if (permisison.allowed === "true") defaultCheckedKeys.push(actionNode.key)

      let filterType = permisison.filter
      let filter = permisison.filterData
      if (filterType !== "") {
        filter.forEach((item) => {
          let tmp = {}
          tmp.title = item.displayName
          tmp.checkable = false
          tmp.key = `${actionNode.key}-${item.field}`
          tmp.children = []
          expandedKeys.push(tmp.key)

          item.value.forEach((x) => {
            let tmpData = {}
            tmpData.title = x.description
            tmpData.key = `${tmp.key}-${x.valueName}`
            tmp.children.push(tmpData)

            if (x.allowed) defaultCheckedKeys.push(tmpData.key)
          })
          actionNode.children.push(tmp)
        })
      }

      treePaNode.children.push(actionNode)
    })
    treeData.push(treePaNode)
  })

  return { treeData, defaultCheckedKeys, expandedKeys }
}

export const extractChangedPermission = (
  permissionChange = [],
  checkedNode = []
) => {
  let rs = []

  permissionChange.map((item) => {
    let scopePermission = {}
    scopePermission.id = item.key
    scopePermission.allowed = "true"
    scopePermission.filter = []
    if (item.children.length) {
      let filters = item.children
      filters.forEach((filter) => {
        let tmpFilter = {}
        let filterFieldStr = filter.key.split("-")
        tmpFilter.field = filterFieldStr[filterFieldStr.length - 1]
        tmpFilter.displayName = filter.title
        tmpFilter.value = []
        let filterValues = filter.children
        filterValues.forEach((value) => {
          if (checkedNode.filter((e) => e.key === value.key).length) {
            let tmpValue = {}
            let valueNameStr = value.key.split("-")
            tmpValue.valueName = valueNameStr[valueNameStr.length - 1]
            tmpValue.description = value.title
            tmpFilter.value.push(tmpValue)
          }
        })
        scopePermission.filter.push(tmpFilter)
      })
    } else {
      scopePermission.filter = ""
    }
    scopePermission.filter = scopePermission.filter.length
      ? scopePermission.filter
      : ""
    rs.push(scopePermission)
  })

  return rs
}
