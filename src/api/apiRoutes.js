import api from "./axiosMiddleware";
import * as apiEndpoints from "./apiEndpoints";
import { MAP_SERVICE_PROVIDERS, getActiveMapServiceProvider } from "@/utils/mapProvider";
import {
  createFilteredFormData,
  getFilteredParams,
} from "@/utils/helperFunction";

// Not
// export const getSetting = async () => {
//   const res = await api.post(apiEndpoints.GET_SETTINGS);
//   return res.data;
// };

// 1.Get Web Settings
export const getWebSetting = async () => {
  const res = await api.get(apiEndpoints.WEB_SETTINGS);
  return res.data;
};

// 2.Get Home Page Data
export const getHomePageData = async ({
  latitude = "",
  longitude = "",
  radius = "",
}) => {
  // Only include params that have values
  const params = {};
  if (latitude) params.latitude = latitude;
  if (longitude) params.longitude = longitude;
  if (radius) params.radius = radius;

  const res = await api.get(apiEndpoints.HOMEPAGE_DATA, { params });
  return res.data;
};

// 3.Get Cities Data
export const getCitiesData = async ({ offset, limit }) => {
  const params = { offset: offset, limit: limit };
  const res = await api.get(apiEndpoints.GET_CITYS_DATA, { params });
  return res.data;
};

// 4.Get Property Details
export const getPropertyDetails = async ({ slug_id }) => {
  const params = { slug_id: slug_id };
  const res = await api.get(apiEndpoints.GET_PROPETRES, { params });
  return res.data;
};

// 5.Get Language Data
export const getLanguageData = async ({
  language_code,
  web_language_file = 1,
}) => {
  const params = { language_code, web_language_file };
  const res = await api.get(apiEndpoints.GET_LANGUAGES, { params });
  return res.data;
};

// 6.User Signup
export const userSignup = async ({
  name = "",
  email = "",
  password = "",
  mobile = "",
  type = "",
  address = "",
  auth_id = "",
  logintype = "",
  profile = "",
  fcm_id = "",
  country_code = "",
}) => {
  // Create an object with all parameters
  const userData = {
    name,
    email,
    password,
    mobile,
    type,
    address,
    auth_id,
    logintype,
    profile,
    fcm_id,
    country_code,
  };

  // Filter out falsy values and create FormData
  const formData = createFilteredFormData(userData);

  // Send only non-falsy values to the API
  const res = await api.post(apiEndpoints.USER_SIGNUP, formData);
  return res.data;
};

// 7.Verify OTP
export const verifyOTP = async ({ number = "", email = "", otp = "", country_code = "" }) => {
  const params = getFilteredParams({
    number,
    email,
    otp,
    country_code
  })
  const res = await api.get(apiEndpoints.VERIFY_OTP, { params });
  return res.data;
};

// 8.User Register
/**
 * @param {Object} param - Registration Details of User
 * @param {string} param.name - User's name
 * @param {string} param.email - User's email
 * @param {string} param.mobile - User's mobile number
 * @param {string} param.password - User's password
 * @param {string} param.re_password - User's confirm password
 * @param {string} param.country_code - User's country code without + (e.g.: "91" for India)
 * @param {"0" | "1" | "2" | "3"} param.type - Login type (0: Google, 1:Number, 2:Apple, 3:Email)
 * @returns {Promise<Object>} - API response
 */
export const userRegisterApi = async ({
  name = "",
  email = "",
  mobile = "",
  password = "",
  re_password = "",
  country_code = "",
  type = "0",
  firebase_id = ""
}) => {
  const data = {
    name,
    email,
    mobile,
    password,
    re_password,
    country_code,
    type,
    firebase_id
  };

  const formData = createFilteredFormData(data);
  const res = await api.post(apiEndpoints.USER_REGISTER, formData);
  return res.data;
};

// 9.Get OTP
export const getOTPApi = async ({ number = "", email = "", country_code = "" }) => {
  const params = getFilteredParams({
    number,
    email,
    country_code
  });
  const res = await api.get(apiEndpoints.GET_OTP, { params });
  return res.data;
};

// 10.Forgot Password
// This api is no longer used as it is handled by getOTPApi 
export const forgotPasswordApi = async ({ email = "" }) => {
  const params = {
    email,
  };
  const res = await api.get(apiEndpoints.FORGOT_PASSWORD, { params });
  return res.data;
};

// 11.Before Logout
export const beforeLogoutApi = async ({ fcm_id = "" }) => {
  const formData = createFilteredFormData({ fcm_id });
  const res = await api.post(apiEndpoints.BEFORE_LOGOUT, formData);
  return res.data;
};

export const getPropertyListApi = async (params = {}) => {
  const {
    property_type,
    category_id,
    category_slug_id,
    parameters,
    nearby_places,
    location,
    price,
    posted_since,
    search,
    flags,
    limit = "",
    offset = ""
  } = params;

  // Build filtersObject — only include keys with real values.
  // property_type === 0 is a valid value (Sell), so check for undefined explicitly.
  const filtersObject = {};

  if (property_type !== undefined && property_type !== "") {
    filtersObject.property_type = property_type;
  }
  if (category_id) filtersObject.category_id = category_id;
  if (category_slug_id) filtersObject.category_slug_id = category_slug_id;
  if (Array.isArray(parameters) && parameters.length > 0) filtersObject.parameters = parameters;
  if (Array.isArray(nearby_places) && nearby_places.length > 0) filtersObject.nearby_places = nearby_places;
  if (location && typeof location === "object" && Object.keys(location).length > 0) filtersObject.location = location;
  if (price && typeof price === "object" && Object.keys(price).length > 0) filtersObject.price = price;
  // posted_since 0 is a valid value (lastWeek), so only omit when undefined / null / ""
  if (posted_since !== undefined && posted_since !== null && posted_since !== "") {
    filtersObject.posted_since = posted_since;
  }
  if (search) filtersObject.search = search;
  if (flags && typeof flags === "object" && Object.keys(flags).length > 0) filtersObject.flags = flags;

  // Only encode and send filters when there is at least one active filter.
  // An empty filtersObject would produce "e30=" (base64 of "{}") which is meaningless.
  const requestParams = {
    limit: parseInt(limit) || 10,
    offset: parseInt(offset) || 0
  };

  if (Object.keys(filtersObject).length > 0) {
    // requestParams.filters = btoa(JSON.stringify(filtersObject));
    requestParams.filters = btoa(unescape(encodeURIComponent(JSON.stringify(filtersObject))));
  }

  const filteredParams = getFilteredParams(requestParams);


  const res = await api.get(apiEndpoints.GET_PROPERTY_LIST, {
    params: filteredParams,
  });
  return res.data;
};


export const getCountbyCityApi = async ({ offset = "", limit = "" }) => {
  const params = {
    offset,
    limit,
  };
  const res = await api.get(apiEndpoints.GET_CITYS_DATA, { params });
  return res.data;
};
// 13.Get Categories
export const getCategoriesApi = async ({
  limit = "",
  offset = "",
  has_property = false,
  passHasProperty = true,
  slug_id = "",
  id = "",
  latitude = "",
  longitude = "",
  radius = "",
}) => {
  let params = {};
  if (limit) {
    params.limit = limit;
  }
  if (offset) {
    params.offset = offset;
  }
  if (passHasProperty) {
    params.has_property = has_property;
  }
  if (slug_id) {
    params.slug_id = slug_id
  }
  if (id) {
    params.id = id
  }
  if (latitude) {
    params.latitude = latitude;
  }
  if (longitude) {
    params.longitude = longitude;
  }
  if (radius) {
    params.radius = radius;
  }

  const res = await api.get(apiEndpoints.GET_CATEGORIES, { params });
  return res.data;
};

// 14.Get Facilities
export const getFacilitiesApi = async () => {
  const res = await api.get(apiEndpoints.GET_FACILITIES);
  return res.data;
};

// 15. Get Facilities for Filter
export const getFacilitiesForFilterApi = async () => {
  const res = await api.get(apiEndpoints.GET_FACILITITES_FOR_FILTER);
  return res.data;
};

// 16. Contact Us
export const contactUsApi = async ({
  first_name = "",
  last_name = "",
  email = "",
  subject = "",
  message = "",
}) => {
  const formData = createFilteredFormData({
    first_name,
    last_name,
    email,
    subject,
    message,
  });
  const res = await api.post(apiEndpoints.CONTACT_US, formData);
  return res.data;
};

