import axios from 'axios';
import { showAlert } from './alerts';

export const updateSettings = async (data) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: '/api/v1/users/updateMe',
      data,
    });

    if (res.data.status === 'sucess') {
      showAlert('success', 'Settings changed!');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
