import "./customTable.css"

const CarBoxInfo = ({ carInfo, units, setModalVisible }) => {
  const openDescriptionModal = (e) => {
    e.preventDefault()
    setModalVisible(true)
  }
  return (
    <table className="car-info-box">
      <tbody>
        <tr>
          <td>Vị trí</td>
          <td colSpan={3}>{carInfo.currentAdd}</td>
        </tr>
        <tr>
          <td>Biển số xe</td>
          <td>
            <a href="#" onClick={(e) => openDescriptionModal(e)}>
              {carInfo.car.licensePlate}
            </a>
          </td>
          <td>Loại xe</td>
          <td>{carInfo.car.type}</td>
        </tr>
        <tr>
          <td>Đơn vị</td>
          <td>
            {units.filter((item) => item.id === carInfo.car.unitId)[0].name}
          </td>
          <td>Tuyến</td>
          <td>{carInfo.route ? carInfo.route : ""}</td>
        </tr>
        <tr>
          <td>Lái xe</td>
          <td>{carInfo.driver ? carInfo.driver : ""}</td>
          <td>Vận tốc</td>
          <td>{carInfo.gpsVelocity} (km/h)</td>
        </tr>
        <tr>
          <td>Chủ hàng</td>
          <td>{carInfo.treasurer ? carInfo.treasurer : ""}</td>
          <td>Trạng thái</td>
          <td>{carInfo.engineOn ? "Đang chạy" : "Dừng"}</td>
        </tr>
        <tr>
          <td>An ninh</td>
          <td></td>
          <td>Cảnh báo</td>
          <td></td>
        </tr>
        <tr>
          <td>Phiên bản</td>
          <td></td>
          <td>Khoang két</td>
          <td>{carInfo.strongBoxOpen ? "Mở" : "Đóng"}</td>
        </tr>
      </tbody>
    </table>
  )
}

export default CarBoxInfo