// 17. Get Packages
export const getPackagesApi = async () => {
  // const params = { user_type };
  const res = await api.get(apiEndpoints.GET_PACKAGES);
  return res.data;
};

// 18. Get Payment Settings
export const getPaymentSettingsApi = async () => {
  const res = await api.get(apiEndpoints.GET_PAYMENT_SETTINGS);
  return res.data;
};

// 19. Assign Free Package
export const assignFreePackageApi = async ({ package_id = "" }) => {
  const formData = createFilteredFormData({ package_id });
  const res = await api.post(apiEndpoints.ASSIGN_FREE_PACKAGE, formData);
  return res.data;
};

// 20. Create Payment Intent
export const createAllPaymentIntentApi = async ({
  package_id = "",
  pay_as_you_go_id = "",
  platform_type = "",
  payment_method = "",
}) => {
  const formData = createFilteredFormData({ package_id, pay_as_you_go_id, platform_type, payment_method });
  const res = await api.post(apiEndpoints.CREATE_PAYMENT_INTENT, formData);
  return res.data;
};

// 21. Payment Transaction Failed
export const paymentTransactionFailApi = async ({
  payment_transaction_id = "",
}) => {
  const formData = createFilteredFormData({ payment_transaction_id });
  const res = await api.post(apiEndpoints.PAYMENT_TRANSACTION_FAIL, formData);
  return res.data;
};

// 22. Paypal Api
export const paypalApi = async ({ amount = "", package_id = "" }) => {
  const params = getFilteredParams({
    amount,
    package_id,
  });
  const res = await api.get(apiEndpoints.PAYPAL, { params });
  return res.data;
};

//  23. FlutterWave Api
export const flutterWaveApi = async ({ package_id = "" }) => {
  const formData = createFilteredFormData({ package_id });
  const res = await api.post(apiEndpoints.FLUTTERWAVE, formData);
  return res.data;
};

// 24. Get FAQs
export const getFaqsApi = async ({ limit = "", offset = "" }) => {
  const params = {
    limit,
    offset,
  };
  const filteredParams = getFilteredParams(params);
  const res = await api.get(apiEndpoints.FAQS, { params: filteredParams });
  return res.data;
};

// 25. Get All Agents
export const getAllAgentsApi = async ({ limit = "", offset = "" }) => {
  const params = { limit, offset };
  const res = await api.get(apiEndpoints.AGENT_LIST, { params });
  return res.data;
};

// 26. Get All Projects
export const getAllProjectsApi = async ({
  limit = "",
  offset = "",
  filters = "",
}) => {
  const params = {
    limit: parseInt(limit) || 10,
    offset: parseInt(offset) || 0,
  };

  if (filters) {
    params.filters = filters;
  }

  const filteredParams = getFilteredParams(params);
  const res = await api.get(apiEndpoints.GET_PROJECTS, {
    params: filteredParams,
  });
  return res.data;
};

// 27. Get All Articles
export const getArticlesApi = async ({
  id = "",
  category_id = "",
  slug_id = "",
  limit = "",
  offset = "",
}) => {
  const params = {
    id,
    category_id,
    slug_id,
    limit,
    offset,
  };
  const filteredParams = getFilteredParams(params);
  const res = await api.get(apiEndpoints.GET_ARTICLES, {
    params: filteredParams,
  });
  return res.data;
};

// 28. Get Added Properties
export const getAddedPropertiesApi = async ({
  limit = "",
  offset = "",
  slug_id = "",
  is_promoted = "",
  request_status = "",
  property_type = "",
  added_as = "",
  status = ""
}) => {
  const params = {
    limit, offset,
    slug_id: slug_id ? slug_id : undefined,
    is_promoted: is_promoted ? is_promoted : undefined,
    // Special handling for request_status and property_type
    request_status: request_status !== " " ? request_status : undefined,
    property_type: property_type !== " " ? property_type : undefined,
    added_as: added_as ? added_as : undefined,
    status: status ? status : undefined
  };
  const res = await api.get(apiEndpoints.GET_ADDED_PROPERTIES, { params });
  return res.data;
};

// 29. Get Verification Form Fields
export const getVerificationFormFieldsApi = async ({ form_type = "" }) => {
  const params = { form_type };
  const res = await api.get(apiEndpoints.GET_AGENT_VERIFICATION_FORM_FIELDS, { params });
  return res.data;
};

// 30. Get Verification Form Values
export const getVerificationFormValuesApi = async ({ form_type = "" }) => {
  const params = { form_type };
  const res = await api.get(apiEndpoints.GET_AGENT_VERIFICATION_FORM_VALUES, { params });
  return res.data;
};

// 31. Apply Agent Verification
export const applyAgentVerificationApi = async ({ form_type = "", form_fields = [] }) => {
  let data = new FormData();
  if (form_type) {
    data.append("form_type", form_type);
  }
  // Append the parameters array if it is an array
  if (Array.isArray(form_fields)) {
    form_fields.forEach((field, index) => {
      data.append(`form_fields[${index}][id]`, field.id);
      data.append(`form_fields[${index}][value]`, field.value);
    });
  }
  const res = await api.post(apiEndpoints.APPLY_AGENT_VERIFICATION, data);
  return res.data;
};

// 32. Change Property Status
export const changePropertyStatusApi = async ({
  property_id = "",
  status = "",
}) => {
  const formData = createFilteredFormData({ property_id, status });
  const res = await api.post(apiEndpoints.CHANGE_PROPERTY_STATUS, formData);
  return res.data;
};

// 33. Update Property Status
export const updatePropertyStatusApi = async ({
  property_id = "",
  status = "",
}) => {
  const formData = createFilteredFormData({ property_id, status });
  const res = await api.post(apiEndpoints.UPDATE_PROPERTY_STATUS, formData);
  return res.data;
};

// 34. Check Package Limit
export const checkPackageLimitApi = async ({ type = "" }) => {
  const params = { type };
  const res = await api.get(apiEndpoints.CHECK_PACKAGE_LIMIT, { params });
  if (!res?.data?.error) {
    return res.data;
  } else {
    throw res.data;
  }
};

// 35. Feature Property
export const featurePropertyApi = async ({
  feature_for = "",
  property_id = "",
  project_id = "",
}) => {
  const formData = createFilteredFormData({
    feature_for,
    property_id,
    project_id,
  });
  const res = await api.post(apiEndpoints.STORE_ADVERTISEMENT, formData);
  return res.data;
};

// 36. Delete Property
export const deletePropertyApi = async ({ id = "" }) => {
  const formData = createFilteredFormData({ id });
  const res = await api.post(apiEndpoints.DELETE_PROPERTY, formData);
  return res.data;
};

// 37. Get Project Details
export const getProjectDetailsApi = async ({
  slug_id = "",
  get_similar = "",
}) => {
  const params = { slug_id, get_similar };
  const filteredParams = getFilteredParams(params);
  const res = await api.get(apiEndpoints.GET_PROJECT_DETAILS, {
    params: filteredParams,
  });
  return res.data;
};

// 38. Get Advertisements
export const getFeaturedDataApi = async ({
  type = "",
  limit = "",
  offset = "",
}) => {
  const params = { type, limit, offset };
  const res = await api.get(apiEndpoints.GET_FEATURED_DATA, { params });
  return res.data;
};

// 38a. Delete Advertisement
export const deleteAdvertisementApi = async ({ id = "" }) => {
  const formData = createFilteredFormData({ id });
  const res = await api.post(apiEndpoints.DELETE_ADVERTISEMENT, formData);
  return res.data;
};

// 39. Get User Projects
export const getUserProjectsApi = async ({
  limit = "",
  offset = "",
  slug_id = "",
  type = "",
  request_status = "",
  added_as = "",
  status = ""
}) => {
  const params = {
    limit,
    offset,
    // Special handling for slug_id, type, and request_status
    slug_id: slug_id ? slug_id : undefined,
    type: type !== " " ? type : undefined,
    request_status: request_status !== " " ? request_status : undefined,
    added_as: added_as ? added_as : undefined,
    status: status ? status : undefined
  };
  const res = await api.get(apiEndpoints.GET__MY_PROJECTS, { params });
  return res.data;
};

// 40. Change Project Status
export const changeProjectStatusApi = async ({
  project_id = "",
  status = "",
}) => {
  const formData = createFilteredFormData({ project_id, status });
  const res = await api.post(apiEndpoints.CHANGE_PROJECT_STATUS, formData);
  return res.data;
};

