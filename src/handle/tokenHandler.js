import jwt_decode from "jwt-decode"

const checkTokenExpire = (token) => {
  if (token) {
    const decoded = jwt_decode(token)
    return decoded.exp * 1000 < Date.now() ? true : false
  }
  return true
}

const decodeToken = (token) => {
  return jwt_decode(token)
}

export default { checkTokenExpire, decodeToken }
