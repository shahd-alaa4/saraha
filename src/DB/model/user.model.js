import mongoose from "mongoose";
import { GenderEname, ProviderEname, RoleEname } from "../../common/enums/user.enum.js";

const usersSchema = new mongoose.Schema({

    firstName: {
        type: String,
        required: [true, "firstName is"],
        minlength: 2,
        maxlength: 25,
        trim: true
    },

    lastName: {
        type: String,
        required: [true, "lastName is required"],
        minlength: 2,
        maxlength: 25,
        trim: true
    },
    email: {
        type: String,
        required: [true, "email is required"],
        unique: true
    },
    DOB: Date,
    password: {
        type: String,
        required: [true, "password is required"],
    },

    gender: {
        type: Number,
        enum: Object.values(GenderEname),
        default: GenderEname.male
    },

    phone: String,
    provider: {
        type: Number,
        enum: Object.values(ProviderEname),
        default: ProviderEname.System
    },
    provider: {
        type: Number,
        enum: Object.values(RoleEname),
        default: RoleEname.User
    },
    profilePictures: String,
    coverProfilePictures: [String],
    confirmEmail: Date,
    changeCredentialsTime: Date,

    otp: String,
    otpExpire: Date,
    isConfirmed: {
        type: Boolean,
        default: false
    }

},
    {
        collection: "users",
        timestamps: true,
        strict: true,
        strictQuery: true,
        optimisticConcurrency: true,
        //autoIndex: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
)

usersSchema.virtual('userName').set(function (value) {
    const [firstName, lastName] = value?.split(' ') || []
    this.set({ firstName, lastName })
}).get(function () {
    return this.firstName + " " + this.lastName

})

export const userMadel = mongoose.models.User || mongoose.model("User", usersSchema)