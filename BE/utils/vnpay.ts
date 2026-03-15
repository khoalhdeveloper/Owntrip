import crypto from 'crypto';
import moment from 'moment-timezone';
import qs from 'qs';

export interface VNPayCreateParams {
  amount: number;        // VND
  orderInfo: string;     // plain-text description (no special chars)
  userId: string;
  returnUrl: string;
  ipAddr: string;
  locale?: 'vn' | 'en';
}

export interface VNPayReturnParams {
  [key: string]: string;
}

const VNPAY_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

const getConfig = () => {
  const tmnCode = process.env.VNPAY_TMN_CODE;
  const secretKey = process.env.VNPAY_SECRET_KEY;
  if (!tmnCode || !secretKey) {
    throw new Error('Thiếu cấu hình VNPAY_TMN_CODE hoặc VNPAY_SECRET_KEY trong .env');
  }
  return { tmnCode, secretKey };
};

const hmacSha512 = (secret: string, data: string): string =>
  crypto.createHmac('sha512', secret).update(Buffer.from(data, 'utf-8')).digest('hex');

/**
 * Build the redirect URL to send to browser.
 * txnRef should uniquely identify this top-up transaction.
 */
export const buildVNPayUrl = (params: VNPayCreateParams, txnRef: string): string => {
  const { tmnCode, secretKey } = getConfig();
  const now = new Date();
  const vnpCreateDate = moment(now).tz('Asia/Ho_Chi_Minh').format('YYYYMMDDHHmmss');
  const vnpExpireDate = moment(now).tz('Asia/Ho_Chi_Minh').add(15, 'minutes').format('YYYYMMDDHHmmss');

  const vnpParams: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: params.locale ?? 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: params.orderInfo,
    vnp_OrderType: 'topup',
    vnp_Amount: String(params.amount * 100), // VNPay wants amount * 100
    vnp_ReturnUrl: params.returnUrl,
    vnp_IpAddr: params.ipAddr,
    vnp_CreateDate: vnpCreateDate,
    vnp_ExpireDate: vnpExpireDate
  };

  // Sort keys alphabetically (template chuẩn)
  function sortObject(obj: Record<string, string>) {
    let sorted: Record<string, string> = {};
    let str: string[] = [];
    let key: string;
    for (key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (let i = 0; i < str.length; i++) {
      sorted[decodeURIComponent(str[i])] = obj[decodeURIComponent(str[i])];
    }
    return sorted;
  }

  const sortedParams = sortObject(vnpParams);
  // 1. Tạo signData: PHẢI encode value (dấu cách là %20, không phải +)
  let signData = qs.stringify(sortedParams, { encode: true });
  signData = signData.replace(/\+/g, '%20');
  // 2. Tạo chữ ký
  const signature = hmacSha512(secretKey, signData);
  // 3. Tạo URL cuối cùng (giống hệt signData, chỉ nối thêm chữ ký)
  const vnpUrl = `${VNPAY_URL}?${signData}&vnp_SecureHash=${signature}`;
  // Log để kiểm tra
  console.log('VNPay signData:', signData);
  console.log('VNPay signature:', signature);
  return vnpUrl;
};

/**
 * Validate the response from VNPay.
 * Returns true if checksum is valid.
 */
export const verifyVNPayReturn = (query: VNPayReturnParams): boolean => {
  const { tmnCode: _tmnCode, secretKey } = getConfig();

  const secureHash = query['vnp_SecureHash'];
  if (!secureHash) return false;

  const params = { ...query };
  delete params['vnp_SecureHash'];
  delete params['vnp_SecureHashType'];

  // Sort keys A-Z (dùng template chuẩn)
  function sortObject(obj: Record<string, string>) {
    let sorted: Record<string, string> = {};
    let str: string[] = [];
    let key: string;
    for (key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (let i = 0; i < str.length; i++) {
      sorted[decodeURIComponent(str[i])] = obj[decodeURIComponent(str[i])];
    }
    return sorted;
  }
  const sortedParams = sortObject(params);
  let signData = qs.stringify(sortedParams, { encode: true });
  signData = signData.replace(/\+/g, '%20');
  const computed = hmacSha512(secretKey, signData);
  return computed.toLowerCase() === secureHash.toLowerCase();
};

/** Extract amount in VND from vnp_Amount (divide by 100). */
export const parseVNPayAmount = (vnpAmount: string): number =>
  Math.round(Number(vnpAmount) / 100);

/** True if payment was successful. */
export const isVNPaySuccess = (responseCode: string): boolean => responseCode === '00';
