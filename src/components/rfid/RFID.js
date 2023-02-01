import {
    Table,
    Input,
    Button,
    Space,
    Select,
    DatePicker,
    Drawer,
    Form,
    Checkbox,
    notification,
    Card,
    Modal,
} from "antd";
import {
    CheckOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
    EditOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import moment from "moment";

import makeRequest from "../../utils/makeRequest";
import { RFID_TYPE_ARR, RFID_TYPE } from "../../config/rfidType";
import { RECORD_MODE } from "../../const/mode";
import { addListKey } from "../../utils/addListKey";
import { requestUrl } from "../../resource/requestUrl";
import omitNil from "../../utils/omit";
import SearchDate from "../seachItem/SearchDate";
import SearchText from "../seachItem/SearchText";
import CustomSkeleton from "../skeleton/CustomSkeleton";
import {
    NotificationType,
    openNotification,
} from "../../utils/notificationHandle";

const { Option } = Select;
const { confirm } = Modal;
moment().format();

const distributed = [
    {
        value: true,
        label: "Đã được gán",
    },
    {
        value: false,
        label: "Chưa được gán",
    },
];

const RFID = () => {
    const [rfids, setRfids] = useState([]);
    const [userUnits, setUserUnits] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
    });
    const [filter, setFilter] = useState({
        cardNumber: "",
        description: "",
        isDistributed: null,
        type: null,
        activationTime: "",
        unitId: null,
    });
    const [lastFilter, setLastFilter] = useState({
        cardNumber: "",
        description: "",
        isDistributed: null,
        type: null,
        activationTime: "",
        unitId: null,
    });
    const [selectedRowArr, setSelectedRowArr] = useState([]);
    const [visible, setVisible] = useState(false);
    const [mode, setMode] = useState(RECORD_MODE.CREATE);
    const [loading, setLoading] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState({});

    const handleSearch = async (params, pagination = {}) => {
        let filter = omitNil(params);
        setLoading(true);
        makeRequest({
            method: "GET",
            url: requestUrl.rfid.readUrl(),
            params: {
                ...filter,
                page: pagination.current,
                record: pagination.pageSize,
            },
        }).then((searchRs) => {
            setRfids(addListKey(searchRs.data));
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
            title: "Bạn có muốn xóa thẻ đã chọn?",
            icon: <ExclamationCircleOutlined />,
            okText: "Có",
            okType: "danger",
            cancelText: "Không",
            onOk() {
                handleDelete(key);
            },
        });
    };

    // Handle delete
    const handleDelete = async (key) => {
        await new Promise((resolve) => {
            setTimeout(() => resolve(null), 3000);
        });
        openNotification(
            NotificationType.SUCCESS,
            `Xóa thành công thiết bị: ${rfids[key].cardNumber}`
        );
    };

    const columns = [
        {
            title: "Số thẻ",
            dataIndex: "cardNumber",
        },
        {
            title: "Mô tả",
            dataIndex: "description",
            width: 350,
        },
        {
            title: "Loại thẻ",
            dataIndex: "type",
            render: (text, record) => {
                return <>{RFID_TYPE[text]}</>;
            },
            width: 150,
        },
        {
            title: "Ngày kích hoạt",
            dataIndex: "activationTime",
            render: (text, record) => {
                return (
                    <>
                        {record.activationTime
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
            width: 200,
        },
        {
            title: "Trạng thái",
            dataIndex: "isDistributed",
            render: (text, record) => {
                return (
                    <>
                        {record.isDistributed ? "Đã được gán" : "Chưa được gán"}
                    </>
                );
            },
            width: 150,
        },
        {
            title: "Đơn vị",
            render: (text, record) => {
                return <>{record.unit.name}</>;
            },
        },
        {
            title: "Xoá",
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
            width: 50,
        },
    ];

    // Function handle selectedRow
    const hanldeSelected = (record) => {
        setVisible(true);
        setSelectedRecord({
            ...record,
            activationTime: record.activationTime
                ? moment(record.activationTime)
                : null,
        });
        form.resetFields();
        form.setFieldsValue({
            ...record,
            activationTime: record.activationTime
                ? moment(record.activationTime)
                : null,
        });
        setMode(RECORD_MODE.UPDATE);
    };

    // Function handle drawer
    const onClose = () => {
        setSelectedRowArr([]);
        setSelectedRecord({});
        setVisible(false);
    };

    useEffect(() => {
        const getData = async () => {
            let [rfidRs, userUnitRs] = await Promise.all([
                makeRequest({
                    method: "GET",
                    url: requestUrl.rfid.readUrl(),
                }),
                makeRequest({
                    method: "GET",
                    url: requestUrl.userUnit.readUrl(),
                }),
            ]);

            setRfids(addListKey(rfidRs.data));
            setUserUnits(addListKey(userUnitRs.data));
            setPagination({ ...pagination, total: rfidRs.totalRecords });
            setLoading(false);
        };

        getData();
    }, []);

    const [form] = Form.useForm();

    const onFinish = (rfid) => {
        setLoading(true);
        let activationTime = rfid.activationTime
            ? rfid.activationTime.format("YYYY-MM-DD")
            : null;
        let data = { ...rfid, activationTime };
        let method = mode === RECORD_MODE.CREATE ? "POST" : "PUT";
        let msg =
            mode === RECORD_MODE.CREATE
                ? "Thêm thẻ mới thành công"
                : "Cập nhật thành công";
        let url =
            mode === RECORD_MODE.CREATE
                ? requestUrl.rfid.createUrl()
                : requestUrl.rfid.updateUrl({ id: rfid.id });

        makeRequest({
            method,
            url,
            data,
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
                title="Danh sách thẻ RFID"
                extra={
                    <Button
                        type="primary"
                        onClick={openCreateForm}
                        size="large"
                    >
                        Thêm thẻ
                    </Button>
                }
                style={{ height: "100%" }}
            >
                <Space style={{ marginBottom: 10 }}>
                    <SearchText
                        dataIndex="cardNumber"
                        filter={filter}
                        pagination={pagination}
                        handleSearch={handleSearch}
                        placeholder={"Số thẻ"}
                        setFilter={setFilter}
                        setLastFilter={setLastFilter}
                        lastFilter={lastFilter}
                    ></SearchText>
                    <SearchDate
                        dataIndex="activationTime"
                        filter={filter}
                        pagination={pagination}
                        handleSearch={handleSearch}
                        placeholder={"Ngày kích hoạt"}
                        setFilter={setFilter}
                        setLastFilter={setLastFilter}
                    ></SearchDate>
                </Space>
                <Table
                    dataSource={rfids}
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
                        ? "Thêm thẻ mới"
                        : "Cập nhật thẻ"
                }
                placement="right"
                onClose={onClose}
                visible={visible}
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
                    onFinish={onFinish}
                    labelAlign="left"
                >
                    <Form.Item label="id" name="id" noStyle>
                        <Input type="hidden" />
                    </Form.Item>
                    <Form.Item
                        label="isDistributed"
                        name="isDistributed"
                        noStyle
                    >
                        <Input type="hidden" />
                    </Form.Item>
                    <Form.Item
                        label="Số thẻ"
                        name="cardNumber"
                        rules={[
                            {
                                required: true,
                                message: "Trường này không được thiếu",
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item label="Mô tả" name="description">
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="type"
                        label="Loại thẻ"
                        rules={[
                            {
                                required: true,
                                message: "Bạn phải chọn loại thẻ",
                            },
                        ]}
                    >
                        <Select>
                            {RFID_TYPE_ARR.map((item, index) => (
                                <Option value={item.value} key={index}>
                                    {item.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="activationTime" label="Ngày kích hoạt">
                        <DatePicker format="DD/MM/YYYY" />
                    </Form.Item>

                    <Form.Item
                        name="unitId"
                        label="Đơn vị"
                        rules={[
                            { required: true, message: "Bạn phải chọn đơn vị" },
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
                        name="status"
                        label="Thẻ hoạt động"
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

export default RFID;
