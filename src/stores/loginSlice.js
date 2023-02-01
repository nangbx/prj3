import { createSlice } from "@reduxjs/toolkit"
import Cookies from "js-cookie"
import jwt_decode from "jwt-decode"

const accessToken = Cookies.get("x-access-token")

const checkTokenExpire = (token) => {
  if (token) {
    const decoded = jwt_decode(token)
    return decoded.exp < Date.now() ? false : true
  }
  return false
}

const initialState = {
  isLogin: checkTokenExpire(accessToken),
}

export const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    login: (state, action) => {
      state.isLogin = true
    },
    logout: (state, action) => {
      state.isLogin = false
    },
  },
})

export const { login, logout } = loginSlice.actions

export const loginState = (state) => state.login.isLogin

export default loginSlice.reducer
