"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isVNPaySuccess = exports.parseVNPayAmount = exports.verifyVNPayReturn = exports.buildVNPayUrl = void 0;
const crypto_1 = __importDefault(require("crypto"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const qs_1 = __importDefault(require("qs"));
const VNPAY_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const getConfig = () => {
    const tmnCode = process.env.VNPAY_TMN_CODE;
    const secretKey = process.env.VNPAY_SECRET_KEY;
    if (!tmnCode || !secretKey) {
        throw new Error('Thiếu cấu hình VNPAY_TMN_CODE hoặc VNPAY_SECRET_KEY trong .env');
    }
    return { tmnCode, secretKey };
};
const hmacSha512 = (secret, data) => crypto_1.default.createHmac('sha512', secret).update(Buffer.from(data, 'utf-8')).digest('hex');
/**
 * Build the redirect URL to send to browser.
 * txnRef should uniquely identify this top-up transaction.
 */
const buildVNPayUrl = (params, txnRef) => {
    // Log secret key thực tế để debug
    console.log('VNPAY_SECRET_KEY:', process.env.VNPAY_SECRET_KEY);
    const { tmnCode, secretKey } = getConfig();
    const now = new Date();
    const vnpCreateDate = (0, moment_timezone_1.default)(now).tz('Asia/Ho_Chi_Minh').format('YYYYMMDDHHmmss');
    const vnpExpireDate = (0, moment_timezone_1.default)(now).tz('Asia/Ho_Chi_Minh').add(15, 'minutes').format('YYYYMMDDHHmmss');
    const vnpParams = {
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
    // Sort keys alphabetically (chuẩn VNPay, không encode key)
    function sortObject(obj) {
        const sorted = {};
        Object.keys(obj)
            .sort()
            .forEach((key) => {
            sorted[key] = obj[key];
        });
        return sorted;
    }
    const sortedParams = sortObject(vnpParams);
    // 1. Tạo signData: PHẢI encode value (dấu cách là %20, không phải +)
    let signData = qs_1.default.stringify(sortedParams, { encode: true });
    signData = signData.replace(/\+/g, '%20');
    // 2. Tạo chữ ký
    const signature = hmacSha512(secretKey, signData);
    // 3. Tạo URL cuối cùng (giống hệt signData, chỉ nối thêm chữ ký)
    const vnpUrl = `${VNPAY_URL}?${signData}&vnp_SecureHash=${signature}`;
    // Log để kiểm tra
    console.log('VNPay signData:', signData);
    console.log('VNPay signature:', signature);
    console.log('VNPay URL:', vnpUrl);
    return vnpUrl;
};
exports.buildVNPayUrl = buildVNPayUrl;
/**
 * Validate the response from VNPay.
 * Returns true if checksum is valid.
 */
const verifyVNPayReturn = (query) => {
    const { tmnCode: _tmnCode, secretKey } = getConfig();
    const secureHash = query['vnp_SecureHash'];
    if (!secureHash)
        return false;
    const params = { ...query };
    delete params['vnp_SecureHash'];
    delete params['vnp_SecureHashType'];
    // Sort keys A-Z (chuẩn VNPay, không encode key)
    function sortObject(obj) {
        const sorted = {};
        Object.keys(obj)
            .sort()
            .forEach((key) => {
            sorted[key] = obj[key];
        });
        return sorted;
    }
    const sortedParams = sortObject(params);
    let signData = qs_1.default.stringify(sortedParams, { encode: true });
    signData = signData.replace(/\+/g, '%20');
    const computed = hmacSha512(secretKey, signData);
    return computed.toLowerCase() === secureHash.toLowerCase();
};
exports.verifyVNPayReturn = verifyVNPayReturn;
/** Extract amount in VND from vnp_Amount (divide by 100). */
const parseVNPayAmount = (vnpAmount) => Math.round(Number(vnpAmount) / 100);
exports.parseVNPayAmount = parseVNPayAmount;
/** True if payment was successful. */
const isVNPaySuccess = (responseCode) => responseCode === '00';
exports.isVNPaySuccess = isVNPaySuccess;
