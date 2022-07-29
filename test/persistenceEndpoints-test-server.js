import { readFileSync } from 'fs';
import mongoose from 'mongoose';
import authorizer from '@sempervirens/authorizer';
import dao from '@sempervirens/dao';
import Server from '@sempervirens/server';
// import persistenceEndpoints from '@sempervirens/plugin-persistence-endpoints';
import persistenceEndpoints from '../index.js';

authorizer.init({
  // jwtPublicKey: readFileSync('./path/to/public.key', 'utf8'),
  // jwtPrivateKey: readFileSync('./path/to/private.key', 'utf8'),
  jwtPublicKey: readFileSync('./security/jwt/jwtRS256.key.pub', 'utf8'),
  jwtPrivateKey: readFileSync('./security/jwt/jwtRS256.key', 'utf8')
});

dao.initDb({
  host: 'localhost',
  port: 27017,
  connectionOptions: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  },
  name: 'testdb',
  models: [
    {
      name: 'Test1',
      schema: new mongoose.Schema({
        prop1a: { type: String },
        prop1b: { type: String }
      })
    },
    {
      name: 'Test2',
      schema: new mongoose.Schema({
        prop2a: { type: String },
        prop2b: { type: String },
        test1: { type: mongoose.Types.ObjectId, ref: 'Test1' }
      })
    }
  ]
});

new Server({
  port: 8080,
  sites: [
    {
      domain: 'site-1',
      data: { dbName: 'testdb' },
      endpoints: [
        ...persistenceEndpoints([
          {
            modelName: 'Test1' // Available at /api/test-1/create, delete, find, update
          },
          {
            modelName: 'Test1',
            modelBasePath: 'test-1a', // Available at /api-1/test-1a/create, delete, find, update
            apiBasePath: 'api-1',
            find: { max: 100 } // Only allow 100 records per request
          },
          {
            modelName: 'Test2',
            modelBasePath: 'test-2',
            create: {
              // On /create, take the "_id" from the token data and add it to
              // the "test1" property of the created record
              bindWithToken: {
                tokenKey: '_id',
                recordKey: 'test1'
              }
            },
            find: {
              bindWithToken: {
                // On /find, return only those records where the "_id" from the
                // token data matches the "test1" property of the records
                tokenKey: '_id',
                recordKey: 'test1'
              }
            }
          }
        ])
      ]
    }
  ]
}).start();

