import {
    Table,
    Input,
    Button,
    Select,
    Drawer,
    Form,
    notification,
    Tooltip,
    Space,
    Card,
    Modal,
} from "antd";
import {
    CheckOutlined,
    RedoOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
    EditOutlined,
    InfoCircleOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";

import makeRequest from "../../utils/makeRequest";
import { RECORD_MODE } from "../../const/mode";
import { addListKey } from "../../utils/addListKey";
import omitNil from "../../utils/omit";
import { carConfig } from "../../config/car";
import rfidHandle from "../../handle/rfid";
import { requestUrl } from "../../resource/requestUrl";
import SearchSelect from "../seachItem/SearchSelect";
import SearchText from "../seachItem/SearchText";
import CustomSkeleton from "../skeleton/CustomSkeleton";
import {
    NotificationType,
    openNotification,
} from "../../utils/notificationHandle";
import { useNavigate } from "react-router-dom";

const { Option } = Select;
const { confirm } = Modal;

const CarManager = () => {
    const [cars, setCars] = useState([]);
    const [userUnits, setUserUnits] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [rfids, setRfids] = useState([]);
    const [displayRfids, setDisplayRfids] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
    });
    const [filter, setFilter] = useState({
        licensePlate: "",
        type: "",
        unitId: null,
        driverId: null,
    });
    const [lastFilter, setLastFilter] = useState({
        licensePlate: "",
        type: "",
        unitId: null,
        driverId: null,
    });
    const [selectedRowArr, setSelectedRowArr] = useState([]);
    const [visible, setVisible] = useState(false);
    const [mode, setMode] = useState(RECORD_MODE.CREATE);
    const [loading, setLoading] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState({});

    const [form] = Form.useForm();
    const navigate = useNavigate();

    const handleSearch = async (params, pagination = {}) => {
        setLoading(true);
        let filter = omitNil(params);
        makeRequest({
            method: "GET",
            url: requestUrl.car.readUrl(),
            params: {
                ...filter,
                page: pagination.current,
                record: pagination.pageSize,
            },
        }).then((searchRs) => {
            setCars(addListKey(searchRs.data));
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
    const showDeleteConfirm = (key, record) => {
        confirm({
            title: "Bạn có muốn xóa xe đã chọn?",
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
            `Xóa thành công xe: ${cars[key].licensePlate}`
        );
    };
    const handleShowInfo = (record) => {
        navigate(`/maintain/${record.id}`, { replace: true });
    };
    const columns = [
        {
            title: "Biển xe",
            dataIndex: "licensePlate",
            width: 200,
        },
        {
            title: "Loại xe",
            dataIndex: "type",
            width: 350,
        },
        {
            title: "Đơn vị",
            render: (text, record) => {
                return <>{record.unit ? record.unit.name : ""}</>;
            },
        },
        {
            title: "Lái xe chính",
            render: (text, record) => {
                return <>{record.driver ? record.driver.name : ""}</>;
            },
            width: 200,
        },
        {
            title: "Thẻ RFID",
            dataIndex: "rfidId",
            render: (text, record) => {
                return <>{record.rfid ? record.rfid.cardNumber : ""}</>;
            },
            width: 350,
        },
        {
            title: "Action",
            render: (text, record) => (
                <Space>
                    <Button
                        type="primary"
                        shape="circle"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Button
                        type="primary"
                        danger
                        shape="circle"
                        icon={<DeleteOutlined />}
                        onClick={() => showDeleteConfirm(record.key, record)}
                    />
                    <Button
                        type="primary"
                        shape="circle"
                        icon={<InfoCircleOutlined />}
                        onClick={() => handleShowInfo(record)}
                    />
                </Space>
            ),
            align: "center",
            width: 50,
        },
    ];

    // Function handle selectedRow
    const handleEdit = (record) => {
        setVisible(true);
        setSelectedRecord(record);
        form.resetFields();
        form.setFieldsValue(record);
        setMode(RECORD_MODE.UPDATE);
        setDisplayRfids(
            rfidHandle.setListRfid(rfids, record.rfid, RECORD_MODE.UPDATE)
        );
    };

    // Function handle drawer
    const onClose = () => {
        setSelectedRowArr([]);
        setSelectedRecord({});
        setVisible(false);
    };

    const handleReloadRfid = () => {
        makeRequest({
            method: "GET",
            url: requestUrl.rfid.readUrl(),
            params: {
                type: 1,
                isDistributed: false,
                paging: false,
            },
        })
            .then((rs) => {
                let rfids = rs.data;
                setRfids(rfids);
                setDisplayRfids(
                    rfidHandle.setListRfid(rfids, selectedRecord.rfid, mode)
                );
            })
            .catch((err) => {
                console.log(err);
            });
    };

    useEffect(() => {
        const getData = async () => {
            let [carRs, userUnitRs, rfidRs, driverRs] = await Promise.all([
                makeRequest({
                    method: "GET",
                    url: requestUrl.car.readUrl(),
                }),
                makeRequest({
                    method: "GET",
                    url: requestUrl.userUnit.readUrl(),
                }),
                makeRequest({
                    method: "GET",
                    url: requestUrl.rfid.readUrl(),
                    params: {
                        type: 1,
                        isDistributed: false,
                        paging: false,
                    },
                }),
                makeRequest({
                    method: "GET",
                    url: requestUrl.driver.readUrl(),
                    params: {
                        paging: false,
                    },
                }),
            ]);
            setCars(addListKey(carRs.data));
            setDrivers(addListKey(driverRs.data));
            setRfids(addListKey(rfidRs.data));
            setDisplayRfids(
                rfidHandle.setListRfid(rfidRs.data, selectedRecord.rfid, mode)
            );
            setUserUnits(addListKey(userUnitRs.data));
            setPagination({ ...pagination, total: carRs.totalRecords });
            setLoading(false);
        };

        getData();
    }, []);
    const onFinish = (car) => {
        setLoading(true);
        let method = mode === RECORD_MODE.CREATE ? "POST" : "PUT";
        let url =
            mode === RECORD_MODE.CREATE
                ? requestUrl.car.createUrl()
                : requestUrl.car.updateUrl({ id: car.id });
        let msg =
            mode === RECORD_MODE.CREATE
                ? "Thêm xe mới thành công"
                : "Cập nhật thành công";
        makeRequest({
            method,
            url,
            data: car,
        }).then((rs) => {
            notification.open({
                message: "Thông báo",
                icon: <CheckOutlined style={{ color: "#2fd351" }} />,
                description: msg,
            });
            handleSearch(filter, pagination);
            handleReloadRfid(mode);
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
        setDisplayRfids(
            rfidHandle.setListRfid(
                rfids,
                selectedRecord.rfid,
                RECORD_MODE.CREATE
            )
        );
    };

    return (
        <>
            <Card
                type="middle"
                title="Danh sách xe"
                bordered={true}
                style={{ height: "100%" }}
                extra={
                    <Button
                        type="primary"
                        onClick={openCreateForm}
                        size="large"
                    >
                        Thêm xe mới
                    </Button>
                }
                bodyStyle={{ padding: 10 }}
            >
                <Space style={{ marginBottom: 10 }}>
                    <SearchSelect
                        dataIndex="unitId"
                        filter={filter}
                        pagination={pagination}
                        handleSearch={handleSearch}
                        placeholder={"Chọn đơn vị"}
                        setFilter={setFilter}
                        setLastFilter={setLastFilter}
                        data={userUnits.map((item) => ({
                            value: item.id,
                            label: item.name,
                        }))}
                    ></SearchSelect>
                    <SearchText
                        dataIndex="licensePlate"
                        filter={filter}
                        pagination={pagination}
                        handleSearch={handleSearch}
                        placeholder={"Nhập biển số xe"}
                        setFilter={setFilter}
                        setLastFilter={setLastFilter}
                        lastFilter={lastFilter}
                    ></SearchText>
                </Space>
                <Table
                    dataSource={cars}
                    columns={columns}
                    pagination={{
                        position: ["bottomRight"],
                        ...pagination,
                        onChange: handlePaginationChange,
                    }}
                    bordered
                    size="large"
                />
            </Card>
            <Modal
                title={mode === RECORD_MODE.CREATE ? "Thêm xe mới" : "Cập nhật"}
                centered
                onCancel={onClose}
                visible={visible}
                bodyStyle={{
                    maxHeight: "calc(100vh - 100px)",
                    overflowY: "scroll",
                }}
                destroyOnClose={false}
                footer={null}
            >
                <Form
                    name="carForm"
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 16 }}
                    initialValues={selectedRecord}
                    labelAlign="left"
                    form={form}
                    onFinish={onFinish}
                >
                    <Form.Item label="id" name="id" noStyle>
                        <Input type="hidden" />
                    </Form.Item>
                    <Form.Item
                        label="Biển số"
                        name="licensePlate"
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
                        label="Loại xe"
                        name="type"
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
                        name="rfidId"
                        label={
                            <>
                                Mã thiết bị [
                                <Tooltip title="Tải lại mã thiết bị">
                                    <RedoOutlined
                                        onClick={() => handleReloadRfid(mode)}
                                        style={{ color: "#1890ff" }}
                                    />
                                </Tooltip>
                                ]
                            </>
                        }
                    >
                        <Select>
                            {displayRfids.map((item, index) => (
                                <Option value={item.id} key={index}>
                                    {item.cardNumber}
                                </Option>
                            ))}
                        </Select>
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

                    <Form.Item name="driverId" label="Lái xe">
                        <Select>
                            {drivers.map((item, index) => (
                                <Option value={item.id} key={index}>
                                    {item.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="numberCamera"
                        label="Số lượng camera"
                        rules={[
                            {
                                required: true,
                                message: "Trường này không được thiếu",
                            },
                        ]}
                    >
                        <Select>
                            <Option value="1" key="1">
                                1
                            </Option>
                            <Option value="2" key="2">
                                2
                            </Option>
                        </Select>
                    </Form.Item>

                    <Form.Item name="firstCamPo" label="Camera 1">
                        <Select>
                            {carConfig.firstCamPosition.map((item, index) => (
                                <Option value={item.value} key={index}>
                                    {item.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="firstCamRotation" label="Góc quay cam 1">
                        <Select>
                            {carConfig.cameraRotation.map((item, index) => (
                                <Option value={item.value} key={index}>
                                    {item.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="secondCamRotation" label="Góc quay cam 2">
                        <Select>
                            {carConfig.cameraRotation.map((item, index) => (
                                <Option value={item.value} key={index}>
                                    {item.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="fuel" label="Nhiên liệu">
                        <Select>
                            {carConfig.fuel.map((item, index) => (
                                <Option value={item.value} key={index}>
                                    {item.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item label="Giới hạn tốc độ" name="limitedSpeed">
                        <Input />
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
            </Modal>
            <CustomSkeleton loading={loading} />
        </>
    );
};

export default CarManager;
