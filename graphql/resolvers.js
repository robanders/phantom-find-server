const bcrypt = require('bcryptjs');
const Encounter = require('../models/encounter');
const { create } = require('../models/user');
const User = require('../models/user');
const Support = require('../models/support');
const { createAccessToken, createRefreshToken, createEmailToken, validateHuman } = require('../src/auth');
const { sendRefreshToken } = require('../src/sendRefreshToken');
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');

module.exports = {
    Query: {
        encounters: async () => {
            try {
                const encounters = await Encounter.find();
                return encounters;
            } catch (err) {
                throw err;
            }
        },
        encounter: async (_, { encounterId }) => {
            try {
                const encounter = await Encounter.findById(encounterId).populate('creator').exec();
                if(!encounter || encounter == null) {
                    throw new Error('Encounter Not Found.')
                }
                console.log(encounter);
                return encounter;
            } catch (err) {
                throw err;
            }
        },
        me: async (_, args, context) => {
            const authHeader = context.req.headers['authorization'];

            if(!authHeader) {
                return null;
            }
            try {
                const token = authHeader.split(' ')[1];
                const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                //context.payload = payload;
                const user = await User.findById(payload.userId);
                return user;
            } catch(err) {
                console.log(err);
                return null;
            }
        }
    },
    Mutation: {
        createEncounter: async (_, args, context) => {
            if(!context.req.isAuth) {
                throw new Error('Unauthenticated');
            }
            try {
                const human = await validateHuman(args.encounterInput.recapToken);
                if(!human) {
                    throw new Error("Unable to create encounter.")
                }
                const encounter = new Encounter({
                    lat: args.encounterInput.lat,
                    lng: args.encounterInput.lng,
                    title: args.encounterInput.title,
                    description: args.encounterInput.description,
                    creator: context.req.userId
                });
                const createdEncounter = await encounter.save();
                const creator = await User.findById(context.req.userId);
                if(!creator) {
                    throw new Error('User not found.')
                }
                await creator.createdEncounters.push(encounter);
                await creator.save();
                return createdEncounter;
            } catch (err) {
                throw err;
            }
        },
        createUser: async (_, args, context) => {
            // "2020-11-26T16:58:57.502Z"
            try {
                const human = await validateHuman(args.userInput.recapToken);
                if(!human) {
                    throw new Error("Unable to login.")
                }
                const existingEmail = await User.findOne({ email: args.userInput.email });
                if(existingEmail) {
                    throw new Error('Email already in use.')
                }
                const existingUsername = await User.findOne({ username: args.userInput.username });
                if(existingUsername) {
                    throw new Error('Username already in use.')
                }
                const hashedPassword = await bcrypt.hash(args.userInput.password, 12);
                const user = new User({
                    username: args.userInput.username,
                    email: args.userInput.email,
                    password: hashedPassword,
                    isBanned: false,
                    emailVerified: false
                });
                const result = await user.save();
                result.password = null;

                // send email
                const transporter = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: process.env.GMAIL_USER,
                        pass: process.env.GMAIL_PASS
                    }
                });

                try {
                    const emailToken = createEmailToken(result);
                    const url = `http://localhost:4000/confirmation/${emailToken}`;

                    await transporter.sendMail({
                        to: args.userInput.email,
                        subject: 'Confirm Email',
                        html: `Please click the link in this email to confirm your account: <a href="${url}">${url}</a>`
                    });
                } catch (err) {
                    throw err;
                }
                return result;
            } catch (err) {
                throw err;
            }
        },
        deleteEncounter: async (_, args, context) => {
            if(!context.req.isAuth) {
                throw new Error('Unauthenticated');
            }
            try {
                const existingEncounter = await Encounter.findById(args.encounterId);
                const user = await User.findById(context.req.userId);
                if(!existingEncounter || !user) {
                    throw new Error('Failed to delete encounter.');
                }
                await Encounter.deleteOne({ _id: args.encounterId });
                await user.createdEncounters.pull(existingEncounter);
                await user.save();
                return true;
            } catch (err) {
                throw err;
            }
        },
        deleteUser: async (_, args) => {
            try {
                const existingUser = await User.findById(args.userId);
                if(!existingUser) {
                    throw new Error('User not found.');
                }
                const deletedUser = await Encounter.deleteOne({ _id: args.userId });
                return deletedUser;
            } catch (err) {
                throw err;
            }
        },
        login: async (_, args, context) => {
            try {
                const human = await validateHuman(args.loginInput.recapToken);
                if(!human) {
                    throw new Error("Unable to login.")
                }
                
                const user = await User.findOne({ email: args.loginInput.email });
                if(!user) {
                    throw new Error("Invalid login credentials");
                }
                if(!user.emailVerified) {
                    throw new Error("please verify your email to continue.")
                }
                const valid = await bcrypt.compare(args.loginInput.password, user.password);
                if(!valid) {
                    throw new Error("Invalid login credentials");
                }
    
                // login successful
                // send refresh token
                sendRefreshToken(context.res, createRefreshToken(user));
    
                // send access token
                return {
                    accessToken: createAccessToken(user),
                    user
                };
    
            } catch (err) {
                throw err;
            }
        },
        revokeRefreshTokensForUser: async (_, args) => {
            await User.findOneAndUpdate({_id: args.userId}, {$inc : {tokenVersion: 1}}, {useFindAndModify: false})
            return true;
        },
        logout: async (_, args, context) => {
            sendRefreshToken(context.res, '');
            return true;
        },
        requestSupport: async (_, args) => {
            try {
                const supportRequest = new Support({
                   subject: args.supportInput.subject,
                   email: args.supportInput.email,
                   body: args.supportInput.body 
                });
                await supportRequest.save();
                return true;
            } catch (err) {
                throw err;
            }
        },
        changePassword: async (_, args, context) => {
            if(!context.req.isAuth) {
                throw new Error('Unauthenticated');
            }
            try {
                const user = await User.findOne({ email: args.resetpwInput.email });
                if(!user) {
                    throw new Error("could not find user");
                }
                const valid = await bcrypt.compare(args.resetpwInput.currentPassword, user.password);
                if(!valid) {
                    throw new Error("bad password");
                }
                const newHashedPassword = await bcrypt.hash(args.resetpwInput.newPassword, 12);
                user.password = newHashedPassword;
                await user.save();
                await User.findOneAndUpdate({_id: args.resetpwInput.id}, {$inc : {tokenVersion: 1}}, {useFindAndModify: false})
                return true;
            } catch(err) {
                throw err;
            }
        }
    }
}