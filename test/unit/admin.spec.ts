'use strict';

import 'mocha';
import * as chai from 'chai';
import * as request from 'request';
import * as fs from 'fs-extra-promise';
import * as path from 'path';

import {ApiConfig} from '../../src/config/api';
import {Container} from 'typescript-ioc';
import {Configuration} from '../../src/configuration';
import {SDK} from '../../src/admin/config/sdk';
import { generateSecurityToken, getSwaggerUrl, getSwaggerHost } from '../../src/utils/config';

const expect = chai.expect;
// tslint:disable:no-unused-expression

let config: Configuration;
let adminRequest: any;
let adminToken: string;
let configToken: string;
let sdk: SDK = null;

const adminUser = {
    email: 'test@mail.com',
    login: 'admin',
    name: 'Admin user',
    password: '123test',
    roles: ['admin', 'config']
};

const configUser = {
    email: 'test@mail.com',
    login: 'config',
    name: 'Config user',
    password: '123test',
    roles: ['config']
};

const simpleUser = {
    email: 'test@mail.com',
    login: 'simple',
    name: 'Simple user',
    password: '123test',
    roles: <string[]>[]
};

const getIdFromResponse = (response: any) => {
    const location = response.headers['location'];
    expect(location).to.exist;
    const parts = location ? location.split('/') : [];
    return parts.length > 0 ? parts[parts.length-1] : null;
};

const createUsers = () => {
    return Promise.all([sdk.users.addUser(adminUser), sdk.users.addUser(configUser), sdk.users.addUser(simpleUser)]);
};

