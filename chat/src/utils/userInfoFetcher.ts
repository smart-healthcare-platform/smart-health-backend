import axios from 'axios';

const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:8083';
const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://localhost:8082';

interface UserFullName {
  full_name: string; // Tên trường đúng theo phản hồi API
}

export interface UserInfo {
  userId: string;
  userType: 'doctor' | 'patient';
  fullName: string;
}

// Fetches user's full name by user_id (standard method)
export const fetchUserInfo = async (userId: string, userType: string): Promise<string | null> => {
  try {
    let url = '';
    // Chuyển đổi userType sang chữ.toLowerCase để so sánh
    const normalizedUserType = userType.toLowerCase();

    console.log(`[userInfoFetcher] Attempting to fetch name for userId: ${userId}, userType: ${userType} (normalized: ${normalizedUserType})`);

    if (normalizedUserType === 'doctor') {
      // Thử lấy theo user_id trước
      url = `${DOCTOR_SERVICE_URL}/api/doctors/by-user/${userId}`;
    } else if (normalizedUserType === 'patient') {
      url = `${PATIENT_SERVICE_URL}/api/patients/by-user/${userId}`;
    }

    if (!url) {
      console.error(`[userInfoFetcher] No service URL configured for userType: ${userType} (normalized: ${normalizedUserType})`);
      return null;
    }

    console.log(`[userInfoFetcher] Calling URL: ${url}`);

    let response;
    try {
      response = await axios.get<{ success: boolean, message: string, data: UserFullName, code: number }>(url);
      console.log(`[userInfoFetcher] Response data:`, response.data);
      if (response.data.success && response.data.data && response.data.data.full_name) {
        return response.data.data.full_name;
      } else {
        console.warn(`[userInfoFetcher] API call succeeded but full_name not found or success=false in response for userId ${userId}, userType ${userType}`);
        // Nếu là doctor và không tìm thấy theo user_id, thử tìm theo id
        if (normalizedUserType === 'doctor') {
          console.log(`[userInfoFetcher] Attempting to fetch doctor by ID: ${userId}`);
          url = `${DOCTOR_SERVICE_URL}/api/doctors/${userId}`;
          console.log(`[userInfoFetcher] Calling URL: ${url}`);
          response = await axios.get<{ success?: boolean, message?: string, data?: UserFullName, code?: number, full_name?: string, user_id?: string }>(url);
          console.log(`[userInfoFetcher] Response data for ID:`, response.data);
          // API `/doctors/:id` có thể trả về `full_name` trực tiếp trong `data` hoặc trong `data.full_name` tùy cấu trúc
          // Cấu trúc từ `buildDisplayDoctor` cho thấy `full_name` nằm trong `data` object
          if (response.data && response.data.full_name) {
            return response.data.full_name;
          } else if (response.data && response.data.data && response.data.data.full_name) {
            return response.data.data.full_name;
          } else {
            console.warn(`[userInfoFetcher] Doctor found by ID but full_name not present in response for id ${userId}`);
            return null;
          }
        }
        return null;
      }
    } catch (error: any) {
      console.error(`[userInfoFetcher] Error fetching ${userType} name by ${normalizedUserType === 'doctor' ? 'user_id' : 'user_id'} for ${userId}:`, error.message);
      if (error.response?.status === 404 && normalizedUserType === 'doctor') {
        // Nếu là doctor và lỗi 404 khi tìm theo user_id, thử tìm theo id
        console.log(`[userInfoFetcher] Attempting to fetch doctor by ID: ${userId}`);
        url = `${DOCTOR_SERVICE_URL}/api/doctors/${userId}`;
        console.log(`[userInfoFetcher] Calling URL: ${url}`);
        try {
          response = await axios.get<{ success?: boolean, message?: string, data?: UserFullName, code?: number, full_name?: string, user_id?: string }>(url);
          console.log(`[userInfoFetcher] Response data for ID:`, response.data);
          if (response.data && response.data.full_name) {
            return response.data.full_name;
          } else if (response.data && response.data.data && response.data.data.full_name) {
            return response.data.data.full_name;
          } else {
            console.warn(`[userInfoFetcher] Doctor found by ID but full_name not present in response for id ${userId}`);
            return null;
          }
        } catch (idError: any) {
          console.error(`[userInfoFetcher] Error fetching doctor by ID ${userId}:`, idError.message);
          if (idError.response) {
            console.error(`[userInfoFetcher] Error response data for ID:`, idError.response.data);
            console.error(`[userInfoFetcher] Error response status for ID:`, idError.response.status);
          }
          return null;
        }
      } else {
        // Nếu lỗi khác hoặc không phải doctor, hoặc không tìm thấy theo id, thì log và return null
        if (error.response) {
          console.error(`[userInfoFetcher] Error response data:`, error.response.data);
          console.error(`[userInfoFetcher] Error response status:`, error.response.status);
          console.error(`[userInfoFetcher] Error response headers:`, error.response.headers);
        }
        return null;
      }
    }
  } catch (error: any) { // Lỗi tổng quát nếu có
    console.error(`[userInfoFetcher] General error fetching ${userType} name for userId ${userId}:`, error.message);
    return null;
  }
};

// Fetches user's user_id by their entity ID (for cases where we have doctor.id but need doctor.user_id)
export const fetchUserIdByEntityId = async (entityId: string, userType: string): Promise<string | null> => {
  try {
    let url = '';
    const normalizedUserType = userType.toLowerCase();

    console.log(`[userInfoFetcher] Attempting to fetch user_id for entity ID: ${entityId}, userType: ${userType} (normalized: ${normalizedUserType})`);

    if (normalizedUserType === 'doctor') {
      url = `${DOCTOR_SERVICE_URL}/api/doctors/${entityId}`; // Use /:id endpoint
    } else if (normalizedUserType === 'patient') {
      // Assuming patient service also has /:id endpoint that returns user_id
      url = `${PATIENT_SERVICE_URL}/api/patients/${entityId}`;
    }

    if (!url) {
      console.error(`[userInfoFetcher] No service URL configured for userType: ${userType} (normalized: ${normalizedUserType}) for ID lookup`);
      return null;
    }

    console.log(`[userInfoFetcher] Calling URL for user_id: ${url}`);

    const response = await axios.get<{ success?: boolean, message?: string, data?: { user_id: string }, code?: number, user_id?: string }>(url);
    console.log(`[userInfoFetcher] Response data for user_id:`, response.data);

    // Check if response has user_id at root level or within data object
    if (response.data && response.data.user_id) {
      return response.data.user_id;
    } else if (response.data && response.data.data && response.data.data.user_id) {
      return response.data.data.user_id;
    } else {
      console.warn(`[userInfoFetcher] user_id not found in response for entity ID ${entityId}, userType ${userType}`);
      return null;
    }
  } catch (error: any) {
    console.error(`[userInfoFetcher] Error fetching user_id for entity ID ${entityId} (${userType}):`, error.message);
    if (error.response) {
      console.error(`[userInfoFetcher] Error response data for user_id:`, error.response.data);
      console.error(`[userInfoFetcher] Error response status for user_id:`, error.response.status);
    }
    return null;
  }
};