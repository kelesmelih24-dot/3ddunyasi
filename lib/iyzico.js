import 'server-only';

export const iyzicoAktif = () => Boolean(process.env.IYZICO_API_KEY && process.env.IYZICO_SECRET_KEY);

export async function getIyzipay() {
  const Iyzipay = (await import('iyzipay')).default;
  return new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY,
    secretKey: process.env.IYZICO_SECRET_KEY,
    uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
  });
}

export const promisify = (fn) => new Promise((resolve, reject) => fn((err, result) => (err ? reject(err) : resolve(result))));
