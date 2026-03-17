import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seeds delivery orders near kola.rider@test.com (Surulere, Lagos — 6.5059, 3.3601).
 * Does NOT wipe existing data — only appends new records.
 */
async function main() {
    console.log('🚚 Seeding delivery orders near kola.rider@test.com ...\n');

    // ── Look up existing users ──
    const rider = await prisma.user.findUnique({ where: { email: 'kola.rider@test.com' }, include: { location: true } });
    if (!rider) throw new Error('Rider kola.rider@test.com not found. Run the main seed first.');

    const client1 = await prisma.user.findUnique({ where: { email: 'john.client@test.com' } });
    const client2 = await prisma.user.findUnique({ where: { email: 'sarah.client@test.com' } });
    const pro2    = await prisma.user.findUnique({ where: { email: 'bola.pro@test.com' } });
    const pro1    = await prisma.user.findUnique({ where: { email: 'emeka.pro@test.com' } });

    if (!client1 || !client2 || !pro2 || !pro1) throw new Error('Missing test users. Run the main seed first.');

    const riderLat = 6.5059;
    const riderLng = 3.3601;

    console.log(`  Rider location: ${riderLat}, ${riderLng} (Surulere, Lagos)`);

    // ── Get an existing category for new products ──
    const category = await prisma.category.findFirst();
    if (!category) throw new Error('No categories found. Run the main seed first.');

    // ── Nearby locations (all within ~1-8 km of rider) ──
    const nearbyLocations = [
        { address: '10 Bode Thomas Street, Surulere',      lga: 'Surulere',    state: 'Lagos', lat: 6.5010, lng: 3.3560 }, // ~0.6 km
        { address: '3 Adeniran Ogunsanya, Surulere',        lga: 'Surulere',    state: 'Lagos', lat: 6.4980, lng: 3.3555 }, // ~1.0 km
        { address: '25 Akerele Street, Surulere',           lga: 'Surulere',    state: 'Lagos', lat: 6.5120, lng: 3.3630 }, // ~0.8 km
        { address: '7 Adelabu Street, Surulere',            lga: 'Surulere',    state: 'Lagos', lat: 6.5150, lng: 3.3510 }, // ~1.3 km
        { address: '42 Ogunlana Drive, Surulere',           lga: 'Surulere',    state: 'Lagos', lat: 6.5000, lng: 3.3650 }, // ~0.8 km
        { address: '15 Masha Road, Surulere',               lga: 'Surulere',    state: 'Lagos', lat: 6.5090, lng: 3.3570 }, // ~0.5 km
        { address: '8 Lawanson Road, Surulere',             lga: 'Surulere',    state: 'Lagos', lat: 6.5200, lng: 3.3530 }, // ~1.7 km
        { address: '33 Western Avenue, Surulere',           lga: 'Surulere',    state: 'Lagos', lat: 6.5050, lng: 3.3510 }, // ~1.0 km
        { address: '12 Itire Road, Surulere',               lga: 'Surulere',    state: 'Lagos', lat: 6.5180, lng: 3.3480 }, // ~1.8 km
        { address: '5 Iponri Street, Surulere',             lga: 'Surulere',    state: 'Lagos', lat: 6.4920, lng: 3.3700 }, // ~1.8 km
    ];

    // ── Dropoff locations (within 3-8 km — delivery destinations) ──
    const dropoffLocations = [
        { address: '20 Herbert Macaulay, Yaba',             lga: 'Yaba',        state: 'Lagos', lat: 6.5170, lng: 3.3780 }, // ~2.3 km
        { address: '5 Ojuelegba Road, Yaba',                lga: 'Yaba',        state: 'Lagos', lat: 6.5190, lng: 3.3700 }, // ~1.7 km
        { address: '14 Apapa Road, Ebute-Metta',            lga: 'Mainland',    state: 'Lagos', lat: 6.4850, lng: 3.3800 }, // ~3.0 km
        { address: '8 National Stadium, Surulere',          lga: 'Surulere',    state: 'Lagos', lat: 6.4960, lng: 3.3610 }, // ~1.1 km
        { address: '30 Toyin Street, Ikeja',                lga: 'Ikeja',       state: 'Lagos', lat: 6.6010, lng: 3.3580 }, // ~10.6 km
        { address: '2 Awolowo Road, Ikoyi',                 lga: 'Eti-Osa',     state: 'Lagos', lat: 6.4500, lng: 3.4200 }, // ~8.5 km
    ];

    // ── Products near the rider (sellers are nearby) ──
    const sellerLocClient1 = await prisma.location.findFirst({ where: { userId: client1.id } });
    const sellerLocPro2    = await prisma.location.findFirst({ where: { userId: pro2.id } });

    // Create pickup locations for new products
    const pickupLoc1 = await prisma.location.create({
        data: { userId: client1.id, address: nearbyLocations[0].address, lga: nearbyLocations[0].lga, state: nearbyLocations[0].state, latitude: nearbyLocations[0].lat, longitude: nearbyLocations[0].lng }
    });
    const pickupLoc2 = await prisma.location.create({
        data: { userId: pro2.id, address: nearbyLocations[1].address, lga: nearbyLocations[1].lga, state: nearbyLocations[1].state, latitude: nearbyLocations[1].lat, longitude: nearbyLocations[1].lng }
    });
    const pickupLoc3 = await prisma.location.create({
        data: { userId: client2.id, address: nearbyLocations[2].address, lga: nearbyLocations[2].lga, state: nearbyLocations[2].state, latitude: nearbyLocations[2].lat, longitude: nearbyLocations[2].lng }
    });
    const pickupLoc4 = await prisma.location.create({
        data: { userId: pro1.id, address: nearbyLocations[3].address, lga: nearbyLocations[3].lga, state: nearbyLocations[3].state, latitude: nearbyLocations[3].lat, longitude: nearbyLocations[3].lng }
    });
    const pickupLoc5 = await prisma.location.create({
        data: { userId: client1.id, address: nearbyLocations[4].address, lga: nearbyLocations[4].lga, state: nearbyLocations[4].state, latitude: nearbyLocations[4].lat, longitude: nearbyLocations[4].lng }
    });
    const pickupLoc6 = await prisma.location.create({
        data: { userId: pro2.id, address: nearbyLocations[5].address, lga: nearbyLocations[5].lga, state: nearbyLocations[5].state, latitude: nearbyLocations[5].lat, longitude: nearbyLocations[5].lng }
    });

    console.log('✅ Pickup locations created');

    // ── Products ──
    const prod1 = await prisma.product.create({
        data: { name: 'iPhone 13 Pro Max', description: '256GB, Pacific Blue, excellent condition', price: 350000, quantity: 3, weightPerUnit: 0.24, images: 'https://placehold.co/400x400?text=iPhone13', approved: true, categoryId: category.id, userId: client1.id, locationId: pickupLoc1.id }
    });
    const prod2 = await prisma.product.create({
        data: { name: 'DeWalt Impact Wrench', description: 'Cordless 20V MAX, 1/2 inch drive', price: 68000, quantity: 4, weightPerUnit: 2.3, images: 'https://placehold.co/400x400?text=DeWalt', approved: true, categoryId: category.id, userId: pro2.id, locationId: pickupLoc2.id }
    });
    const prod3 = await prisma.product.create({
        data: { name: 'Sony WH-1000XM5 Headphones', description: 'Noise cancelling wireless headphones', price: 195000, quantity: 6, weightPerUnit: 0.25, images: 'https://placehold.co/400x400?text=Sony+XM5', approved: true, categoryId: category.id, userId: client2.id, locationId: pickupLoc3.id }
    });
    const prod4 = await prisma.product.create({
        data: { name: 'MacBook Air M2', description: '8GB RAM, 256GB SSD, Midnight', price: 720000, quantity: 2, weightPerUnit: 1.24, images: 'https://placehold.co/400x400?text=MacBook', approved: true, categoryId: category.id, userId: pro1.id, locationId: pickupLoc4.id }
    });
    const prod5 = await prisma.product.create({
        data: { name: 'Anker Power Bank 20000mAh', description: 'Fast charging USB-C portable charger', price: 18000, quantity: 15, weightPerUnit: 0.35, images: 'https://placehold.co/400x400?text=Anker', approved: true, categoryId: category.id, userId: client1.id, locationId: pickupLoc5.id }
    });
    const prod6 = await prisma.product.create({
        data: { name: 'Milwaukee Tool Set 28pc', description: 'Professional ratchet and socket set', price: 42000, quantity: 8, weightPerUnit: 3.5, images: 'https://placehold.co/400x400?text=Milwaukee', approved: true, categoryId: category.id, userId: pro2.id, locationId: pickupLoc6.id }
    });

    console.log('✅ Products created');

    // ── Dropoff locations (buyer delivery destinations) ──
    const dropLoc1 = await prisma.location.create({
        data: { userId: client2.id, address: dropoffLocations[0].address, lga: dropoffLocations[0].lga, state: dropoffLocations[0].state, latitude: dropoffLocations[0].lat, longitude: dropoffLocations[0].lng }
    });
    const dropLoc2 = await prisma.location.create({
        data: { userId: client1.id, address: dropoffLocations[1].address, lga: dropoffLocations[1].lga, state: dropoffLocations[1].state, latitude: dropoffLocations[1].lat, longitude: dropoffLocations[1].lng }
    });
    const dropLoc3 = await prisma.location.create({
        data: { userId: pro1.id, address: dropoffLocations[2].address, lga: dropoffLocations[2].lga, state: dropoffLocations[2].state, latitude: dropoffLocations[2].lat, longitude: dropoffLocations[2].lng }
    });
    const dropLoc4 = await prisma.location.create({
        data: { userId: client1.id, address: dropoffLocations[3].address, lga: dropoffLocations[3].lga, state: dropoffLocations[3].state, latitude: dropoffLocations[3].lat, longitude: dropoffLocations[3].lng }
    });
    const dropLoc5 = await prisma.location.create({
        data: { userId: client2.id, address: dropoffLocations[4].address, lga: dropoffLocations[4].lga, state: dropoffLocations[4].state, latitude: dropoffLocations[4].lat, longitude: dropoffLocations[4].lng }
    });
    const dropLoc6 = await prisma.location.create({
        data: { userId: pro1.id, address: dropoffLocations[5].address, lga: dropoffLocations[5].lga, state: dropoffLocations[5].state, latitude: dropoffLocations[5].lat, longitude: dropoffLocations[5].lng }
    });

    console.log('✅ Dropoff locations created');

    // ── Product Transactions (all delivery method, paid) ──
    const now = new Date();
    const ptx1 = await prisma.productTransaction.create({
        data: { productId: prod1.id, buyerId: client2.id, sellerId: client1.id, quantity: 1, price: 350000, status: 'pt_ordered', orderMethod: 'delivery', date: new Date(now.getTime() - 30 * 60000) }
    });
    const ptx2 = await prisma.productTransaction.create({
        data: { productId: prod2.id, buyerId: client1.id, sellerId: pro2.id, quantity: 1, price: 68000, status: 'pt_ordered', orderMethod: 'delivery', date: new Date(now.getTime() - 25 * 60000) }
    });
    const ptx3 = await prisma.productTransaction.create({
        data: { productId: prod3.id, buyerId: pro1.id, sellerId: client2.id, quantity: 2, price: 390000, status: 'pt_ordered', orderMethod: 'delivery', date: new Date(now.getTime() - 20 * 60000) }
    });
    const ptx4 = await prisma.productTransaction.create({
        data: { productId: prod4.id, buyerId: client1.id, sellerId: pro1.id, quantity: 1, price: 720000, status: 'pt_ordered', orderMethod: 'delivery', date: new Date(now.getTime() - 15 * 60000) }
    });
    const ptx5 = await prisma.productTransaction.create({
        data: { productId: prod5.id, buyerId: client2.id, sellerId: client1.id, quantity: 3, price: 54000, status: 'pt_ordered', orderMethod: 'delivery', date: new Date(now.getTime() - 10 * 60000) }
    });
    const ptx6 = await prisma.productTransaction.create({
        data: { productId: prod6.id, buyerId: pro1.id, sellerId: pro2.id, quantity: 1, price: 42000, status: 'pt_ordered', orderMethod: 'delivery', date: new Date(now.getTime() - 5 * 60000) }
    });

    console.log('✅ Product transactions created');

    // ── Helper: calculate distance in km between two coords ──
    function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    const expiresAt = new Date(now.getTime() + 15 * 60000); // 15 min from now

    // ── ORDER 1: paid — awaiting rider acceptance (iPhone, 2.3 km) ──
    const dist1 = haversine(nearbyLocations[0].lat, nearbyLocations[0].lng, dropoffLocations[0].lat, dropoffLocations[0].lng);
    const order1 = await prisma.order.create({
        data: {
            productTransactionId: ptx1.id, status: 'paid', cost: 500 + dist1 * 100 + 0.24 * 50,
            distance: parseFloat(dist1.toFixed(2)), weight: 0.24,
            deliveryFee: 500 + dist1 * 100 + 0.24 * 50,
            pickupAddress: nearbyLocations[0].address, deliveryAddress: dropoffLocations[0].address,
            locationId: dropLoc1.id, expiresAt,
        }
    });

    // ── ORDER 2: paid — awaiting rider acceptance (DeWalt, 1.7 km) ──
    const dist2 = haversine(nearbyLocations[1].lat, nearbyLocations[1].lng, dropoffLocations[1].lat, dropoffLocations[1].lng);
    const order2 = await prisma.order.create({
        data: {
            productTransactionId: ptx2.id, status: 'paid', cost: 500 + dist2 * 100 + 2.3 * 50,
            distance: parseFloat(dist2.toFixed(2)), weight: 2.3,
            deliveryFee: 500 + dist2 * 100 + 2.3 * 50,
            pickupAddress: nearbyLocations[1].address, deliveryAddress: dropoffLocations[1].address,
            locationId: dropLoc2.id, expiresAt,
        }
    });

    // ── ORDER 3: paid — awaiting rider acceptance (Sony Headphones, 3.0 km) ──
    const dist3 = haversine(nearbyLocations[2].lat, nearbyLocations[2].lng, dropoffLocations[2].lat, dropoffLocations[2].lng);
    const order3 = await prisma.order.create({
        data: {
            productTransactionId: ptx3.id, status: 'paid', cost: 500 + dist3 * 100 + 0.50 * 50,
            distance: parseFloat(dist3.toFixed(2)), weight: 0.50,
            deliveryFee: 500 + dist3 * 100 + 0.50 * 50,
            pickupAddress: nearbyLocations[2].address, deliveryAddress: dropoffLocations[2].address,
            locationId: dropLoc3.id, expiresAt,
        }
    });

    // ── ORDER 4: accepted — rider already accepted (MacBook, 1.1 km) ──
    const dist4 = haversine(nearbyLocations[3].lat, nearbyLocations[3].lng, dropoffLocations[3].lat, dropoffLocations[3].lng);
    const order4 = await prisma.order.create({
        data: {
            productTransactionId: ptx4.id, status: 'accepted', cost: 500 + dist4 * 100 + 1.24 * 50,
            distance: parseFloat(dist4.toFixed(2)), weight: 1.24,
            deliveryFee: 500 + dist4 * 100 + 1.24 * 50,
            pickupAddress: nearbyLocations[3].address, deliveryAddress: dropoffLocations[3].address,
            locationId: dropLoc4.id, riderId: rider.id, assignedAt: new Date(now.getTime() - 5 * 60000),
        }
    });

    // ── ORDER 5: en_route_to_pickup — rider heading to pickup (Anker, 10.6 km) ──
    const dist5 = haversine(nearbyLocations[4].lat, nearbyLocations[4].lng, dropoffLocations[4].lat, dropoffLocations[4].lng);
    const order5 = await prisma.order.create({
        data: {
            productTransactionId: ptx5.id, status: 'en_route_to_pickup', cost: 500 + dist5 * 100 + 1.05 * 50,
            distance: parseFloat(dist5.toFixed(2)), weight: 1.05,
            deliveryFee: 500 + dist5 * 100 + 1.05 * 50,
            pickupAddress: nearbyLocations[4].address, deliveryAddress: dropoffLocations[4].address,
            locationId: dropLoc5.id, riderId: rider.id, assignedAt: new Date(now.getTime() - 10 * 60000),
        }
    });

    // ── ORDER 6: picked_up — rider picked up item (Milwaukee, 8.5 km) ──
    const dist6 = haversine(nearbyLocations[5].lat, nearbyLocations[5].lng, dropoffLocations[5].lat, dropoffLocations[5].lng);
    const order6 = await prisma.order.create({
        data: {
            productTransactionId: ptx6.id, status: 'picked_up', cost: 500 + dist6 * 100 + 3.5 * 50,
            distance: parseFloat(dist6.toFixed(2)), weight: 3.5,
            deliveryFee: 500 + dist6 * 100 + 3.5 * 50,
            pickupAddress: nearbyLocations[5].address, deliveryAddress: dropoffLocations[5].address,
            locationId: dropLoc6.id, riderId: rider.id, assignedAt: new Date(now.getTime() - 20 * 60000),
        }
    });

    console.log('✅ Delivery orders created');

    // ──────────────────── SUMMARY ────────────────────
    console.log('\n🎉 Delivery order seeding complete!\n');
    console.log('─'.repeat(70));
    console.log('  Rider: kola.rider@test.com  (Surulere — 6.5059, 3.3601)');
    console.log('─'.repeat(70));
    console.log(`  Order #${order1.id}  PAID (awaiting acceptance)  iPhone 13 Pro Max     ${dist1.toFixed(1)} km`);
    console.log(`  Order #${order2.id}  PAID (awaiting acceptance)  DeWalt Impact Wrench  ${dist2.toFixed(1)} km`);
    console.log(`  Order #${order3.id}  PAID (awaiting acceptance)  Sony WH-1000XM5       ${dist3.toFixed(1)} km`);
    console.log(`  Order #${order4.id}  ACCEPTED (assigned rider)   MacBook Air M2        ${dist4.toFixed(1)} km`);
    console.log(`  Order #${order5.id}  EN_ROUTE_TO_PICKUP          Anker Power Bank      ${dist5.toFixed(1)} km`);
    console.log(`  Order #${order6.id}  PICKED_UP                   Milwaukee Tool Set    ${dist6.toFixed(1)} km`);
    console.log('─'.repeat(70));
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
