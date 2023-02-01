import React, { useRef, useState, useEffect } from "react"
import { FixedSizeList as List, areEqual } from "react-window"
import memoize from "memoize-one"
import AutoSizer from "react-virtualized-auto-sizer"
import moment from "moment"
import { PauseCircleOutlined, PlayCircleOutlined } from "@ant-design/icons"
import { message } from "antd"

import "./historyList.css"
import "../../styles/customScrollBar.css"

const dateTimeFormat = "HH:mm:ss DD-MM-YYYY"
const ACTION = {
  PLAY: "play",
  PAUSE: "pause",
}

const Row = React.memo(({ data, index, style }) => {
  const {
    ref,
    inputRef,
    items,
    toggleItemActive,
    setLastIndex,
    setSelectIndex,
    lastIndex,
  } = data
  const item = items[index]
  const additionalStyle = { display: "flex", fontSize: 11, cursor: "pointer" }
  style = { ...style, ...additionalStyle }
  return (
    <>
      <div
        style={style}
        onClick={() => {
          ref.current.scrollToItem(index)
          inputRef.current.focus()
          inputRef.current.value = index
          toggleItemActive(index, lastIndex)
          setLastIndex(index)
          setSelectIndex(index)
        }}
        className={item.isActive ? "active" : "inactive"}
      >
        <div style={{ width: 35, paddingLeft: 2 }}>{index}</div>
        <div style={{ flex: 1 }}>
          {moment(item.time).format(dateTimeFormat)}
        </div>
        <div style={{ width: 20 }}>{item.velocity}</div>
      </div>
      <></>
    </>
  )
}, areEqual)

const generateItems = (histories) => {
  const itemList = histories.map((item, index) => ({
    time: item.deviceTime,
    velocity: item.gpsVelocity,
    isActive: false,
  }))
  return itemList
}

const createItemData = memoize((items, toggleItemActive) => ({
  items,
  toggleItemActive,
}))

const MyList = ({
  items,
  toggleItemActive,
  listRef,
  inputRef,
  setLastIndex,
  setSelectIndex,
  lastIndex,
}) => {
  const itemData = createItemData(items, toggleItemActive)
  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          className="list custom-scroll-bar"
          height={height}
          itemCount={items.length}
          itemSize={20}
          ref={listRef}
          width={width}
          itemData={{
            ref: listRef,
            inputRef: inputRef,
            setLastIndex: setLastIndex,
            setSelectIndex: setSelectIndex,
            lastIndex: lastIndex,
            ...itemData,
          }}
          style={{ border: "1px solid gray" }}
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  )
}

const HistoryList = React.memo(({ histories, setSelectedHistory }) => {
  const [isRuning, setIsRuning] = useState(false)
  const [items, setItems] = useState([])
  const [lastIndex, setLastIndex] = useState(null)
  const [selectIndex, setSelectIndex] = useState(null)
  const [intervalId, setIntervalId] = useState(null)
  const listRef = useRef()
  const inputRef = useRef()

  useEffect(() => {
    if (selectIndex) setSelectedHistory(histories[selectIndex])
  }, [selectIndex])

  useEffect(() => {
    setItems(generateItems(histories))
    if (listRef.current) listRef.current.scrollToItem(0)
    const statisticHistory = histories.map((item) => item.gpsVelocity)
  }, [histories])

  const onKeyDown = (e) => {
    const currentIndex = parseInt(e.target.value)
    const { keyCode, repeat } = e
    if (repeat && intervalId === null) {
      if (keyCode === 38 && currentIndex > 0) {
        handleWatchHistory(ACTION.PLAY, true)
      }
      if (keyCode === 40 && currentIndex < items.length - 1) {
        handleWatchHistory(ACTION.PLAY, false)
      }
    }
    if (!repeat) {
      if (keyCode === 38 && currentIndex > 0) {
        const index = parseInt(e.target.value) - 1
        inputRef.current.value = index
        listRef.current.scrollToItem(index)
        toggleItemActive(index, lastIndex)
      }
      if (keyCode === 40 && currentIndex < items.length - 1) {
        const index = parseInt(e.target.value) + 1
        inputRef.current.value = index
        listRef.current.scrollToItem(index)
        toggleItemActive(index, lastIndex)
      }
    }
  }

  const toggleItemActive = (index, lastIndex) => {
    setItems((items) => {
      const item = items[index]
      const itemsList = items.concat()

      itemsList[index] = {
        ...item,
        isActive: true,
      }
      if (lastIndex != null && index !== lastIndex) {
        const lastItem = itemsList[lastIndex]
        itemsList[lastIndex] = {
          ...lastItem,
          isActive: false,
        }
        setLastIndex(index)
      }
      setSelectIndex(index)
      return itemsList
    })
  }

  const handleWatchHistory = (action, revert = false) => {
    switch (action) {
      case ACTION.PLAY: {
        if (selectIndex === null) {
          message.warn("Bạn chưa chọn thời điểm bắt đầu")
        } else {
          setIsRuning(true)
          const newIntervalId = setInterval(() => {
            let currentIndex = parseInt(inputRef.current.value)
            if (
              currentIndex === items.length - 1 ||
              (currentIndex === 0 && revert)
            ) {
              setIsRuning(false)
              clearInterval(newIntervalId)
              setIntervalId(null)
            } else {
              let lastIndex = currentIndex
              if (revert) currentIndex = currentIndex - 1
              else currentIndex = currentIndex + 1
              inputRef.current.value = currentIndex
              listRef.current.scrollToItem(currentIndex)
              toggleItemActive(currentIndex, lastIndex)
            }
          }, 100)
          setIntervalId(newIntervalId)
        }
        break
      }
      case ACTION.PAUSE: {
        setIsRuning(false)
        clearInterval(intervalId)
        setIntervalId(null)
        break
      }
      default: {
      }
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <input
        ref={inputRef}
        onKeyDown={onKeyDown}
        onKeyUp={() => handleWatchHistory(ACTION.PAUSE, false)}
        style={{ position: "fixed", right: -1000 }}
      ></input>
      <div style={{ display: "flex", justifyContent: "center", height: 20 }}>
        {!isRuning && (
          <PlayCircleOutlined
            style={{ margin: "0 10px" }}
            onClick={() => handleWatchHistory(ACTION.PLAY, false)}
          />
        )}
        <PauseCircleOutlined
          style={{ margin: "0 10px" }}
          onClick={() => handleWatchHistory(ACTION.PAUSE, false)}
        />
      </div>
      <div style={{ display: "flex", fontSize: 12, height: 20 }}>
        <div style={{ width: 35 }}>STT</div>
        <div style={{ flex: 1 }}>Thời gian</div>
        <div>Vận tốc</div>
      </div>
      <div style={{ flex: 1 }}>
        <MyList
          inputRef={inputRef}
          listRef={listRef}
          toggleItemActive={toggleItemActive}
          items={items}
          setLastIndex={setLastIndex}
          setSelectIndex={setSelectIndex}
          lastIndex={lastIndex}
        />
      </div>
    </div>
  )
})

export default HistoryList