describe('Gateway Admin Tasks', () => {
    before(async () => {
        config = Container.get(Configuration);
        adminRequest = request.defaults({baseUrl: `http://localhost:${config.gateway.admin.protocol.http.listenPort}`});

        sdk = await SDK.initialize({
            defaultHost: getSwaggerHost(config.gateway),
            swaggerUrl: getSwaggerUrl(config.gateway),
            token: generateSecurityToken(config.gateway)
        });
        await createUsers();
    });

    describe('/healthcheck', () => {
        it('should return OK', (done) => {
            adminRequest.get('/healthcheck', (error: any, response: any, body: any) => {
                expect(error).to.not.exist;
                expect(response.statusCode).to.equal(200);
                expect(body).to.equal('OK');
                done();
            });
        });
    });

    describe('/users', () => {
        it('should reject unauthenticated requests', (done) => {
            adminRequest.get('/users/admin', (error: any, response: any, body: any) => {
                expect(response.statusCode).to.equal(401);
                done();
            });
        });
        it('should be able to sign admin users in', (done) => {
            const form = {
                'login': 'admin',
                'password': '123test'
            };
            adminRequest.post({
                form: form,
                url:'/users/authentication'
            }, (error: any, response: any, body: any) => {
                expect(response.statusCode).to.equal(200);
                adminToken = body;
                done();
            });
        });
        it('should be able to sign in editor users', (done) => {
            const form = {
                'login': 'config',
                'password': '123test'
            };
            adminRequest.post({
                form: form,
                url:'/users/authentication'
            }, (error: any, response: any, body: any) => {
                expect(response.statusCode).to.equal(200);
                configToken = body;
                done();
            });
        });
        it('should be able to sign in simple users', (done) => {
            const form = {
                'login': 'simple',
                'password': '123test'
            };
            adminRequest.post({
                form: form,
                url:'/users/authentication'
            }, (error: any, response: any, body: any) => {
                expect(response.statusCode).to.equal(200);
                done();
            });
        });

    });

    describe('/apis', () => {
        const apiMock = <ApiConfig> {
            description: 'API mock',
            name: 'apiMock',
            path: 'newApi',
            proxy: {
                target: {host: 'http://test.com'}
            },
            version: '1.0'
        };

        it('should be able to create a new API', (done) => {
            adminRequest.post('/apis', {
                body: apiMock,
                headers: { 'authorization': `Bearer ${configToken}` },
                json: true
            }, (error: any, response: any, body: any) => {
                expect(error).to.not.exist;
                expect(response.statusCode).to.equal(201);
                apiMock.id = getIdFromResponse(response);
                expect(apiMock.id).to.exist;
                done();
            });
        });

        it('should reject unauthenticated request to admin apis', (done) => {
            adminRequest.post('/apis', {
                body: apiMock, json: true
            }, (error: any, response: any, body: any) => {
                expect(error).to.not.exist;
                expect(response.statusCode).to.equal(401);
                done();
            });
        });

        it('should reject an invalid API', (done) => {
            adminRequest.post('/apis', {
                body: {},
                headers: { 'authorization': `Bearer ${configToken}` },
                json: true
            }, (error: any, response: any, body: any) => {
                expect(error).to.not.exist;
                expect(response.statusCode).to.equal(403);
                done();
            });
        });

        it('should be able to list all APIs', (done) => {
            adminRequest.get({
                headers: { 'authorization': `Bearer ${configToken}` },
                url:'/apis'
            }, (error: any, response: any, body: any) => {
                expect(error).to.not.exist;
                expect(response.statusCode).to.equal(200);
                done();
            });
        });

        it('should be able to update an API', (done) => {
            apiMock.description = 'Updated api';

            adminRequest.put(`/apis/${apiMock.id}`, {
                body: apiMock,
                headers: { 'authorization': `Bearer ${configToken}` },
                json: true
            }, (error: any, response: any, body: any) => {
                expect(error).to.not.exist;
                expect(response.statusCode).to.equal(204);
                done();
            });
        });

        it('should be able to get an API', (done) => {
            adminRequest.get({
                headers: { 'authorization': `Bearer ${configToken}` },
                url:`/apis/${apiMock.id}`
            }, (error: any, response: any, body: any) => {
                expect(error).to.not.exist;
                expect(response.statusCode).to.equal(200);
                const api = JSON.parse(body);
                expect(api.description).to.equal('Updated api');
                done();
            });
        });

        it('should be able to delete an API', (done) => {
            adminRequest.delete({
                headers: { 'authorization': `Bearer ${configToken}` },
                url:`/apis/${apiMock.id}`
            }, (error: any, response: any, body: any) => {
                expect(error).to.not.exist;
                expect(response.statusCode).to.equal(204);
                done();
            });
        });
    });

    describe('/users', () => {
        it('should reject requests with low privileges', (done) => {
            adminRequest.delete({
                headers: { 'authorization': `Bearer ${configToken}` },
                url:`/users/simple`
            }, (error: any, response: any, body: any) => {
                expect(error).to.not.exist;
                expect(response.statusCode).to.equal(403);
                done();
            });
        });
        it('should be able to add users', (done) => {
            const simpleUser2 = {
                email: 'test2@mail.com',
                login: 'simple2',
                name: 'Simple user 2',
                password: '123test',
                roles: <string[]>[]
            };

            adminRequest.post({
                body: simpleUser2,
                headers: { 'authorization': `Bearer ${adminToken}` },
                json: true,
                url:`/users`
            }, (error: any, response: any, body: any) => {
                expect(error).to.not.exist;
                expect(response.statusCode).to.equal(201);
                done();
            });
        });
    });

    describe('users SDK', () => {
        it('should be able to change password', () => {
            return sdk.users.changeUserPassword(simpleUser.login, 'newPassword');
        });

        it('should be able to update user properties', async () => {
            const updatedUser = Object.assign({}, simpleUser);
            updatedUser.name = 'New updated Name';
            await sdk.users.updateUser(simpleUser.login, updatedUser);
            const user = await sdk.users.getUser(simpleUser.login);
            expect(user.name).to.equals('New updated Name');
        });
        it('should be able to create new user', async () => {
            const newUser = Object.assign({}, simpleUser);
            newUser.login = simpleUser.login+'_sdk';
            await sdk.users.addUser(newUser);
        });
        it('should be able to remove users', async () => {
            await sdk.users.removeUser(simpleUser.login+'_sdk');
        });
        it('should be able to list users', async () => {
            const users = await sdk.users.list({});
            const logins = users.map(user => user.login);
            expect(logins).to.have.length(4);
            expect(logins).to.have.members(['admin', 'config', 'simple', 'simple2']);
        });
    });

    describe('gateway SDK', () => {
        it('should be able to set configuration for gateway', async () => {
            const newConfig = fs.readJSONSync(path.join(process.cwd(), 'test/data/tree-gateway.json')).gateway;
            await sdk.gateway.updateConfig(newConfig);
            await timeout(5000); // wait gateway restart after a gateway config change
        });
        it('should be able to retrieve configuration for gateway', async () => {
            const dbConfig = await sdk.gateway.getConfig();
            expect(dbConfig.logger.level).to.equals('debug');
        });
        it('should be able to remove configuration for gateway', async () => {
            await sdk.gateway.removeConfig();
            await timeout(5000); // wait gateway restart after a gateway config change
        });
    });

    function timeout(ms: number) {
        return new Promise<void>(resolve => setTimeout(resolve, ms));
    }
});
