// import { createClient } from 'redis';
// import config from '../config/configSetup';
// const client = createClient({ url: config.REDIS_INSTANCE_URL });
// //const client = createClient();
// client.on('error', (err) => console.log('Redis Client Error'));
// (async () => await client.connect())();
// export class Redis {
//     public async setData(key: string, value: any, expiry: number = 3600) {
//         await client.setEx(key, expiry, value);
//     }
//     public async getData(key: string) {
//         const value = await client.get(key);
//         return value;
//     }
//     public async deleteData(key: string) {
//         await client.del(key);
//     }
//     public async flush() {
//         await client.flushAll();
//     }
// }
