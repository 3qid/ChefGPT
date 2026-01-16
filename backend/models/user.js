import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: function() {
            return this.authType === 'local';
        }
    },
    authType: {
        type: String,
        enum: ['local', 'google'],
        required: true
    },
    googleId: {
        type: String,
        sparse: true
    },
    picture: {
        type: String
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;
