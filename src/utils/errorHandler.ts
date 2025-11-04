import Toast from 'react-native-toast-message';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/inventory';

export function handleApiError(error: unknown): void {
  let message = 'An unexpected error occurred';
  
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiError;
    if (apiError?.message) {
      message = apiError.message;
    } else if (error.message) {
      message = error.message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  Toast.show({
    type: 'error',
    text1: 'Error',
    text2: message,
    position: 'top',
  });
}

export function showSuccessToast(message: string): void {
  Toast.show({
    type: 'success',
    text1: 'Success',
    text2: message,
    position: 'top',
  });
}



