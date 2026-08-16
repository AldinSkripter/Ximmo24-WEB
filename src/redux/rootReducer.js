import { combineReducers } from "redux";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import webSettingSlice from "./slices/webSettingSlice";
import languageSlice from "./slices/languageSlice";
import AuthSlice from "./slices/authSlice";
import propertyListFiltersReducer from "./slices/propertyListSlice";
import cacheDataReducer from "./slices/cacheSlice";
import locationReducer from "./slices/locationSlice";
import storiesReducer from "./slices/storiesSlice";

// Persist ONLY the lightweight language choice (active/default/list) — never the
// heavy `current_language.file_name` translation payload nor the loaded flags.
// This forces a fresh translation fetch from the API on every load, so newly
// added keys (e.g. onlyAvailableInBadenWurttemberg) are always picked up while
// the user's selected language is still remembered across reloads.
const languagePersistConfig = {
  key: "LanguageSettings",
  storage,
  blacklist: ["current_language", "isLanguageLoaded", "isFetched"],
};

export const rootReducer = combineReducers({
  WebSetting: webSettingSlice,
  LanguageSettings: persistReducer(languagePersistConfig, languageSlice),
  User: AuthSlice,
  propertyListFilters: propertyListFiltersReducer,
  cacheData: cacheDataReducer,
  location: locationReducer,
  stories: storiesReducer,
});