// 41. Delete Project
export const deleteProjectApi = async ({ id = "" }) => {
  const formData = createFilteredFormData({ id });
  const res = await api.post(apiEndpoints.DELETE_PROJECT, formData);
  return res.data;
};

// 42. Get Favourite Property
export const getFavouritePropertyApi = async ({ limit = "", offset = "" }) => {
  const params = { limit, offset };
  const res = await api.get(apiEndpoints.GET_FAVOURITE_PROPERTY, { params });
  return res.data;
};

// 43. Add Favourite Property
export const addFavouritePropertyApi = async ({
  property_id = "",
  type = "", // 0 for like, 1 for unlike
}) => {
  const formData = createFilteredFormData({ property_id, type });
  const res = await api.post(apiEndpoints.ADD_FAVOURITE, formData);
  return res.data;
};

// 44. Update User Profile
export const updateUserProfileApi = async ({
  userid = "",
  name = "",
  email = "",
  mobile = "",
  address = "",
  firebase_id = "",
  logintype = "",
  profile = "",
  latitude = "",
  longitude = "",
  about_me = "",
  facebook_id = "",
  twiiter_id = "",
  instagram_id = "",
  youtube_id = "",
  city = "",
  state = "",
  country = "",
  country_code = "",
}) => {
  const formData = createFilteredFormData({
    userid,
    name,
    email,
    mobile,
    address,
    firebase_id,
    logintype,
    profile,
    latitude,
    longitude,
    city,
    state,
    country,
    about_me,
    facebook_id,
    instagram_id,
    youtube_id,
    twiiter_id,
    country_code,
  });
  const res = await api.post(apiEndpoints.UPDATE_PROFILE, formData);
  return res.data;
};

// 45. Update Agent Profile
export const updateAgentProfileApi = async ({
  agent_name = "",
  agent_email = "",
  about_me = "",
  agent_address = "",
  facebook_id = "",
  twitter_id = "",
  youtube_id = "",
  instagram_id = "",
  linkedin_id = "",
  agent_profile_photo = "",
  agent_mobile = "",
  agent_country_code,
  agent_banner
}) => {
  const formData = createFilteredFormData({
    agent_name,
    agent_email,
    about_me,
    agent_address,
    facebook_id,
    twitter_id,
    youtube_id,
    instagram_id,
    agent_mobile,
    agent_profile_photo,
    agent_country_code,
    linkedin_id,
    agent_banner
  });
  const res = await api.post(apiEndpoints.UPDATE_AGENT_PROFILE, formData);
  return res.data;
};

// 46. Get Notification List
export const getNotificationListApi = async ({ limit = "", offset = "" }) => {
  const params = { limit, offset };
  const res = await api.get(apiEndpoints.GET_NOTIFICATION_LIST, { params });
  return res.data;
};

// 47. Get User transaction details
export const getUserTransactionDetailsApi = async ({
  limit = "",
  offset = "",
  payment_type = "",
}) => {
  const params = {
    limit,
    offset,
    payment_type,
  };
  const res = await api.get(apiEndpoints.GET_PAYMENT_DETAILS, { params });
  return res.data;
};

// 48. download payment receipt
export const downloadPaymentReceiptApi = async ({
  payment_transaction_id = "",
}) => {
  const params = { payment_transaction_id };
  const res = await api.get(apiEndpoints.GET_PAYMENT_RECEIPT, { params });
  return res.data;
};

// 49. Initiate Bank Transfer
export const initiateBankTransferApi = async ({ package_id = "", file, pay_as_you_go_id = "" }) => {
  const formData = createFilteredFormData({ package_id, file, pay_as_you_go_id });
  const res = await api.post(apiEndpoints.INITIATE_BANK_TRANSFER, formData);
  return res.data;
};

// 49. Upload Bank Receipt File
export const uploadBankReceiptFileApi = async ({
  file = "",
  payment_transaction_id = "",
}) => {
  const formData = createFilteredFormData({ file, payment_transaction_id });
  const res = await api.post(apiEndpoints.UPLOAD_BANK_RECEIPT_FILE, formData);
  return res.data;
};

// 50. Post Property
export const postPropertyApi = async ({
  userid = "",
  title = "",
  description = "",
  city = "",
  state = "",
  country = "",
  latitude = "",
  longitude = "",
  address = "",
  price = "",
  category_id = "",
  property_type = "",
  video_link = "",
  video_type = "",
  custom_video = null,
  parameters = {},
  facilities = {},
  title_image = null,
  three_d_image = null,
  gallery_images = [],
  meta_title = "",
  meta_description = "",
  meta_keywords = "",
  meta_image = null,
  rentduration = "",
  is_premium = "",
  client_address = "",
  slug_id = "",
  documents = [],
  translations = [],
  is_draft = false
}) => {
  const formData = new FormData();

  // Basic property details
  if (userid) {
    formData.append("userid", userid);
  }
  if (title) {
    formData.append("title", title);
  }
  if (description) {
    formData.append("description", description);
  }
  if (city) {
    formData.append("city", city);
  }
  if (state) {
    formData.append("state", state);
  }
  if (country) {
    formData.append("country", country);
  }
  if (latitude) {
    formData.append("latitude", latitude);
  }
  if (longitude) {
    formData.append("longitude", longitude);
  }
  if (address) {
    formData.append("address", address);
  }
  if (price) {
    formData.append("price", price);
  }
  if (category_id) {
    formData.append("category_id", category_id);
  }
  if (property_type) {
    formData.append("property_type", property_type);
  }

  if (video_type) {
    formData.append("video_type", video_type === "youtubeLink" ? 1 : video_type === "vimeoLink" ? 2 : 0);
  }

  if (custom_video) {
    formData.append("custom_video", custom_video);
  }
  if (video_link) {
    formData.append("video_link", video_link);
  }

  if (meta_title) {
    formData.append("meta_title", meta_title);
  }
  if (meta_description) {
    formData.append("meta_description", meta_description);
  }
  if (meta_keywords) {
    formData.append("meta_keywords", meta_keywords);
  }
  if (meta_image) {
    formData.append("meta_image", meta_image);
  }
  if (property_type === "1" && rentduration) {
    formData.append("rentduration", rentduration);
  }
  if (is_premium) {
    formData.append("is_premium", is_premium);
  }
  if (client_address) {
    formData.append("client_address", client_address);
  }
  if (slug_id) {
    formData.append("slug_id", slug_id);
  }
  if (is_draft) {
    formData.append("is_draft", is_draft);
  }

  // Handle translations data
  if (translations && translations.length > 0) {
    translations.forEach((translation, index) => {
      // Handle title with its nested properties
      if (translation.title) {
        // Handle translation_id for title
        formData.append(`translations[${index}][title][translation_id]`, "");

        // Handle language_id for title
        if (translation.language_id) {
          formData.append(
            `translations[${index}][title][language_id]`,
            translation.language_id,
          );
        }

        // Handle value for title
        if (translation.title) {
          formData.append(
            `translations[${index}][title][value]`,
            translation.title,
          );
        }
      }

      // Handle description with its nested properties
      if (translation.description) {
        // Handle translation_id for description
        formData.append(
          `translations[${index}][description][translation_id]`,
          "",
        );

        // Handle language_id for description
        if (translation.language_id) {
          formData.append(
            `translations[${index}][description][language_id]`,
            translation.language_id,
          );
        }

        // Handle value for description
        if (translation.description) {
          formData.append(
            `translations[${index}][description][value]`,
            translation.description,
          );
        }
      }
    });
  }

  // Media files
  if (title_image) {
    formData.append("title_image", title_image);
  }
  if (three_d_image) {
    formData.append("three_d_image", three_d_image);
  }

  // Transform facilities data into the expected format
  if (facilities && Object.keys(facilities).length > 0) {
    Object.entries(facilities).forEach(([facilityId, distance], index) => {
      formData.append(`facilities[${index}][facility_id]`, facilityId);
      formData.append(`facilities[${index}][distance]`, distance);
    });
  }

  // Transform parameters data into the expected format
  if (parameters && Object.keys(parameters).length > 0) {
    Object.entries(parameters).forEach(([parameterId, value], index) => {
      formData.append(`parameters[${index}][parameter_id]`, parameterId);
      formData.append(`parameters[${index}][value]`, value);
    });
  }

  // Append gallery images as array elements
  if (Array.isArray(gallery_images) && gallery_images.length > 0) {
    gallery_images.forEach((image, index) => {
      formData.append(`gallery_images[${index}]`, image);
    });
  }

  // Append documents as array elements
  if (Array.isArray(documents) && documents.length > 0) {
    documents.forEach((doc, index) => {
      formData.append(`documents[${index}]`, doc);
    });
  }

  const res = await api.post(apiEndpoints.POST_PROPERTY, formData);
  return res.data;
};

