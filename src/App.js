import { Fragment } from "react";
import "antd/dist/antd.min.css";
import { useSelector, useDispatch } from "react-redux";
import Cookies from "js-cookie";

import tokenHandler from "./handle/tokenHandler";
import { logout } from "./stores/loginSlice";
import Dashboard from "./components/dashboard/Dashboard";
import Login from "./components/login/Login";
import "./styles/share.css";
import "./App.css";

function App() {
    const dispatch = useDispatch();
    const accessToken = Cookies.get("x-access-token");
    const isTokenExpired = tokenHandler.checkTokenExpire(accessToken);
    if (isTokenExpired) dispatch(logout());
    const isLogin = useSelector((state) => state.login.isLogin);
    return <Fragment>{isLogin ? <Dashboard /> : <Login />}</Fragment>;
}

export default App;
