exports.responseMessage = (status, message) => {
  if ( ! message) {
    switch (status) {
      case 200:
        message = 'Success';
        break;
      case 401:
        message = 'Not Authorized';
        break;
      case 404:
        message = 'Not Found';
        break;
      case 422:
        message = 'Required field not provided';
        break;
      case 500:
        message = 'Server Error';
        break;
      default:
        message = null;
        break;
    }
  }

  return {
    status: status,
    message: message
  }
}

exports.responseData = (data) => {
  return {
    data: data
  }
}