// 51. Update Property
export const updatePostPropertyApi = async ({
  action_type = "",
  id = "",
  title = "",
  description = "",
  city = "",
  state = "",
  country = "",
  latitude = "",
  longitude = "",
  address = "",
  price = "",
  category_id = "",
  property_type = "",
  video_link = "",
  video_type = "",
  custom_video = null,
  parameters = [],
  facilities = [],
  title_image = "",
  three_d_image = "",
  gallery_images = [],
  slug_id = "",
  meta_title = "",
  meta_description = "",
  meta_keywords = "",
  meta_image = "",
  rentduration = "",
  is_premium = "",
  client_address = "",
  remove_gallery_images = "",
  remove_documents = "",
  documents = [],
  remove_three_d_image,
  translations = [],
  remove_meta_image = "",
  remove_video = 0,
}) => {
  let data = new FormData();

  // Append the property data to the FormData object
  if (action_type) {
    data.append("action_type", action_type);
  }
  if (id) {
    data.append("id", id);
  }
  if (title) {
    data.append("title", title);
  }
  if (description) {
    data.append("description", description);
  }
  if (city) {
    data.append("city", city);
  }
  if (state) {
    data.append("state", state);
  }
  if (country) {
    data.append("country", country);
  }
  if (latitude) {
    data.append("latitude", latitude);
  }
  if (longitude) {
    data.append("longitude", longitude);
  }
  if (address) {
    data.append("address", address);
  }
  if (price) {
    data.append("price", price);
  }
  if (category_id) {
    data.append("category_id", category_id);
  }
  if (property_type) {
    data.append("property_type", property_type);
  }
  if (video_link) {
    data.append("video_link", video_link);
  }
  if (video_type) {
    data.append("video_type", video_type === "youtubeLink" ? 1 : video_type === "vimeoLink" ? 2 : 0);
  }
  if (custom_video) {
    data.append("custom_video", custom_video);
  }
  if (title_image) {
    data.append("title_image", title_image);
  }
  if (three_d_image) {
    data.append("three_d_image", three_d_image);
  }
  if (slug_id) {
    data.append("slug_id", slug_id);
  }
  if (meta_title) {
    data.append("meta_title", meta_title);
  }
  if (meta_description) {
    data.append("meta_description", meta_description);
  }
  if (meta_keywords) {
    data.append("meta_keywords", meta_keywords);
  }
  // Only append meta_image if it's a File or empty, skip if it's a string
  if (meta_image instanceof File) {
    data.append("meta_image", meta_image); // Pass file if it's a File
  } else if (!meta_image) {
    data.append("meta_image", ""); // Pass empty string if meta_image is null/undefined
  }
  if (property_type === "1" && rentduration) {
    data.append("rentduration", rentduration);
  }
  if (is_premium) {
    data.append("is_premium", is_premium);
  }
  if (client_address) {
    data.append("client_address", client_address);
  }
  if (remove_three_d_image) {
    data.append("remove_three_d_image", remove_three_d_image);
  }

  if (remove_meta_image) {
    data.append("remove_meta_image", remove_meta_image);
  }

  if (remove_video) {
    data.append("remove_video", remove_video);
  }
  // Handle translations data
  if (translations && translations.length > 0) {
    translations.forEach((translation, index) => {
      // Handle title with its nested properties
      if (translation.title) {
        // Handle translation_id for title
        if (translation.title.translation_id !== undefined) {
          data.append(
            `translations[${index}][title][translation_id]`,
            translation.title.translation_id,
          );
        }

        // Handle language_id for title
        if (translation.title.language_id) {
          data.append(
            `translations[${index}][title][language_id]`,
            translation.title.language_id,
          );
        }

        // Handle value for title
        if (translation.title.value) {
          data.append(
            `translations[${index}][title][value]`,
            translation.title.value,
          );
        }
      }

      // Handle description with its nested properties
      if (translation.description) {
        // Handle translation_id for description
        if (translation.description.translation_id !== undefined) {
          data.append(
            `translations[${index}][description][translation_id]`,
            translation.description.translation_id,
          );
        }

        // Handle language_id for description
        if (translation.description.language_id) {
          data.append(
            `translations[${index}][description][language_id]`,
            translation.description.language_id,
          );
        }

        // Handle value for description
        if (translation.description.value) {
          data.append(
            `translations[${index}][description][value]`,
            translation.description.value,
          );
        }
      }
    });
  }

  // Append the parameters array if it is an array
  if (Array.isArray(parameters)) {
    parameters.forEach((parameter, index) => {
      data.append(`parameters[${index}][parameter_id]`, parameter.parameter_id);
      data.append(`parameters[${index}][value]`, parameter.value);
    });
  }
  // Append the facilities array if it is an array
  if (Array.isArray(facilities)) {
    facilities.forEach((facility, index) => {
      data.append(`facilities[${index}][facility_id]`, facility.facility_id);
      data.append(`facilities[${index}][distance]`, facility.distance);
    });
  }

  // Check if gallery_images is defined and an array before using forEach
  if (Array.isArray(documents)) {
    documents.forEach((image, index) => {
      data.append(`documents[${index}]`, image);
    });
  }
  if (Array.isArray(gallery_images)) {
    gallery_images.forEach((image, index) => {
      data.append(`gallery_images[${index}]`, image);
    });
  }
  if (Array.isArray(remove_gallery_images)) {
    remove_gallery_images.forEach((image, index) => {
      data.append(`remove_gallery_images[${index}]`, image);
    });
  }
  if (Array.isArray(remove_documents)) {
    remove_documents.forEach((image, index) => {
      data.append(`remove_documents[${index}]`, image);
    });
  }

  const res = await api.post(apiEndpoints.UPDATE_POST_PROPERTY, data);
  return res.data;
};

// 52. Submit User Interests
export const submitUserInterestsApi = async ({
  category_ids,
  outdoor_facilitiy_ids,
  price_range,
  property_type,
  city,
}) => {
  const formData = createFilteredFormData({
    category_ids,
    outdoor_facilitiy_ids,
    price_range,
    property_type,
    city,
  });
  const res = await api.post(apiEndpoints.USER_INTREST, formData);
  return res.data;
};

// 53. Get User Intrested Data
export const getUserIntrestedDataApi = async () => {
  const res = await api.get(apiEndpoints.USER_INTREST);
  return res.data;
};

// 54. Delete User Intrested Data
export const deleteUserIntrestedDataApi = async () => {
  const res = await api.delete(apiEndpoints.USER_INTREST);
  return res.data;
};

// 55. Delete User Account
export const deleteUserAccountApi = async () => {
  const res = await api.post(apiEndpoints.DELETE_USER);
  return res.data;
};

