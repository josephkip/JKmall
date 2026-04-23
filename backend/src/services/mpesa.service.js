const axios = require('axios');
const moment = require('moment');

const getAccessToken = async () => {
  const { MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_ENV } = process.env;
  const baseUrl =
    MPESA_ENV === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');

  const response = await axios.get(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });

  return response.data.access_token;
};

const generatePassword = (shortcode, passkey, timestamp) => {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
};

const formatPhone = (phone) => {
  // Convert 07XXXXXXXX or +2547XXXXXXXX to 2547XXXXXXXX
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('254')) return cleaned;
  if (cleaned.startsWith('0')) return `254${cleaned.slice(1)}`;
  if (cleaned.startsWith('7') || cleaned.startsWith('1')) return `254${cleaned}`;
  return cleaned;
};

const initiateSTKPush = async ({ phone, amount, orderId, orderNumber }) => {
  const { MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL, MPESA_ENV } = process.env;
  const baseUrl =
    MPESA_ENV === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

  const timestamp = moment().format('YYYYMMDDHHmmss');
  const password = generatePassword(MPESA_SHORTCODE, MPESA_PASSKEY, timestamp);
  const accessToken = await getAccessToken();
  const formattedPhone = formatPhone(phone);

  const payload = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.ceil(amount),
    PartyA: formattedPhone,
    PartyB: MPESA_SHORTCODE,
    PhoneNumber: formattedPhone,
    CallBackURL: MPESA_CALLBACK_URL,
    AccountReference: orderNumber,
    TransactionDesc: `JKmall Order ${orderNumber}`,
  };

  const response = await axios.post(
    `${baseUrl}/mpesa/stkpush/v1/processrequest`,
    payload,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  return response.data;
};

module.exports = { initiateSTKPush, formatPhone };
