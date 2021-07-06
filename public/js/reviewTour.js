import axios from 'axios';
import { showAlert } from './alerts';

export const sendReview = async (review, rating, tour) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/reviews/',
      data: {
        review,
        rating,
        tour,
      },
    });

    if (res.data.status === 'sucess') {
      showAlert('success', 'Review sent, thank you!');
      window.setTimeout(() => {
        location.assign('/');
      }, 2000);
    }
  } catch (err) {
    if (err.response.data.message.startsWith('Duplicate'))
      return showAlert('error', 'You already reviewed this tour!');
    showAlert('error', err.response.data.message);
  }
};