// 56. Post Project
export const postProjectApi = async ({
  id = "",
  title = "",
  description = "",
  category_id = "",
  type = "",
  meta_title = "",
  meta_description = "",
  meta_keywords = "",
  meta_image = null,
  city = "",
  state = "",
  country = "",
  latitude = "",
  longitude = "",
  location = "",
  video_link = "",
  video_type = "",
  custom_video = null,
  image = null,
  plans = [],
  documents = [],
  gallery_images = [],
  remove_documents = [],
  remove_gallery_images = [],
  remove_plans = [],
  slug_id = "",
  translations = [],
  remove_meta_image = "",
  is_premium = false,
  remove_video = 0,
  is_draft = false
}) => {
  let data = new FormData();
  // Append the property data to the FormData object
  if (id) {
    data.append("id", id);
  }
  if (title) {
    data.append("title", title);
  }
  if (description) {
    data.append("description", description);
  }
  if (category_id) {
    data.append("category_id", category_id);
  }
  if (type) {
    data.append("type", type);
  }
  if (meta_title) {
    data.append("meta_title", meta_title);
  }
  if (meta_description) {
    data.append("meta_description", meta_description);
  }
  if (meta_keywords) {
    data.append("meta_keywords", meta_keywords);
  }

  // Only append meta_image if it's a File or empty, skip if it's a string
  if (meta_image instanceof File) {
    data.append("meta_image", meta_image); // Pass file if it's a File
  } else if (!meta_image) {
    data.append("meta_image", ""); // Pass empty string if meta_image is null/undefined
  }

  if (city) {
    data.append("city", city);
  }
  if (state) {
    data.append("state", state);
  }
  if (country) {
    data.append("country", country);
  }
  if (latitude) {
    data.append("latitude", latitude);
  }
  if (longitude) {
    data.append("longitude", longitude);
  }
  if (location) {
    data.append("location", location);
  }
  if (video_link) {
    data.append("video_link", video_link);
  }
  if (video_type) {
    data.append("video_type", video_type === "youtubeLink" ? 1 : video_type === "vimeoLink" ? 2 : 0);
  }
  if (custom_video) {
    data.append("custom_video", custom_video);
  }
  if (image) {
    data.append("image", image);
  }
  if (remove_documents) {
    data.append("remove_documents", remove_documents);
  }
  if (remove_gallery_images) {
    data.append("remove_gallery_images", remove_gallery_images);
  }
  if (remove_plans) {
    data.append("remove_plans", remove_plans);
  }
  if (remove_meta_image) {
    data.append("remove_meta_image", remove_meta_image);
  }
  if (slug_id) {
    data.append("slug_id", slug_id);
  }
  if (is_premium === true) {
    data.append("is_premium", 1);
  }
  if (remove_video) {
    data.append("remove_video", remove_video);
  }
  if (is_draft) {
    data.append("is_draft", is_draft);
  }

  // Handle translations data
  if (translations && translations.length > 0) {
    translations.forEach((translation, index) => {
      // Handle title with its nested properties
      if (translation.title) {
        // Handle translation_id for title
        data.append(`translations[${index}][title][translation_id]`, "");

        // Handle language_id for title
        if (translation.language_id) {
          data.append(
            `translations[${index}][title][language_id]`,
            translation.language_id,
          );
        }

        // Handle value for title
        if (translation.title) {
          data.append(
            `translations[${index}][title][value]`,
            translation.title,
          );
        }
      }

      // Handle description with its nested properties
      if (translation.description) {
        // Handle translation_id for description
        data.append(`translations[${index}][description][translation_id]`, "");

        // Handle language_id for description
        if (translation.language_id) {
          data.append(
            `translations[${index}][description][language_id]`,
            translation.language_id,
          );
        }

        // Handle value for description
        if (translation.description) {
          data.append(
            `translations[${index}][description][value]`,
            translation.description,
          );
        }
      }
    });
  }

  // Append the parameters array if it is an array
  if (Array.isArray(plans)) {
    plans.forEach((plans, index) => {
      data.append(`plans[${index}][id]`, plans.id);
      data.append(`plans[${index}][title]`, plans.title);
      data.append(`plans[${index}][document]`, plans.document);
    });
  }

  // Check if gallery_images is defined and an array before using forEach
  if (Array.isArray(documents)) {
    documents.forEach((image, index) => {
      data.append(`documents[${index}]`, image);
    });
  }
  // Check if gallery_images is defined and an array before using forEach
  if (Array.isArray(gallery_images)) {
    gallery_images.forEach((image, index) => {
      data.append(`gallery_images[${index}]`, image);
    });
  }

  const res = await api.post(apiEndpoints.POST_PROJECT, data);
  return res.data;
};

// 57. Get Interested Users
export const getInterestedUsersApi = async ({
  property_id = "",
  slug_id = "",
  limit = "",
  offset = "",
}) => {
  const params = getFilteredParams({ property_id, slug_id, limit, offset });
  const res = await api.get(apiEndpoints.GET_INTERESTED_USERS, { params });
  return res.data;
};

// 58. Get Agent Properties
export const getAgentPropertiesApi = async ({
  is_admin = "",
  slug_id = "",
  search = "",
  is_projects = "",
  limit = "",
  offset = "",
  filters
}) => {
  const params = getFilteredParams({
    is_admin,
    slug_id,
    is_projects,
    limit,
    offset,
    search,
    filters
  });
  const res = await api.get(apiEndpoints.AGENT_PROPERTIES, { params });
  return res.data;
};

// 59. Get Chat Lists
export const getChatListsApi = async () => {
  const res = await api.get(apiEndpoints.GET_CHATS);
  return res.data;
};

// 60. Get Chat Messages
export const getChatMessagesApi = async ({
  user_id = "",
  property_id = "",
  page = "",
  per_page = "",
}) => {
  const params = getFilteredParams({ user_id, property_id, page, per_page });
  const res = await api.get(apiEndpoints.GET_CHATS_MESSAGES, { params });
  return res.data;
};

// 61. Send Message
export const sendMessageApi = async ({
  sender_id = "",
  receiver_id = "",
  message = "",
  property_id = "",
  file = null,
  audio = null,
}) => {
  const formData = createFilteredFormData({
    sender_id,
    receiver_id,
    message,
    property_id,
    file,
    audio,
  });

  const res = await api.post(apiEndpoints.SEND_MESSAGE, formData);
  return res.data;
};

// 62. Delete Chat
export const deleteChatApi = async ({
  message_id = "",
  sender_id = "",
  receiver_id = "",
  property_id = "",
}) => {
  const formData = createFilteredFormData({
    message_id,
    sender_id,
    receiver_id,
    property_id,
  });
  const res = await api.post(apiEndpoints.DELETE_MESSAGES, formData);
  return res.data;
};

// 63. Block User
export const blockUserApi = async ({
  to_user_id = "",
  to_admin = "",
  reason = "",
}) => {
  const formData = createFilteredFormData({
    to_user_id,
    to_admin,
    reason,
  });
  const res = await api.post(apiEndpoints.BLOCK_USER, formData);
  return res.data;
};

// 64. Unblock User
export const unblockUserApi = async ({
  to_user_id = "",
  to_admin = "",
  reason = "",
}) => {
  const formData = createFilteredFormData({
    to_user_id,
    to_admin,
    reason,
  });
  const res = await api.post(apiEndpoints.UNBLOCK_USER, formData);
  return res.data;
};

// 65. Interested Property
export const interestedPropertyApi = async ({
  property_id = "",
  type = "",
}) => {
  const formData = createFilteredFormData({
    property_id,
    type,
  });
  const res = await api.post(apiEndpoints.INTEREST_PROPERTY, formData);
  return res.data;
};

// 66. Get Report Reasons
export const getReportReasonsApi = async () => {
  const res = await api.get(apiEndpoints.GET_REPORT_REASONS);
  return res.data;
};

// 67. Report Property
export const addReportApi = async ({
  reason_id = "",
  property_id = "",
  other_message = "",
}) => {
  let formData = new FormData();
  formData.append("reason_id", reason_id);
  formData.append("property_id", property_id);
  formData.append("other_message", other_message);
  const res = await api.post(apiEndpoints.ADD_REPORT, formData);
  return res.data;
};

// 68. Mortgage Caculation PAI
export const mortgageCalculationApi = async ({
  loan_amount = "",
  down_payment = "",
  interest_rate = "",
  loan_term_years = "",
  show_all_details = "",
}) => {
  const params = {
    loan_amount,
    down_payment,
    interest_rate,
    loan_term_years,
    show_all_details,
  };
  const res = await api.get(apiEndpoints.MORTGAGE_CALCULATOR, { params });
  return res.data;
};

// 69. GET ALL SIMILAR PROPERTIES
export const getAllSimilarPropertiesApi = async ({
  property_id = "",
  limit = "",
  offset = "",
  search = "",
}) => {
  const params = { property_id, limit, offset, search };
  const res = await api.get(apiEndpoints.GET_ALL_SIMILAR_PROPERTIES, {
    params,
  });
  return res.data;
};

// 70. Compare Properties API
export const comparePropertiesAPI = async ({
  source_property_id = "",
  target_property_id = "",
}) => {
  const params = {
    source_property_id,
    target_property_id,
  };
  const res = await api.get(apiEndpoints.COMPARE_PROPERTIES, { params });
  return res.data;
};

// 71. Get User Personalized Feeds
export const getUserPersonalizedFeedsApi = async ({ limit, offset }) => {
  const params = { limit, offset };
  const res = await api.get(apiEndpoints.GET_USER_RECOMMENDATION, { params });
  return res.data;
};

// 72. Get Property On Map
export const getPropertyOnMapApi = async ({
  filters = "",
}) => {
  const data = {
    filters,
  };
  const params = getFilteredParams(data);
  const res = await api.get(apiEndpoints.GET_PROPERTY_ON_MAP, { params });
  return res.data;
};


// 73. Get User Profile
export const getUserProfileApi = async () => {
  const res = await api.get(apiEndpoints.GET_USER_DATA);
  return res.data;
};

