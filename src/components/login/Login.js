import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { useDispatch } from "react-redux"
import { Spin } from "antd"
import Cookies from "js-cookie"

import { login } from "../../stores/loginSlice"
import { setScope } from "../../stores/scopeSlice"
import yup from "./yupGlobal"
import makeRequest from "../../utils/makeRequest"
import { requestUrl } from "../../resource/requestUrl"

import "./Login.css"

const schema = yup.object().shape({
  username: yup.string().required("Required").email("Email invalid"),
  password: yup.string().required("Required"),
})

const Login = () => {
  const [loading, setLoading] = useState(false)
  const [unAuthorize, setUnAuthorize] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    resolver: yupResolver(schema),
  })

  const dispatch = useDispatch()

  const onSubmit = async (data) => {
    setLoading(true)
    setUnAuthorize(false)
    const result = await makeRequest({
      method: "POST",
      url: requestUrl.userLogin.readUrl(),
      headerOpt: { "content-type": "application/json" },
      data,
    })
    setLoading(false)
    if (result.statusCode === 200) {
      Cookies.set("x-access-token", result.data.accessToken)
      dispatch(login())
      dispatch(setScope({ scopeId: result.data.scopeId }))
    } else {
      setUnAuthorize(true)
    }
  }

  return (
    <form className="box" onSubmit={handleSubmit(onSubmit)} id="login-form">
      <h1>Tracking Management</h1>
      <div className="input-field">
        <input
          className="custom-input-field"
          type="text"
          name="username"
          id="username"
          placeholder="User name"
          {...register("username", { required: true })}
        />
        {errors.username && <p className="error">{errors.username.message}</p>}
      </div>
      <div className="input-field">
        <input
          className="custom-input-field"
          type="password"
          name="password"
          id="password"
          placeholder="Password"
          autoComplete="off"
          {...register("password", { required: true })}
        />
        {errors.password && <p className="error">{errors.password.message}</p>}
      </div>
      {unAuthorize && (
        <div className="input-field">
          <p className="login-error">Username or password incorrect</p>
        </div>
      )}
      {loading && <Spin></Spin>}
      <button type="submit" id="submit">
        LOGIN
      </button>
    </form>
  )
}

export default Login
