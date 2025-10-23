import bcrypt from 'bcrypt';
import schemas from '../models/schemas.js'
import { nanoid } from 'nanoid';

export const comparePasswords = async(password, hash) => {
    try {
        const match = await bcrypt.compare(password, hash);
        return match;
    } catch(err) {
        console.log(err);
    }
    return false;
}

export const findByUsername = async(username) => {
    console.log('Find By Username dispatched');
    const users = schemas.Users;
    const user = await users.findOne({ username: username }).exec();
    return user;
}

export const findById = async(_id, cb) => {
    const users = schemas.Users;
    const user = await users.findById(_id).exec();
    const error = (user ? null : 'User Not Found');
    return cb(error, user);
}

export const userExists = async(username) => {
    console.log('Check started');
    const users = schemas.Users;
    const user = await users.findOne({ username: username }).exec();
    return(user ? true : false);
}

export const generateId = async() => {
    let newId = nanoid();
    const users = schemas.Users;
    const user = await users.findById(newId).exec();
    while(user) {
        newId = nanoid();
        user = await users.findById(newId).exec();
    }
    return newId;
}