// 74. Get Agent Profile
export const fetchAgentProfileApi = async () => {
  const res = await api.get(apiEndpoints.GET_AGENT_PROFILE);
  return res.data;
};

// 75. Get Amenities and Nearby Place data for filter
export const getAdvancedFilterDataApi = async () => {
  const res = await api.get(apiEndpoints.GET_ADVANCE_PROPERTY_FILTER);
  return res.data;
};


// Geocoding → Converting a place name, city, address, or landmark into geographic coordinates (latitude & longitude).
// Example: "New York City" → (40.7128, -74.0060)

// Reverse Geocoding → Converting latitude & longitude back into a human-readable location (city, street, country, etc.).
// Example: (40.7128, -74.0060) → "New York City, NY, USA"

const buildAddressComponentsFromPlace = (place = {}) => {
  const components = [];

  if (place.city) {
    components.push({ long_name: place.city, short_name: place.city, types: ["locality"] });
  }
  if (place.state) {
    components.push({ long_name: place.state, short_name: place.state, types: ["administrative_area_level_1"] });
  }
  if (place.country) {
    components.push({ long_name: place.country, short_name: place.country, types: ["country"] });
  }

  return components;
};

const normalizeMapDetailsResponse = (response) => {
  const result = response?.data?.result;
  if (!result) return response;

  const formattedAddress = result.formatted_address || result.address || "";
  const normalizedResult = {
    ...result,
    formatted_address: formattedAddress,
    address_components: result.address_components?.length
      ? result.address_components
      : buildAddressComponentsFromPlace(result),
    geometry: result.geometry || {
      location: {
        lat: Number(result.lat || result.latitude),
        lng: Number(result.lng || result.longitude),
      },
    },
  };

  return {
    ...response,
    data: {
      ...response.data,
      result: normalizedResult,
    },
  };
};

// 76. Get Map Places List
export const getMapPlacesListApi = async ({
  input = "",
  provider = getActiveMapServiceProvider()
}) => {
  const params = { input };
  const endpoint = provider === MAP_SERVICE_PROVIDERS.OPEN_STREET_MAPS
    ? apiEndpoints.GET_OSM_MAP_PLACES_LIST
    : apiEndpoints.GET_MAP_PLACES_LIST;
  const res = await api.get(endpoint, { params });
  return res.data;
};


// 77. Get Place Detail
export const getMapDetailsApi = async ({
  latitude = "",
  longitude = "",
  place_id = "",
  provider = getActiveMapServiceProvider()
}) => {
  const params = getFilteredParams({
    latitude,
    longitude,
    place_id
  });
  const endpoint = provider === MAP_SERVICE_PROVIDERS.OPEN_STREET_MAPS
    ? apiEndpoints.GET_OSM_MAP_PLACE_DETAILS
    : apiEndpoints.GET_MAP_PLACE_DETAILS;
  const res = await api.get(endpoint, { params });
  return normalizeMapDetailsResponse(res.data);
};


// 77. GET AGENT APPOINTMENT BOOKING PREFERENCES
export const getAgentAppointmentBookingPreferencesApi = async () => {
  const res = await api.get(apiEndpoints.GET_APPOINTMENT_BOOKING_PREFERENCES);
  return res.data;
};


// 78. POST Agent Appointment Booking Preferences
export const postAgentAppointmentBookingPreferencesApi = async ({
  meeting_duration_minutes = 0,
  lead_time_minutes = 0,
  buffer_time_minutes = 0,
  auto_confirm = 0,
  cancel_reschedule_buffer_minutes = 0,
  auto_cancel_after_minutes = 0,
  auto_cancel_message = "",
  daily_booking_limit = 0,
  availability_types = "",
  anti_spam_enabled = 0,
  timezone = ""
}) => {

  const formData = createFilteredFormData({
    meeting_duration_minutes,
    lead_time_minutes,
    buffer_time_minutes,
    auto_confirm,
    cancel_reschedule_buffer_minutes,
    auto_cancel_after_minutes,
    auto_cancel_message,
    daily_booking_limit,
    availability_types,
    anti_spam_enabled,
    timezone
  });
  const res = await api.post(apiEndpoints.POST_APPOINTMENT_BOOKING_PREFERENCES, formData);
  return res.data;
};

// 79. GET Agent Time Schedule
export const getAgentTimeScheduleApi = async () => {
  const res = await api.get(apiEndpoints.GET_AGENT_TIME_SCHEDULE);
  return res.data;
};

// 80. POST Agent Time Schedule
export const postAgentTimeScheduleApi = async ({ schedule = {}, deletedSlots = [] }) => {
  const formData = new FormData();

  // Handle compressed schedule format
  // Expected format: { "0": { id: "", day: "monday", start_time: "09:00", end_time: "12:30" }, ... }
  if (typeof schedule === 'object' && schedule !== null) {
    Object.keys(schedule).forEach((index) => {
      const scheduleItem = schedule[index];

      // Add ID only if it exists and is not empty
      if (scheduleItem.id && scheduleItem.id !== '') {
        formData.append(`schedule[${index}][id]`, scheduleItem.id);
      }

      // Add required fields
      formData.append(`schedule[${index}][day]`, scheduleItem.day);
      formData.append(`schedule[${index}][start_time]`, scheduleItem.start_time);
      formData.append(`schedule[${index}][end_time]`, scheduleItem.end_time);
    });
  }
  // Pass deletedSlots as an array if it exists and is a non-empty array
  if (deletedSlots && Array.isArray(deletedSlots) && deletedSlots.length > 0) {
    deletedSlots.forEach((slotId, index) => {
      if (slotId !== null && slotId !== undefined && slotId !== '') {
        formData.append(`deleted_ids[${index}]`, slotId);
      }
    });
  }


  const res = await api.post(apiEndpoints.POST_SET_AGENT_TIME_SCHEDULE, formData);
  return res.data;
};

// 81. Get Month Wise Time Schedules
export const getMonthWiseTimeSchedulesApi = async ({
  month = "",
  year = "",
  agent_id = ""
}) => {
  const params = getFilteredParams({
    month,
    year,
    agent_id
  });
  const res = await api.get(apiEndpoints.GET_MONTH_WISE_TIME_SLOTS, { params });
  return res.data;
};

// 82. Get Extra Time Slots API
export const getExtraTimeSlotsApi = async () => {
  const res = await api.get(apiEndpoints.GET_EXTRA_TIME_SLOTS);
  return res.data;
};

// 83. Post Extra Time Slots API
export const postExtraTimeSlotsApi = async ({
  extraTimeSlots = [],
  date = ""
}) => {
  const formData = new FormData();
  extraTimeSlots.forEach((extraTimeSlot, index) => {
    if (extraTimeSlot.id && !String(extraTimeSlot.id)?.includes("new-")) {
      formData.append(`extra_time_slots[${index}][id]`, extraTimeSlot.id);
    }
    formData.append(`extra_time_slots[${index}][date]`, date);
    formData.append(`extra_time_slots[${index}][start_time]`, extraTimeSlot.start_time);
    formData.append(`extra_time_slots[${index}][end_time]`, extraTimeSlot.end_time);
    if (extraTimeSlot.reason) {
      formData.append(`extra_time_slots[${index}][reason]`, extraTimeSlot.reason);
    }
  });
  // const formData = createFilteredFormData({
  //   date,
  //   start_time,
  //   end_time,
  //   reason,
  // });
  const res = await api.post(apiEndpoints.MANAGE_EXTRA_TIME_SLOTS, formData);
  return res.data;
};

// 84. Delete Extra Time Slots API
export const deleteExtraTimeSlotsApi = async ({
  removeExtraTimeSlotIds = []
}) => {
  const formData = new FormData();
  if (Array.isArray(removeExtraTimeSlotIds) && removeExtraTimeSlotIds.length > 0) {
    removeExtraTimeSlotIds.forEach((slotId, index) => {
      if (slotId !== null && slotId !== undefined && slotId !== '' && !String(slotId).includes("new-")) {
        formData.append(`slot_ids[${index}]`, slotId);
      }
    });
  }
  const res = await api.post(apiEndpoints.DELETE_EXTRA_TIME_SLOTS, formData);
  return res.data;
};


// 85. Check Agent Booking Availability API
export const checkAgentBookingAvailabilityApi = async ({
  agent_id = "",
  date = "",
  start_time = "",
  end_time = "",
}) => {
  const params = getFilteredParams({
    agent_id,
    date,
    start_time,
    end_time,
  });
  const res = await api.get(apiEndpoints.CHECK_AGENT_APPOINTMENT_AVAILABILITY, { params });
  return res.data;
};


