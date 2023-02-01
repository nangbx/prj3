import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  scopeId: "",
}

export const scopeSlice = createSlice({
  name: "scope",
  initialState,
  reducers: {
    setScope: (state, action) => {
      state.scopeId = action.payload.scopeId
    },
  },
})

export const { setScope } = scopeSlice.actions

export const scopeState = (state) => state.scope.scopeId

export default scopeSlice.reducer
