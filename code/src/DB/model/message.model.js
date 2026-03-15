import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    content: {
        type: String,
        minLength: 2,
        maxLength: 10000,
        required: function () {
            return !(this.attachment?.length)
        }
    },
    attachment: [String],
    receiverId: {
        type: mongoose.Types.ObjectId, ref: "User",
        required: true
    },
    senderId: {
        type: mongoose.Types.ObjectId, ref: "User"
    },
}, {
    timestamps: true
})


export const messageModel = mongoose.models.Message || mongoose.model("Message", messageSchema)