// 86. Book Appointment API
export const bookAppointmentApi = async ({
  property_id,
  meeting_type,
  date,
  start_time,
  end_time,
  notes
}) => {
  const formData = createFilteredFormData({
    property_id,
    meeting_type,
    date,
    start_time,
    end_time,
    notes
  });
  const res = await api.post(apiEndpoints.BOOK_APPOINTMENT, formData);
  return res.data;
};

// AGENT DASHBOARD APIS 
// 87. Get Agent Dashboard Summary
export const getAgentDashboardSummaryApi = async () => {
  const res = await api.get(apiEndpoints.GET_AGENT_DASHBOARD_SUMMARY);
  return res.data;
};

// 88. Get Agent Dashboard Listings 
export const getAgentDashboardListingsApi = async ({ type, range }) => {
  const params = getFilteredParams({
    type,
    range
  });
  const res = await api.get(apiEndpoints.GET_AGENT_DASHBOARD_LISTINGS, { params });
  return res.data;
};

// 89 Get Agent Dashboard Most Viewed Category
export const getAgentDashboardMostViewedCategoryApi = async ({ range }) => {
  const params = getFilteredParams({
    range
  });
  const res = await api.get(apiEndpoints.GET_AGENT_DASHBOARD_MOST_VIEWED_CATEGORY, { params });
  return res.data;
};

// 90 Get Agent Dashboard Active Packages 
export const getAgentDashboardActivePackagesApi = async () => {
  const res = await api.get(apiEndpoints.GET_AGENT_DASHBOARD_ACTIVE_PACKAGES);
  return res.data;
};

// 91 Get Agent Dashboard Most Viewed Listing
export const getAgentDashboardMostViewedListingApi = async ({ type, range }) => {
  const params = getFilteredParams({
    type,
    range
  });
  const res = await api.get(apiEndpoints.GET_AGENT_DASHBOARD_MOST_VIEWED_LISTING, { params });
  return res.data;
};

// 92. Get Agent Dashboard Appointments
export const getAgentDashboardAppointmentsApi = async ({ range, offset, limit }) => {
  const params = getFilteredParams({
    range,
    offset,
    limit
  });
  const res = await api.get(apiEndpoints.GET_AGENT_DASHBOARD_APPOINTMENTS, { params });
  return res.data;
};

// 93. Get User Appointments
export const getUserAppointmentsApi = async ({
  limit = "",
  offset = "",
  status = "",
  date_filter = "",
  meeting_type = ""
}) => {
  const params = getFilteredParams({
    limit,
    offset,
    status,
    date_filter,
    meeting_type
  });
  const res = await api.get(apiEndpoints.GET_USER_APPOINTMENTS, { params });
  return res.data;
};

// 94. Get Appointment Details
export const getAgentAppointmentsApi = async ({
  limit = "",
  offset = "",
  status = "",
  date_filter = "",
  meeting_type = ""
}) => {
  const params = getFilteredParams({
    limit,
    offset,
    status,
    date_filter,
    meeting_type
  });
  const res = await api.get(apiEndpoints.GET_AGENT_APPOINTMENTS, { params });
  return res.data;
};


// 95. Update Appointment Status
export const updateAppointmentStatusApi = async ({
  appointment_id = "",
  status = "",
  reason = "",
  date,
  start_time = "",
  end_time = "",
  meeting_type = ""
}) => {
  const formData = createFilteredFormData({
    appointment_id,
    status,
    reason,
    date,
    start_time,
    end_time,
    meeting_type
  });
  const res = await api.post(apiEndpoints.UPDATE_APPOINTMENT_STATUS, formData);
  return res.data;
};

// 96. Report User API
export const reportUserApi = async ({
  user_id = "",
  reason = "",
}) => {
  const formData = createFilteredFormData({
    user_id,
    reason,
  });
  const res = await api.post(apiEndpoints.APPOINTMENT_REPORT_USER, formData);
  return res.data;
};

// 97. Update meeting type API 
export const updateMeetingTypeApi = async ({
  appointment_id = "",
  meeting_type = ""
}) => {
  const formData = createFilteredFormData({
    appointment_id,
    meeting_type
  });
  const res = await api.post(apiEndpoints.UPDATE_APPOINTMENT_MEETING_TYPE, formData);
  return res.data;
};

// 98. GET Homepage Properties on map section
export const getHomepagePropertiesOnMapSectionApi = async ({
  latitude,
  longitude,
  radius
}) => {
  const params = getFilteredParams({
    latitude,
    longitude,
    radius
  });
  const res = await api.get(apiEndpoints.GET_HOMEPAGE_PROPERTIES_ON_MAP_SECTION, { params });
  return res.data;
};

// 99. GET Homepage Property By Cities Section
export const getHomepagePropertyByCitiesSectionApi = async () => {
  const res = await api.get(apiEndpoints.GET_HOMEPAGE_PROPERTIES_BY_CITIES_SECTION);
  return res.data;
};

// 100. GET Ad Banners
/**
 * Fetch Ad Banners
 * @param {Object} params - Query parameters
 * @param {"homepage"|"property_detail"|"property_listing"} params.page - Page identifier. Expected values: "homepage", "property_details" and "project_details"
 * @param {"web"} params.platform - Platform type. Expected values: "web" | "mobile"
 * @returns {Promise<Object>} - Ad Banners data
 */
export const getAdBannerApi = async ({
  page = "",
  platform = "web"
}) => {
  const res = await api.get(apiEndpoints.GET_AD_BANNERS, { params: { page, platform } });
  return res.data;
}

// 101. GET - Check Phone no. password exists
/**
 * @param {Object} param - Query params
 * @param {string} param.mobile - Mobile number
 * @param {string} param.country_code - Country code
 * @returns {Promise<Object>} - API response
 */
export const checkPhoneNoPasswordExistsApi = async ({
  mobile = "",
  country_code = ""
}) => {
  const params = getFilteredParams({
    mobile,
    country_code
  });
  const res = await api.get(apiEndpoints.GET_CHECK_NUMBER_PASSWORD_EXISTS, { params });
  return res.data;
}

// 102. Update Phone no. password

export const updatePhoneNoPasswordApi = async ({
  firebase_id = "",
  mobile = "",
  country_code = "",
  password = "",
  re_password = ""
}) => {
  const formData = createFilteredFormData({
    firebase_id,
    mobile,
    country_code,
    password,
    re_password
  });
  const res = await api.post(apiEndpoints.UPDATE_PHONE_PASSWORD, formData);
  return res.data;
};

// 102b. Update Email Password
export const updateEmailPasswordApi = async ({
  email = "",
  password = "",
  re_password = ""
}) => {
  const formData = createFilteredFormData({
    email,
    password,
    re_password
  });
  const res = await api.post(apiEndpoints.UPDATE_EMAIL_PASSWORD, formData);
  return res.data;
};

// 103
export const getAboutUsApi = async () => {
  const res = await api.get(apiEndpoints.GET_ABOUT_US);
  return res.data;
}

// 104
export const getTermsAndConditionsApi = async () => {
  const res = await api.get(apiEndpoints.GET_TERMS_AND_CONDITIONS);
  return res.data;
}

// 105
export const getPrivacyPolicyApi = async () => {
  const res = await api.get(apiEndpoints.GET_PRIVACY_POLICY);
  return res.data;
}


// 106. GET Homepage Sections List API
export const getHomepageSectionsApi = async ({ }) => {
  const res = await api.get(apiEndpoints.GET_HOMEPAGE_SECTIONS);
  return res.data;
}

// 107. GET Homepage Property Sections API - nearby_properties, featured_properties, most_viewed_properties, most_liked_properties, premium_properties
export const getHomepagePropertiesSectionApi = async ({
  latitude = "",
  longitude = "",
  radius = ""
}) => {
  const params = getFilteredParams({
    latitude,
    longitude,
    radius
  })
  const res = await api.get(apiEndpoints.GET_HOMEPAGE_PROPERTY_SECTIONS, { params });
  return res.data;
}

// 108. GET Homepage Project Sections API - projects, featured_projects
export const getHomepageProjectsSectionApi = async ({
  latitude = "",
  longitude = "",
  radius = ""
}) => {
  const params = getFilteredParams({
    latitude,
    longitude,
    radius
  })
  const res = await api.get(apiEndpoints.GET_HOMEPAGE_PROJECT_SECTIONS, { params });
  return res.data
}

