import {
    Table,
    Input,
    Button,
    Space,
    Select,
    Drawer,
    Form,
    notification,
    Checkbox,
    DatePicker,
    Card,
    Modal,
} from "antd";
import {
    CheckOutlined,
    ExclamationCircleOutlined,
    DeleteOutlined,
    EditOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import moment from "moment";

import makeRequest from "../../utils/makeRequest";
import { RECORD_MODE } from "../../const/mode";
import { addListKey } from "../../utils/addListKey";
import omitNil from "../../utils/omit";
import { deviceConfig } from "../../config/device";
import SearchText from "../seachItem/SearchText";
import { requestUrl } from "../../resource/requestUrl";
import CustomSkeleton from "../skeleton/CustomSkeleton";
import {
    NotificationType,
    openNotification,
} from "../../utils/notificationHandle";

const { Option } = Select;
const { confirm } = Modal;

const DeviceManager = () => {
    const [devices, setDevices] = useState([]);
    const [userUnits, setUserUnits] = useState([]);
    const [cars, setCars] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
    });
    const [filter, setFilter] = useState({
        deviceNumber: "",
        phone: "",
        unitId: null,
        imei: "",
        mobileCarrier: null,
    });
    const [lastFilter, setLastFilter] = useState({
        deviceNumber: "",
        phone: "",
        unitId: null,
        imei: "",
        mobileCarrier: null,
    });
    const [selectedRowArr, setSelectedRowArr] = useState([]);
    const [visible, setVisible] = useState(false);
    const [mode, setMode] = useState(RECORD_MODE.CREATE);
    const [selectedRecord, setSelectedRecord] = useState({});
    const [loading, setLoading] = useState(true);

    const handleSearch = async (params, pagination = {}) => {
        setLoading(true);
        let filter = omitNil(params);
        makeRequest({
            method: "GET",
            url: requestUrl.device.readUrl(),
            params: {
                ...filter,
                page: pagination.current,
                record: pagination.pageSize,
            },
        }).then((searchRs) => {
            setDevices(addListKey(searchRs.data));
            setPagination({
                ...pagination,
                total: searchRs.totalRecords,
            });
            setLoading(false);
        });
    };

    const handlePaginationChange = (page, pageSize) => {
        let newPagination = { ...pagination, current: page, pageSize };
        handleSearch(filter, newPagination);
    };

    // Show modal
    const showDeleteConfirm = (key) => {
        confirm({
            title: "Bạn có muốn xóa thiết bị đã chọn?",
            icon: <ExclamationCircleOutlined />,
            okText: "Có",
            okType: "danger",
            cancelText: "Không",
            onOk() {
                handleDelete(key);
            },
        });
    };

    // Handle delete device
    const handleDelete = async (key) => {
        await new Promise((resolve) => {
            setTimeout(() => resolve(null), 3000);
        });
        openNotification(
            NotificationType.SUCCESS,
            `Xóa thành công thiết bị: ${devices[key].deviceNumber}`
        );
    };

    const columns = [
        {
            title: "Mã thiết bị",
            dataIndex: "deviceNumber",
            width: 200,
            ellipsis: true,
        },
        {
            title: "Số điện thoạt",
            dataIndex: "phone",
            width: 150,
        },
        {
            title: "Nhà mạng",
            render: (text, record) => {
                return (
                    <>
                        {record.mobileCarrier
                            ? deviceConfig.mobileCarrierObj[
                                  record.mobileCarrier
                              ]
                            : ""}
                    </>
                );
            },
            width: 200,
        },
        {
            title: "Xe",
            render: (text, record) => (
                <>{record.car ? record.car.licensePlate : ""}</>
            ),
            width: 200,
        },
        {
            title: "Đơn vị",
            render: (text, record) => {
                return <>{record.unit ? record.unit.name : ""}</>;
            },
        },
        {
            title: "IMEI Sim",
            dataIndex: "imei",
        },
        {
            title: "Kích hoạt",
            dataIndex: "status",
            render: (text, record) => (
                <Checkbox checked={record.status} disabled />
            ),

            align: "center",
        },
        {
            title: "Cập nhật",
            dataIndex: "allowUpdate",
            render: (text, record) => (
                <Checkbox checked={record.allowUpdate} disabled />
            ),

            align: "center",
        },
        {
            title: "Action",
            render: (text, record) => (
                <Space>
                    <Button
                        type="primary"
                        shape="circle"
                        icon={<EditOutlined />}
                        onClick={() => hanldeSelected(record)}
                    />
                    <Button
                        type="primary"
                        danger
                        shape="circle"
                        icon={<DeleteOutlined />}
                        onClick={() => showDeleteConfirm(record.key)}
                    />
                </Space>
            ),
            align: "center",
            width: 100,
        },
    ];

    // Function handle selectedRow
    const hanldeSelected = (record) => {
        setVisible(true);
        let formatedRecord = {
            ...record,
            activationTime: record.activationTime
                ? moment(record.activationTime)
                : null,
        };
        setSelectedRecord(formatedRecord);
        form.resetFields();
        form.setFieldsValue(formatedRecord);
        setMode(RECORD_MODE.UPDATE);
    };

    const onSelectedChange = (selectedRowKeys, selectedRows) => {
        setSelectedRowArr(selectedRowKeys);
    };

    // Function handle drawer
    const onClose = () => {
        setSelectedRowArr([]);
        setSelectedRecord({});
        setVisible(false);
    };

    useEffect(() => {
        const getData = async () => {
            let [deviceRs, userUnitRs, carRs] = await Promise.all([
                makeRequest({
                    method: "GET",
                    url: requestUrl.device.readUrl(),
                }),
                makeRequest({
                    method: "GET",
                    url: requestUrl.userUnit.readUrl(),
                }),
                makeRequest({
                    method: "GET",
                    url: requestUrl.car.readUrl(),
                    params: {
                        paging: false,
                    },
                }),
            ]);

            setDevices(addListKey(deviceRs.data));
            setCars(addListKey(carRs.data));
            setUserUnits(addListKey(userUnitRs.data));
            setPagination({ ...pagination, total: deviceRs.totalRecords });
            setLoading(false);
        };

        getData();
    }, []);

    const [form] = Form.useForm();

    const onFinish = (device) => {
        setLoading(true);
        let deviceData = {
            ...device,
            activationTime: moment(device.activationTime).format("YYYY/MM/DD"),
        };
        let method = mode === RECORD_MODE.CREATE ? "POST" : "PUT";
        let url =
            mode === RECORD_MODE.CREATE
                ? requestUrl.device.createUrl()
                : requestUrl.device.updateUrl({ id: device.id });
        let msg =
            mode === RECORD_MODE.CREATE
                ? "Thêm mới thiết bị thành công"
                : "Cập nhật thành công";
        makeRequest({
            method,
            url,
            data: deviceData,
        }).then((rs) => {
            notification.open({
                message: "Thông báo",
                icon: <CheckOutlined style={{ color: "#2fd351" }} />,
                description: msg,
            });
            handleSearch(filter, pagination);
            setSelectedRowArr([]);
            setSelectedRecord({});
            setVisible(false);
            setLoading(false);
        });
    };

    const openCreateForm = () => {
        setVisible(true);
        setMode(RECORD_MODE.CREATE);
        setSelectedRecord({});
        form.resetFields();
        form.setFieldsValue({});
    };

    return (
        <>
            <Card
                title="Danh sách thiết bị"
                extra={
                    <Button
                        type="primary"
                        onClick={openCreateForm}
                        size="large"
                    >
                        Thêm thiết bị mới
                    </Button>
                }
                style={{ height: "100%" }}
            >
                <Space style={{ marginBottom: 10 }}>
                    <SearchText
                        dataIndex="deviceNumber"
                        filter={filter}
                        pagination={pagination}
                        handleSearch={handleSearch}
                        placeholder={"Mã thiết bị"}
                        setFilter={setFilter}
                        setLastFilter={setLastFilter}
                        lastFilter={lastFilter}
                    ></SearchText>
                    <SearchText
                        dataIndex="phone"
                        filter={filter}
                        pagination={pagination}
                        handleSearch={handleSearch}
                        placeholder={"Số điện thoại"}
                        setFilter={setFilter}
                        setLastFilter={setLastFilter}
                        lastFilter={lastFilter}
                    ></SearchText>
                    <SearchText
                        dataIndex="IMEI"
                        filter={filter}
                        pagination={pagination}
                        handleSearch={handleSearch}
                        placeholder={"IMEI"}
                        setFilter={setFilter}
                        setLastFilter={setLastFilter}
                        lastFilter={lastFilter}
                    ></SearchText>
                </Space>
                <Table
                    dataSource={devices}
                    columns={columns}
                    pagination={{
                        position: ["bottomRight"],
                        ...pagination,
                        onChange: handlePaginationChange,
                    }}
                    size="large"
                />
            </Card>

            <Drawer
                title={
                    mode === RECORD_MODE.CREATE
                        ? "Thêm thiết bị mới"
                        : "Cập nhật"
                }
                placement="right"
                onClose={onClose}
                visible={visible}
                width="450"
            >
                <Form
                    name="rfidForm"
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 16 }}
                    initialValues={{
                        ...selectedRecord,
                        activationTime: selectedRecord.activationTime
                            ? moment(selectedRecord.activationTime)
                            : "",
                    }}
                    form={form}
                    labelAlign="left"
                    onFinish={onFinish}
                >
                    <Form.Item label="id" name="id" noStyle>
                        <Input type="hidden" />
                    </Form.Item>
                    <Form.Item
                        label="IMEI thiết bị"
                        name="imei"
                        rules={[
                            {
                                required: true,
                                message: "Trường này không được thiếu",
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Mã thiết bị"
                        name="deviceNumber"
                        rules={[
                            {
                                required: true,
                                message: "Trường này không được thiếu",
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Số điện thoại"
                        name="phone"
                        rules={[
                            {
                                required: true,
                                message: "Trường này không được thiếu",
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="unitId"
                        label="Đơn vị quản lý"
                        rules={[
                            {
                                required: true,
                                message: "Trường này không được thiếu",
                            },
                        ]}
                    >
                        <Select>
                            {userUnits.map((item, index) => (
                                <Option value={item.id} key={index}>
                                    {item.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="mobileCarrier"
                        label="Nhà mạng"
                        rules={[
                            {
                                required: true,
                                message: "Trường này không được thiếu",
                            },
                        ]}
                    >
                        <Select>
                            {deviceConfig.mobileCarrier.map((item, index) => (
                                <Option value={item.value} key={index}>
                                    {item.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="carId"
                        label="Xe mang biển số"
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

                    <Form.Item name="activationTime" label="Ngày kích hoạt">
                        <DatePicker format="DD/MM/YYYY" />
                    </Form.Item>

                    <Form.Item
                        name="status"
                        label="Thẻ đang kích hoạt"
                        valuePropName="checked"
                    >
                        <Checkbox />
                    </Form.Item>

                    <Form.Item
                        name="allowUpdate"
                        label="Cho phép cập nhật"
                        valuePropName="checked"
                    >
                        <Checkbox />
                    </Form.Item>

                    <Form.Item
                        wrapperCol={{
                            offset: 0,
                            span: 24,
                        }}
                    >
                        <Button type="primary" htmlType="submit">
                            Lưu
                        </Button>
                    </Form.Item>
                </Form>
            </Drawer>
            <CustomSkeleton loading={loading} />
        </>
    );
};

export default DeviceManager;
