import { notfoundException } from "../../common/utils/response/error.response.js";
import { create, find, findOne, findOneAndDelete } from "../../DB/database.repository.js";
import { userMadel } from "../../DB/index.js";
import { messageModel } from './../../DB/model/message.model.js';



export const sendMessage = async (receiverId, files = [], { content = undefined } = {}, user = undefined) => {

  const account = await findOne({
    model: userMadel,
    filter: {
      _id: receiverId
    }
  });
  if (!account) {
    throw notfoundException({ message: "Fail to find matching account" });
  }

  const message = await create({
    model: messageModel,
    data: {
      content,
      attachment: files.map(file => file.finalPath),
      receiverId,
      senderId: user ? user._id : undefined
    }
  });

  return message
}

export const deleteMessage = async (messageId, user) => {

  const account = await findOneAndDelete({
    model: messageModel,
    filter: {
      _id: messageId,
      receiverId: user._id
    }
  });
  if (!account) {
    throw notfoundException({ message: "Invalid message id or not authorized account" });
  }

  return account
}

export const messageList = async (user) => {

  const account = await find({
    model: messageModel,
    filter: {
      $or: [
        { receiverId: user._id },
        { senderId: user._id },
      ]

    },
    select: "-senderId"
  });
  if (!account) {
    throw notfoundException({ message: "Invalid message id or not authorized account" });
  }

  return account
}

export const getMessage = async (messageId, user) => {

  const account = await findOne({
    model: messageModel,
    filter: {
      _id: messageId,
      $or: [
        { receiverId: user._id },
        { senderId: user._id },
      ]

    },
    select: "-senderId"
  });
  if (!account) {
    throw notfoundException({ message: "Invalid message id or not authorized account" });
  }

  return account
}