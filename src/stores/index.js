import { configureStore } from "@reduxjs/toolkit"
import storage from "redux-persist/lib/storage"
import { combineReducers } from "redux"
import {
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist"

import loginReducer from "./loginSlice"
import scopeReducer from "./scopeSlice"

const reducers = combineReducers({
  login: loginReducer,
  scope: scopeReducer,
})

const persistConfig = {
  key: "root",
  version: 1,
  storage,
  whitelist: ["login", "scope"],
}

const persistedReducer = persistReducer(persistConfig, reducers)

const store = configureStore({
  reducer: persistedReducer,
  devTools: true,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export default store
