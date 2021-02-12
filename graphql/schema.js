const { gql } = require('apollo-server-express');

const typeDefs = gql`
    type Encounter {
        id: ID!
        lat: Float!
        lng: Float!
        title: String!
        description: String!
        dateCreated: String!
        createdAt: String!
        updatedAt: String!
        creator: User!
        comments: [Comment!]!
    }

    input EncounterInput {
        lat: Float!
        lng: Float!
        title: String!
        description: String!
        recapToken: String!
    }

    type Comment {
        id: ID!
        author: User!
        body: String!
        dateCreated: String!
        lastEdited: String!
        parentId: ID

    }

    input CommentInput {
        author: UserInput!
        body: String!
        dateCreated: String!
        lastEdited: String!
        parentId: ID
    }

    type User {
        id: ID!
        username: String!
        email: String!
        password: String
        isBanned: Boolean!
        createdAt: String!
        updatedAt: String!
        tokenVersion: Int!
        emailVerified: Boolean!
        createdEncounters: [Encounter]!
    }

    type LoginResponse {
        accessToken: String!
        user: User!
    }

    input UserInput {
        username: String!
        email: String!
        password: String!
        recapToken: String!
    }

    input ResetPasswordInput {
        id: ID!
        username: String!
        email: String!
        currentPassword: String!
        newPassword: String!
    }

    input LoginInput {
        email: String!
        password: String!
        recapToken: String!
    }

    input SupportInput {
        subject: String!
        email: String!
        body: String!
    }

    type Query {
        encounters: [Encounter!]!
        encounter(encounterId: ID): Encounter
        me: User
    }

    type Mutation {
        createEncounter(encounterInput: EncounterInput): Encounter
        createUser(userInput: UserInput): User
        deleteEncounter(encounterId: ID): Boolean
        deleteUser(userId: String): User
        login(loginInput: LoginInput): LoginResponse
        revokeRefreshTokensForUser(userId: ID): Boolean
        logout: Boolean
        requestSupport(supportInput: SupportInput): Boolean
        changePassword(resetpwInput: ResetPasswordInput): Boolean
    }
`;

module.exports = typeDefs;