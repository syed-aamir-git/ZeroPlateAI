import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_NAME || 'ZeroPlate_ai_MVP');

  const email = 'syed.aamir7002@gmail.com';
  const user = await db.collection('user').findOne({ email });

  if (user) {
    await db.collection('user').updateOne(
      { _id: user._id },
      { $set: { role: 'delivery_partner', profileCompleted: true, updatedAt: new Date() } }
    );

    const existingPartner = await db.collection('deliveryPartners').findOne({ userId: user._id });
    if (!existingPartner) {
      await db.collection('deliveryPartners').insertOne({
        userId: user._id,
        name: user.name || 'Syed Aamir',
        email: user.email,
        phone: '+91 70002 30733',
        vehicleType: 'electric_cargo',
        serviceArea: 'Tejaswi Nagar Logistics Hub',
        active: true,
        totalCompleted: 0,
        activeCount: 0,
        createdAt: new Date(),
      });
      console.log('Created delivery partner profile for Syed Aamir');
    } else {
      console.log('Delivery partner profile already exists');
    }
    console.log(`Successfully updated ${email} to role: delivery_partner`);
  } else {
    console.log(`User ${email} not found`);
  }

  await client.close();
}

run().catch(console.error);
