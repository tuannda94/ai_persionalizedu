/**
 * Centralized error handling utility
 */

export function handleApiError(error, defaultMessage = 'An error occurred') {
  if (!error) {
    return defaultMessage;
  }

  // Network errors
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
  }

  // HTTP errors
  if (error.response) {
    const status = error.response.status;
    const detail = error.response.data?.detail || error.message;

    switch (status) {
      case 401:
        // Don't show message - interceptor will redirect to login
        return null;
      case 403:
        return 'Bạn không có quyền thực hiện thao tác này.';
      case 404:
        return 'Không tìm thấy tài nguyên.';
      case 500:
        return 'Lỗi server. Vui lòng thử lại sau.';
      default:
        return detail || `Lỗi ${status}: ${defaultMessage}`;
    }
  }

  // Other errors
  return error.message || defaultMessage;
}

export function shouldShowError(error) {
  // Don't show error for 401 - interceptor handles it
  if (error?.response?.status === 401) {
    return false;
  }
  return true;
}

