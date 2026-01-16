import 'dotenv/config';
import mongoose from 'mongoose';
import User from './backend/models/user.js';

async function viewUsers() {
    try {
        console.log('🔍 Connecting to MongoDB...\n');
        console.log('MongoDB URI:', process.env.MONGODB_URI);
        console.log('');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all users
        const users = await User.find();
        
        console.log(`📊 Total Users: ${users.length}\n`);
        console.log('═'.repeat(80));

        if (users.length === 0) {
            console.log('No users found in database.');
        } else {
            users.forEach((user, index) => {
                console.log(`\n👤 User #${index + 1}:`);
                console.log(`   ID: ${user._id}`);
                console.log(`   Name: ${user.name}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Auth Type: ${user.authType}`);
                
                if (user.authType === 'local') {
                    console.log(`   Password: [Hashed] ${user.password ? user.password.substring(0, 20) + '...' : 'N/A'}`);
                } else if (user.authType === 'google') {
                    console.log(`   Google ID: ${user.googleId || 'N/A'}`);
                    console.log(`   Picture: ${user.picture || 'N/A'}`);
                }
                
                console.log(`   Created: ${user.createdAt || 'N/A'}`);
                console.log(`   Updated: ${user.updatedAt || 'N/A'}`);
                console.log('─'.repeat(80));
            });
        }

        console.log('\n✅ Data retrieved successfully!');
        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

viewUsers();
