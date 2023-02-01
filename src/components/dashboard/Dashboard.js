import { useState, useEffect } from "react";
import {
    Layout,
    Menu,
    Space,
    Dropdown,
    Modal,
    Form,
    Input,
    Typography,
    notification,
} from "antd";
import { useSelector } from "react-redux";
import { useLocation, Link } from "react-router-dom";
import {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    HistoryOutlined,
    WarningOutlined,
    PieChartOutlined,
    FileOutlined,
    UserOutlined,
    CarOutlined,
    CheckOutlined,
    WalletOutlined,
    DashboardOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import {
    useNavigate,
    BrowserRouter as Router,
    Routes,
    Route,
} from "react-router-dom";
import Cookies from "js-cookie";

import { logout } from "../../stores/loginSlice";
import { setScope } from "../../stores/scopeSlice";
import tokenHandler from "../../handle/tokenHandler";
import "./Dashboard.css";
import Home from "../home/Home";
import Permission from "../permission/Permission";
import RFID from "../rfid/RFID";
import MemberManagement from "../memberMangement/MemberManagement";
import { memberConfig } from "../../config/member";
import { menu, revertMenu, menuParentKey } from "../../config/menu";
import CarManager from "../car/CarManager";
import DeviceManager from "../device/DeviceManager";
import TransactionPoint from "../transactionPoint/TransactionPoint";
import SampleRoute from "../sampleRoute/SampleRoute";
import Segmentation from "../segmentation/Segmentation";
import History from "../history/History";
import User from "../user/User";
import makeRequest from "../../utils/makeRequest";
import { requestUrl } from "../../resource/requestUrl";
import Report from "../report/Report";
// import { SCOPE } from "../../config/scope"
import Unit from "../unit/Unit";
import Maintain from "../maintain/Maintain";
import Mail from "../mail/Mail";
import Template from "../mail/Template";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const Dashboard = () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [collapsed, setCollapsed] = useState(true);
    const [openKeys, setOpenKeys] = useState(["1"]);
    const [visible, setVisible] = useState(false);
    const [selectedKeys, setSelectedKeys] = useState(null);
    const [allowedRoutes, setAllowedRoutes] = useState([]);

    const rootSubmenuKeys = ["sub1", "sub2"];
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const path = location.pathname;
    const [modalForm] = Form.useForm();

    const scopeId = useSelector((state) => state.scope.scopeId);

    useEffect(() => {
        const getAllowedRoutes = async () => {
            const res = await makeRequest({
                method: "GET",
                url: requestUrl.scopeAllowedRoute.readByIdUrl(scopeId),
            });
            setAllowedRoutes(res.data);
        };

        if (scopeId) getAllowedRoutes();
    }, [scopeId]);

    const onCollapse = () => {
        setCollapsed(!collapsed);
    };

    function getItem(label, key, icon, children, route, type) {
        return {
            key,
            icon,
            children: Array.isArray(children)
                ? children.filter(disableNotAllowRoutes)
                : null,
            label,
            type,
            route,
        };
    }

    const disableNotAllowRoutes = (item) => {
        console.log(item);
        if (item.route) return allowedRoutes.includes(item.route);
        if (Array.isArray(item.children) && item.children.length === 0)
            return false;
        console.log("pass");
        return true;
    };

    const items = [
        getItem(
            <Link to="/">Giám sát</Link>,
            "1",
            <PieChartOutlined />,
            null,
            "/"
        ),
        getItem(
            <Link to="/histories">Lịch sử</Link>,
            "2",
            <HistoryOutlined />,
            null,
            "/histories"
        ),
        getItem("Quản lý", "sub1", <WalletOutlined />, [
            getItem("Cán bộ", "sub1-1", null, [
                getItem(
                    <Link to="/drivers">Lái xe</Link>,
                    "3",
                    null,
                    null,
                    "/drivers"
                ),
                getItem(
                    <Link to="/treasurers">Chủ hàng</Link>,
                    "4",
                    null,
                    null,
                    "/treasurers"
                ),
                getItem(
                    <Link to="/atm-technicans">Kỹ thuật viên ATM</Link>,
                    "5",
                    null,
                    null,
                    "/atm-technicans"
                ),
                getItem(
                    <Link to="/escorts">Người áp tải</Link>,
                    "16",
                    null,
                    null,
                    "/escorts"
                ),
            ]),
            getItem("Phương tiện", "sub1-2", null, [
                getItem(<Link to="/cars">Xe</Link>, "6", null, null, "/cars"),
                getItem(
                    <Link to="/devices">Thiết bị</Link>,
                    "7",
                    null,
                    null,
                    "/devices"
                ),
            ]),
            getItem(
                <Link to="/rfids">Thẻ RFID</Link>,
                "10",
                null,
                null,
                "/rfids"
            ),
            getItem(
                <Link to="/transaction-points">Điểm giao dịch</Link>,
                "11",
                null,
                null,
                "/transaction-points"
            ),
        ]),
        getItem("Tuyến mẫu", "sub2", <CarOutlined />, [
            getItem(
                <Link to="/sample-routes">Tạo tuyến</Link>,
                "12",
                null,
                null,
                "/sample-routes"
            ),
            getItem(
                <Link to="/segmentations">Phân công tuyến</Link>,
                "13",
                null,
                null,
                "/segmentations"
            ),
        ]),
        getItem(
            <Link to="/reports">Báo cáo</Link>,
            "14",
            <FileOutlined />,
            null,
            "/reports"
        ),
        getItem("Người dùng", "sub1-3", <UserOutlined />, [
            getItem(
                <Link to="/users">Tài khoản</Link>,
                "8",
                null,
                null,
                "/users"
            ),
            getItem(
                <Link to="/permissions">Phân quyền</Link>,
                "9",
                null,
                null,
                "/permissions"
            ),
            getItem(
                <Link to="/units">Đơn vị</Link>,
                "15",
                null,
                null,
                "/units"
            ),
        ]),
        getItem(
            <Link to="/maintain">Bảo dưỡng/Bảo trì</Link>,
            "19",
            <DashboardOutlined />,
            null,
            "/maintain"
        ),
    ].filter(disableNotAllowRoutes);

    const userMenu = [
        getItem(
            <Text
                onClick={() => {
                    setVisible(true);
                    modalForm.resetFields();
                    modalForm.setFieldsValue({});
                }}
            >
                Đổi mật khẩu
            </Text>,
            "1",
            null
        ),
        getItem(<div onClick={() => log_out()}>Đăng xuất</div>, "2", null),
    ];

    const log_out = () => {
        Cookies.remove("x-access-token");
        dispatch(logout());
        dispatch(setScope({ scopeId: "" }));
    };

    const onOpenChange = (keys) => {
        const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);

        if (rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
            setOpenKeys(keys);
        } else {
            setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
        }
    };

    const onSelect = ({ key, selectedKeys }) => {
        if (!isNaN(key)) {
            if (menu[key]) {
                navigate(menu[key]);
                setSelectedKeys(selectedKeys);
                if (["1", "2", "12"].includes(key)) setCollapsed(true);
            }
        }
    };

    const onSavePassword = (record) => {
        const accessToken = Cookies.get("x-access-token");
        const decodeToken = tokenHandler.decodeToken(accessToken);
        const data = {
            userId: decodeToken.uid,
            oldPassword: record.oldPassword,
            newPassword: record.newPassword,
        };
        console.log(data);
        makeRequest({
            method: "PUT",
            url: requestUrl.updateUserPassword.updateUrl({ useId: false }),
            data,
        }).then((res) => {
            notification.open({
                message: "Thông báo",
                icon: res.succeeded ? (
                    <CheckOutlined style={{ color: "#2fd351" }} />
                ) : (
                    <WarningOutlined style={{ color: "#ff0000" }} />
                ),
                description: res.message,
            });
            if (res.succeeded) {
                setVisible(false);
            }
        });
    };

    const getOpenKeys = () => {
        if (collapsed) {
            return [];
        } else {
            return menuParentKey[revertMenu[path]];
        }
    };

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Sider
                collapsible
                collapsed={collapsed}
                trigger={null}
                onCollapse={() => onCollapse()}
            >
                <div className="logo" />
                <Menu
                    theme="dark"
                    defaultOpenKeys={getOpenKeys()}
                    mode="inline"
                    items={items}
                    onOpenChange={onOpenChange}
                    onSelect={onSelect}
                    selectedKeys={selectedKeys || [revertMenu[path]]}
                ></Menu>
            </Sider>
            <Layout className="site-layout">
                <Header
                    className="site-layout-background"
                    style={{
                        height: 40,
                        padding: "0 20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: "thin solid #c6c6c6",
                    }}
                >
                    {collapsed ? (
                        <MenuUnfoldOutlined
                            className="trigger"
                            onClick={() => onCollapse()}
                            style={{ fontSize: "26px" }}
                        />
                    ) : (
                        <MenuFoldOutlined
                            className="trigger"
                            onClick={() => onCollapse()}
                            style={{ fontSize: "26px" }}
                        />
                    )}
                    <Space>
                        <Link
                            to="/"
                            onClick={() => {
                                setSelectedKeys(["1"]);
                                setCollapsed(true);
                            }}
                        >
                            Giám sát
                        </Link>
                        /
                        <Link
                            to="/histories"
                            onClick={() => {
                                setSelectedKeys(["2"]);
                                setCollapsed(true);
                            }}
                        >
                            Lịch sử
                        </Link>
                    </Space>
                    <Dropdown
                        overlay={<Menu items={userMenu} />}
                        placement="bottomRight"
                        trigger={["click"]}
                    >
                        <UserOutlined
                            style={{ fontSize: 20, cursor: "pointer" }}
                        />
                    </Dropdown>
                </Header>
                <Content>
                    <div
                        className="site-layout-background"
                        style={{ padding: 10, height: "100%" }}
                    >
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/histories" element={<History />} />
                            <Route path="/users" element={<User />} />
                            <Route
                                path="/permissions"
                                element={<Permission />}
                            />
                            <Route path="/rfids" element={<RFID />} />
                            <Route path="/cars" element={<CarManager />} />
                            <Route
                                path="/devices"
                                element={<DeviceManager />}
                            />
                            <Route path="/template" element={<Template />} />
                            <Route path="/mail" element={<Mail />} />
                            <Route
                                path="/transaction-points"
                                element={<TransactionPoint />}
                            />
                            <Route
                                path="/sample-routes"
                                element={<SampleRoute />}
                            />
                            <Route
                                path="/segmentations"
                                element={<Segmentation />}
                            />
                            <Route
                                path="/drivers"
                                element={
                                    <MemberManagement
                                        config={memberConfig.driver}
                                        key="driver"
                                    />
                                }
                            />
                            <Route
                                path="/treasurers"
                                element={
                                    <MemberManagement
                                        config={memberConfig.treasure}
                                        key="treasure"
                                    />
                                }
                            />
                            <Route
                                path="/atm-technicans"
                                element={
                                    <MemberManagement
                                        config={memberConfig.atmTechnican}
                                        key="atm-technicans"
                                    />
                                }
                            />
                            <Route
                                path="/escorts"
                                element={
                                    <MemberManagement
                                        config={memberConfig.escort}
                                        key="escorts"
                                    />
                                }
                            />
                            <Route path="/reports" element={<Report />} />
                            <Route path="/units" element={<Unit />} />
                            <Route
                                path="/maintain/:id"
                                element={<Maintain />}
                            />
                            <Route path="/maintain" element={<Maintain />} />
                        </Routes>
                    </div>
                </Content>
            </Layout>
            <Modal
                visible={visible}
                onOk={() => {
                    modalForm.submit();
                }}
                title={"Đổi mật khẩu"}
                onCancel={() => {
                    setVisible(false);
                }}
                okText="Lưu"
                cancelText="Huỷ"
            >
                <Form
                    labelCol={{ span: 10 }}
                    wrapperCol={{ span: 14 }}
                    labelAlign="left"
                    form={modalForm}
                    initialValues={null}
                    onFinish={onSavePassword}
                    style={{ marginTop: 20 }}
                >
                    <Form.Item
                        label="Mật khẩu hiện tại"
                        name="oldPassword"
                        rules={[
                            {
                                required: true,
                                message: "Trường này không được thiếu",
                            },
                        ]}
                    >
                        <Input type="password" />
                    </Form.Item>
                    <Form.Item
                        label="Mật khẩu mới"
                        name="newPassword"
                        rules={[
                            {
                                required: true,
                                message: "Trường này không được thiếu",
                            },
                        ]}
                    >
                        <Input type="password" />
                    </Form.Item>
                    <Form.Item
                        label="Xác nhận mật khẩu mới"
                        name="confirmPassword"
                        dependencies={["newPassword"]}
                        rules={[
                            {
                                required: true,
                                message: "Trường này không được thiếu",
                            },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (
                                        !value ||
                                        getFieldValue("newPassword") === value
                                    ) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(
                                        new Error("Mật khẩu không khớp!")
                                    );
                                },
                            }),
                        ]}
                    >
                        <Input type="password" />
                    </Form.Item>
                </Form>
            </Modal>
        </Layout>
    );
};

export default Dashboard;
