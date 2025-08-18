import moment from 'moment';

function formatDate(date) {
  return moment(date).format('YYYY. M. D.');
}

export default formatDate;