// 109. GET Homepage Other Sections API - categories, agents, articles, user_recommendations, faqs, slider
export const getHomepageOtherSectionsApi = async ({
  latitude = "",
  longitude = "",
  radius = ""
}) => {
  const params = getFilteredParams({
    latitude,
    longitude,
    radius
  })
  const res = await api.get(apiEndpoints.GET_HOMEPAGE_OTHER_SECTIONS, { params });
  return res.data
}

// 110. Update Notification Language API
export const updateNotificationLanguageApi = async ({
  language_code = ""
}) => {
  const formData = createFilteredFormData({
    language_code
  });
  const res = await api.post(apiEndpoints.UPDATE_NOTIFICATION_LANGUAGE, formData);
  return res.data;
}

// 111. Generate AI Property Description API
export const generateAIPropertyDescriptionApi = async ({
  entity_type = "",
  entity_id = "",
  title = "",
  location = "",
  city = "",
  state = "",
  country = "",
  property_type = "",
  category_id = "",
  language_id = ""
}) => {
  const formData = createFilteredFormData({
    entity_type,
    entity_id,
    title,
    property_type,
    category_id,
    location,
    city,
    state,
    country,
    language_id
  });
  const res = await api.post(apiEndpoints.GENERATE_PROPERTY_DESCRIPTION, formData);
  return res.data;
}

// 112. Generate AI Property Meta
export const generateAIPropertyMetaDataApi = async ({
  entity_type = "",
  entity_id = "",
  title = "",
  location = "",
  city = "",
  state = "",
  country = "",
  price = "",
  language_id = ""
}) => {
  const formData = createFilteredFormData({
    entity_type,
    entity_id,
    title,
    location,
    price,
    city,
    language_id,
    state,
    country
  });
  const res = await api.post(apiEndpoints.GENERATE_PROPERTY_META_DATA, formData);
  return res.data;
}


export const getCustomPagesApi = async ({
  slug_id = "",
  id = "",
  limit = "10",
  offset = ""
}) => {
  const params = getFilteredParams({
    slug_id,
    id,
    limit,
    offset
  })
  const res = await api.get(apiEndpoints.GET_CUSTOM_PAGES, { params });
  return res.data;
}

export const renewListingApi = async ({
  id = "", // property/project id
  type = "" // property/project
}) => {
  const formData = createFilteredFormData({
    id,
    type
  });
  const res = await api.post(apiEndpoints.RENEW_LISTING, formData);
  return res.data;
}

// 29a. Get Agent Verification Form (with form_type)
export const getAgentVerificationFormApi = async ({ form_type = "" }) => {
  const params = getFilteredParams({ form_type });
  const res = await api.get(apiEndpoints.GET_AGENT_VERIFICATION_FORM, { params });
  return res.data;
};


export const getAgentPackagesApi = async ({ }) => {
  const res = await api.get(apiEndpoints.GET_AGENT_PACKAGES);
  return res.data;
}

export const getUserVerificationFieldsApi = async ({ }) => {
  const res = await api.get(apiEndpoints.GET_USER_VERIFICATION_FORM);
  return res.data;
}

export const getUserVerificationValuesApi = async ({ }) => {
  const res = await api.get(apiEndpoints.GET_USER_VERIFICATION_FORM_VALUES);
  return res.data;
}

export const submitUserVerificationApi = async ({ form_fields }) => {
  let data = new FormData();
  // Append the parameters array if it is an array
  if (Array.isArray(form_fields)) {
    form_fields.forEach((field, index) => {
      data.append(`form_fields[${index}][id]`, field.id);
      data.append(`form_fields[${index}][value]`, field.value);
    });
  }
  const res = await api.post(apiEndpoints.APPLY_USER_VERIFICATION, data);
  return res.data;
}

export const activateListingApi = async ({ id = "", listing_type = "" }) => {
  const formData = createFilteredFormData({
    id, // property_id or project_id based on listing_type
    listing_type // property or project
  });
  const res = await api.post(apiEndpoints.ACTIVATE_LISTING, formData);
  return res.data;
}

export const getAgentWatermarkSettingsApi = async ({ }) => {
  const res = await api.get(apiEndpoints.GET_AGENT_WATERMARK_SETTINGS);
  return res.data;
}

/**
 * Updates agent watermark settings.
 *
 * @typedef {Object} WatermarkSettings
 * @property {boolean|number} [watermark_enabled=false] - Whether watermarking is enabled. Use true/false or 1/0.
 * @property {string|number} [watermark_opacity=""] - Watermark opacity (0-100).
 * @property {File|Blob|FormData|string} [watermark_image] - Watermark image file, blob, FormData entry or URL string.
 * @property {string|number} [watermark_size] - Watermark size (0-100).
 * @property {string} [watermark_style=""] - Watermark style: 'tile' or 'single'.
 * @property {string} [watermark_position=""] - Watermark position: 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'.
 * @property {string|number} [watermark_rotation=""] - Watermark rotation (0-360).
 *
 * @param {WatermarkSettings} params - Watermark settings.
 * @returns {Promise<Object>} API response data.
 */
export const updateAgentWatermarkSettingsApi = async ({
  watermark_enabled = false, // true or false
  watermark_opacity = "", // 0 to 100
  watermark_image,
  watermark_size, // 0 to 100
  watermark_style = "", // tile, single
  watermark_position = "", //top-left, top-right, bottom-left, bottom-right, center
  watermark_rotation = "" // 0 to 360
}) => {
  const formData = createFilteredFormData({
    watermark_enabled: watermark_enabled ? 1 : 0, // Convert boolean to 1 or 0
    watermark_opacity,
    watermark_image,
    watermark_size,
    watermark_style,
    watermark_position,
    watermark_rotation
  });
  const res = await api.post(apiEndpoints.UPDATE_AGENT_WATERMARK_SETTINGS, formData);
  return res.data;
}

// Agent Stories APIs
export const getStoriesApi = async ({
  limit = "",
  offset = "",
  category_id = "",
  agent_id = "",
  property_id = "",
  project_id = "",
}) => {
  const params = getFilteredParams({
    limit,
    offset,
    category_id,
    agent_id,
    property_id,
    project_id,
  });
  const res = await api.get(apiEndpoints.GET_STORIES, { params });
  return res.data;
};

export const uploadStoryApi = async ({
  media,
  media_type,
  entity_type,
  entity_id,
  thumbnail,
  duration_seconds,
}) => {
  const formData = createFilteredFormData({
    media,
    media_type,
    entity_type,
    entity_id,
    thumbnail,
    duration_seconds,
  });
  const res = await api.post(apiEndpoints.UPLOAD_STORY, formData);
  return res.data;
};

export const storyViewApi = async ({ story_id }) => {
  const formData = createFilteredFormData({ story_id });
  const res = await api.post(apiEndpoints.STORY_VIEW, formData);
  return res.data;
};

export const getMyStoriesApi = async () => {
  const res = await api.get(apiEndpoints.MY_STORIES);
  return res.data;
};

export const deleteStoryApi = async ({ story_id }) => {
  const params = getFilteredParams({ story_id });
  const res = await api.delete(apiEndpoints.DELETE_STORY, { params });
  return res.data;
};

// OpenImmo Import Gateway
export const getOpenImmoConnectionApi = async () => (await api.get(apiEndpoints.OPENIMMO_CONNECTION)).data;
export const saveOpenImmoConnectionApi = async (data) => (await api.put(apiEndpoints.OPENIMMO_CONNECTION, data)).data;
export const rotateOpenImmoCredentialsApi = async () => (await api.post(apiEndpoints.OPENIMMO_ROTATE_CREDENTIALS)).data;
export const getOpenImmoImportsApi = async (params = {}) => (await api.get(apiEndpoints.OPENIMMO_IMPORTS, { params })).data;
export const getOpenImmoImportApi = async (id) => (await api.get(`${apiEndpoints.OPENIMMO_IMPORTS}/${id}`)).data;
export const uploadOpenImmoApi = async (file, mode = "dry_run") => { const formData = new FormData(); formData.append("file", file); formData.append("mode", mode); return (await api.post(apiEndpoints.OPENIMMO_IMPORTS, formData)).data; };
export const applyOpenImmoImportApi = async (id) => (await api.post(`${apiEndpoints.OPENIMMO_IMPORTS}/${id}/apply`)).data;
export const deleteOpenImmoImportApi = async (id) => (await api.delete(`${apiEndpoints.OPENIMMO_IMPORTS}/${id}`)).data;
