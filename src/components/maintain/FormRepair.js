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
import { RECORD_MODE } from "../../const/mode";
import {
    NotificationType,
    openNotification,
} from "../../utils/notificationHandle";
import makeRequest from "../../utils/makeRequest";
import { requestUrl } from "../../resource/requestUrl";
import { addListKey } from "../../utils/addListKey";
import omitNil from "../../utils/omit";
import moment from "moment";

const { confirm } = Modal;
const { Option } = Select;
moment().format();
const FormRepair = ({ carId }) => {
    const [repairs, setRepairs] = useState([]);
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
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
            let [repairRs, carRs] = await Promise.all([
                makeRequest({
                    method: "GET",
                    url: requestUrl.repair.readUrl(),
                }),
                makeRequest({
                    method: "GET",
                    url: requestUrl.car.readUrl(),
                    params: {
                        paging: false,
                    },
                }),
            ]);
            setRepairs(addListKey(repairRs.data));
            setCars(addListKey(carRs.data));
            setPagination({ ...pagination, total: repairRs.totalRecords });
            setLoading(false);
        };
        getData();
    }, []);
    useEffect(() => {
        handleSearch({ carId }, pagination);
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
            date: record.date ? moment(record.date) : null,
        };
        form.resetFields();
        form.setFieldsValue(formatedRecord);
    };
    const handleSearch = async (params, pagination = {}) => {
        let filter = omitNil(params);
        makeRequest({
            method: "GET",
            url: requestUrl.repair.readUrl(),
            params: {
                ...filter,
                page: pagination.current,
                record: pagination.pageSize,
            },
        }).then((searchRs) => {
            setRepairs(addListKey(searchRs.data));
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
            title: "Bạn có muốn xóa lịch sử thay dầu đã chọn?",
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
    const onFinish = (repair) => {
        let date = repair.date ? repair.date.format("YYYY-MM-DD") : null;
        let data = { ...repair, date };
        let method = mode === RECORD_MODE.CREATE ? "POST" : "PUT";
        let msg =
            mode === RECORD_MODE.CREATE
                ? "Thêm mới thành công"
                : "Cập nhật thành công";
        let url =
            mode === RECORD_MODE.CREATE
                ? requestUrl.repair.createUrl()
                : requestUrl.repair.updateUrl({ id: repair.id });
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
            title: "Ngày sửa chữa",
            dataIndex: "date",
            render: (text, record) => {
                return (
                    <>
                        {record.date
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
            title: "Nội dung sửa chữa",
            dataIndex: "content",
            width: 450,
        },
        {
            title: "Giá tiền",
            dataIndex: "price",
            width: 200,
            render: (_, record) => {
                return <>{record.price ? `${record.price} VND` : ""}</>;
            },
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
                title="Lịch sử sửa chữa"
                bordered={true}
                style={{ marginTop: 20 }}
                extra={
                    <Button
                        type="primary"
                        onClick={openCreateForm}
                        size="large"
                    >
                        Thêm lịch sử sửa chữa
                    </Button>
                }
                bodyStyle={{ padding: 10 }}
            >
                <Table
                    dataSource={repairs}
                    pagination={{
                        position: ["bottomRight"],
                        ...pagination,
                        onChange: handlePaginationChange,
                    }}
                    columns={columns}
                    bordered
                    size="small"
                />
            </Card>
            <Modal
                title={
                    mode === RECORD_MODE.CREATE
                        ? "Thêm lịch sử sửa chữa"
                        : "Cập nhập lịch sử"
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
                        label="Biển xe"
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
                    <Form.Item
                        label="Ngày sửa chữa"
                        name="date"
                        rules={[
                            {
                                required: true,
                                message: "Trường này không được thiếu",
                            },
                        ]}
                    >
                        <DatePicker size="large" format="DD/MM/YYYY" />
                    </Form.Item>
                    <Form.Item label="Nội dung sửa chữa" name="content">
                        <Input.TextArea rows={4} />
                    </Form.Item>
                    <Form.Item label="Giá tiền" name="price">
                        <Input type="text" />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default FormRepair;
