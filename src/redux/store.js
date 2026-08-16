import { configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { rootReducer } from "./rootReducer";

const persistConfig = {
  key: "root",
  storage,
  // LanguageSettings is persisted separately (see rootReducer) so the heavy
  // translation payload is never cached in localStorage. This guarantees
  // translations are always re-fetched fresh and newly added keys appear
  // without users having to clear their browser storage.
  blacklist: ["LanguageSettings"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }),
});
export const persistor = persistStore(store);
