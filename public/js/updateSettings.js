import axios from 'axios';
import { showAlert } from './alerts';

export const updateSettings = async (data) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: 'http://127.0.0.1:8000/api/v1/users/updateMe',
      data,
    });

    if (res.data.status === 'sucess') {
      showAlert('success', 'Settings changed!');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
