import {
    Card,
    Button,
    Space,
    Table,
    Modal,
    Form,
    Input,
    DatePicker,
    Select,
} from "antd";
import {
    ExclamationCircleOutlined,
    EditOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import omitNil from "../../utils/omit";
import { RECORD_MODE } from "../../const/mode";
import {
    NotificationType,
    openNotification,
} from "../../utils/notificationHandle";
import makeRequest from "../../utils/makeRequest";
import { requestUrl } from "../../resource/requestUrl";
import { addListKey } from "../../utils/addListKey";
import moment from "moment";

const { confirm } = Modal;
const { Option } = Select;
moment().format();

const FormInsurance = ({ carId }) => {
    const [insurances, setInsurances] = useState([]);
    const [cars, setCars] = useState([]);
    const [mode, setMode] = useState(RECORD_MODE.CREATE);
    const [visible, setVisible] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 3,
        total: 0,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
    });
    useEffect(() => {
        const getData = async () => {
            let [insuranceRs, carRs] = await Promise.all([
                makeRequest({
                    method: "GET",
                    url: requestUrl.insurance.readUrl(),
                }),
                makeRequest({
                    method: "GET",
                    url: requestUrl.car.readUrl(),
                    params: {
                        paging: false,
                    },
                }),
            ]);
            setInsurances(addListKey(insuranceRs.data));
            setCars(addListKey(carRs.data));
            setPagination({ ...pagination, total: insuranceRs.totalRecords });
        };
        getData();
    }, []);
    useEffect(() => {
        handleSearch({ carId: carId }, pagination);
    }, [carId]);
    const [form] = Form.useForm();
    const openCreateForm = () => {
        setVisible(true);
        setMode(RECORD_MODE.CREATE);
        form.resetFields();
        form.setFieldsValue({});
    };
    const onClose = () => {
        setVisible(false);
    };

    const onOpen = (record) => {
        setVisible(true);
        setMode(RECORD_MODE.UPDATE);
        let formatedRecord = {
            ...record,
            timeToBuy: record.timeToBuy ? moment(record.timeToBuy) : null,
            duration: record.duration ? moment(record.duration) : null,
        };
        form.resetFields();
        form.setFieldsValue(formatedRecord);
    };
    const handleSearch = async (params, pagination = {}) => {
        let filter = omitNil(params);
        makeRequest({
            method: "GET",
            url: requestUrl.insurance.readUrl(),
            params: {
                ...filter,
                page: pagination.current,
                record: pagination.pageSize,
            },
        }).then((searchRs) => {
            setInsurances(addListKey(searchRs.data));
            setPagination({
                ...pagination,
                total: searchRs.totalRecords,
            });
        });
    };
    const handlePaginationChange = (page, pageSize) => {
        let newPagination = { ...pagination, current: page, pageSize };
        handleSearch("", newPagination);
    };
    const showDeleteConfirm = (key) => {
        confirm({
            title: "Bạn có muốn xóa lịch sử đã chọn?",
            icon: <ExclamationCircleOutlined />,
            okText: "Có",
            okType: "danger",
            cancelText: "Không",
            onOk() {
                handleDelete(key);
            },
        });
    };
    const handleDelete = async (key) => {
        openNotification(NotificationType.SUCCESS, "Xóa thành công!");
    };
    const onFinish = (insurance) => {
        let timeToBuy = insurance.timeToBuy
            ? insurance.timeToBuy.format("YYYY-MM-DD")
            : null;
        let duration = insurance.duration
            ? insurance.duration.format("YYYY-MM-DD")
            : null;
        let data = { ...insurance, timeToBuy, duration };
        let method = mode === RECORD_MODE.CREATE ? "POST" : "PUT";
        let msg =
            mode === RECORD_MODE.CREATE
                ? "Thêm thẻ mới thành công"
                : "Cập nhật thành công";
        let url =
            mode === RECORD_MODE.CREATE
                ? requestUrl.insurance.createUrl()
                : requestUrl.insurance.updateUrl({ id: insurance.id });
        makeRequest({
            method,
            url,
            data,
        }).then((rs) => {
            openNotification(NotificationType.SUCCESS, msg);
            handleSearch("", pagination);
            setVisible(false);
        });
    };
    const columns = [
        {
            title: "Biển xe",
            render: (text, record) => {
                return <>{record.car ? record.car.licensePlate : ""}</>;
            },
        },
        {
            title: "Thời điểm mua bảo hiểm",
            dataIndex: "timeToBuy",
            render: (text, record) => {
                return (
                    <>
                        {record.timeToBuy
                            ? new Date(text).toLocaleDateString("vi-vn", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "numeric",
                                  day: "numeric",
                              })
                            : ""}
                    </>
                );
            },
        },
        {
            title: "Hạn bảo hiểm",
            dataIndex: "duration",
            render: (text, record) => {
                return (
                    <>
                        {record.duration
                            ? new Date(text).toLocaleDateString("vi-vn", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "numeric",
                                  day: "numeric",
                              })
                            : ""}
                    </>
                );
            },
        },
        {
            title: "Nội dung bảo dưỡng",
            dataIndex: "content",
            width: 450,
        },
        {
            title: "Action",
            key: "action",
            width: 200,
            render: (_, record) => (
                <Space
                    size="middle"
                    align="center"
                    style={{ width: "100%", justifyContent: "center" }}
                >
                    <Button
                        type="primary"
                        shape="round"
                        icon={<EditOutlined />}
                        onClick={() => onOpen(record)}
                    >
                        Sửa
                    </Button>
                    <Button
                        type="primary"
                        shape="round"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => showDeleteConfirm(record.key)}
                    >
                        Xóa
                    </Button>
                </Space>
            ),
        },
    ];
    return (
        <>
            <Card
                type="middle"
                title="Danh sách bảo hiểm"
                bordered={true}
                style={{ marginTop: 20 }}
                extra={
                    <Button
                        type="primary"
                        onClick={openCreateForm}
                        size="large"
                    >
                        Thêm thông tin bảo hiểm
                    </Button>
                }
                bodyStyle={{ padding: 10 }}
            >
                <Table
                    dataSource={insurances}
                    columns={columns}
                    pagination={{
                        position: ["bottomRight"],
                        ...pagination,
                        onChange: handlePaginationChange,
                    }}
                    size="small"
                />
            </Card>
            <Modal
                title={
                    mode === RECORD_MODE.CREATE
                        ? "Thêm thông tin bảo hiểm"
                        : "Cập nhập"
                }
                visible={visible}
                onCancel={onClose}
                onOk={form.submit}
            >
                <Form
                    name="carForm"
                    layout="vertical"
                    form={form}
                    onFinish={onFinish}
                >
                    <Form.Item label="id" name="id" noStyle>
                        <Input type="hidden" />
                    </Form.Item>
                    <Form.Item
                        label="Biển số xe"
                        name="carId"
                        rules={[
                            {
                                required: true,
                                message: "Trường này không được thiếu",
                            },
                        ]}
                    >
                        <Select>
                            {cars.map((item, index) => (
                                <Option value={item.id} key={index}>
                                    {item.licensePlate}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item label="Thời điểm mua bảo hiểm" name="timeToBuy">
                        <DatePicker size="large" format="DD/MM/YYYY" />
                    </Form.Item>
                    <Form.Item label="Hạn bảo hiểm" name="duration">
                        <DatePicker size="large" format="DD/MM/YYYY" />
                    </Form.Item>
                    <Form.Item label="Nội dung" name="content">
                        <Input.TextArea rows={4} />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};
export default FormInsurance;
