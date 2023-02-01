import { useState, useEffect } from "react"
import {
  Space,
  Row,
  Col,
  Button,
  Table,
  Card,
  Form,
  Input,
  notification,
  Modal,
} from "antd"
import { CheckOutlined, WarningOutlined } from "@ant-design/icons"

import makeRequest from "../../utils/makeRequest"
import { requestUrl } from "../../resource/requestUrl"

const Unit = () => {
  const [units, setUnits] = useState([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editedUnit, setEditedUnit] = useState({})

  const [form] = Form.useForm()
  const [editedForm] = Form.useForm()

  useEffect(() => {
    getUnits()
  }, [])

  const columns = [
    {
      title: "Tên đơn vị",
      dataIndex: "name",
      align: "center",
    },
    {
      title: "Hành động",
      render: (text, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => onEditBtnClick(record)}
          >
            Sửa
          </Button>
        </Space>
      ),
      width: 120,
      align: "center",
    },
  ]

  const onFinish = (data) => {
    makeRequest({
      method: "POST",
      url: requestUrl.unit.createUrl(),
      data,
    }).then((rs) => {
      getUnits()
      notification.open({
        message: "Thông báo",
        icon: rs.succeeded ? (
          <CheckOutlined style={{ color: "#2fd351" }} />
        ) : (
          <WarningOutlined style={{ color: "#ffb800" }} />
        ),
        description: rs.message,
      })
    })
  }

  const getUnits = async () => {
    const unitList = await makeRequest({
      method: "GET",
      url: requestUrl.unit.readUrl(),
    })
    setUnits(unitList.data)
  }

  const onEditBtnClick = (record) => {
    setEditedUnit(record)
    editedForm.setFieldsValue(record)
    setIsModalVisible(true)
  }

  const onEditUnit = (data) => {
    makeRequest({
      method: "PUT",
      url: requestUrl.unit.updateUrl({ id: editedUnit.id }),
      data,
    }).then((rs) => {
      getUnits()
      notification.open({
        message: "Thông báo",
        icon: rs.succeeded ? (
          <CheckOutlined style={{ color: "#2fd351" }} />
        ) : (
          <WarningOutlined style={{ color: "#ffb800" }} />
        ),
        description: rs.message,
      })
      setIsModalVisible(false)
    })
  }

  return (
    <Card title="Danh sách đơn vị" style={{ width: "100%", height: "100%" }}>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Form
            name="create-unit-form"
            onFinish={onFinish}
            labelAlign="left"
            form={form}
          >
            <Form.Item
              label="Tên đơn vị"
              name="name"
              rules={[
                {
                  required: true,
                  message: "Tên đơn vị không được thiếu!",
                },
              ]}
            >
              <Input placeholder="Điền tên đơn vị cần thêm" />
            </Form.Item>
          </Form>
        </Col>
        <Col span={16}>
          <Button type="primary" onClick={() => form.submit()}>
            Thêm đơn vị
          </Button>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <Table
            dataSource={units}
            pagination={{
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total}`,
            }}
            columns={columns}
          />
        </Col>
      </Row>
      <Modal
        title="Sửa thông tin đơn vị"
        visible={isModalVisible}
        okText="Lưu"
        cancelText="Thoát"
        onOk={() => {
          editedForm.submit()
        }}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form
          name="edit-unit-form"
          onFinish={onEditUnit}
          initialValues={editedUnit}
          labelAlign="left"
          form={editedForm}
        >
          <Form.Item
            label="Tên đơn vị"
            name="name"
            rules={[
              {
                required: true,
                message: "Tên đơn vị không được thiếu!",
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default Unit
