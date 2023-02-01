import React from "react"
import { Spin } from "antd"

const CustomSkeleton = ({ loading }) => {
  return (
    loading && (
      <div className="skeleton">
        <Spin className="skeleton-spin" />
      </div>
    )
  )
}

export default CustomSkeleton
