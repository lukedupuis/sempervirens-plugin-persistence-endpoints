# Sempervirens Plugin: Persistence Endpoints

A set of endpoints to facilitate create, read, update, and delete operations via Express on MongoDB

![Tests badge](https://github.com/lukedupuis/sempervirens-plugin-persistence-endpoints/actions/workflows/main.yml/badge.svg?event=push) ![Version badge](https://img.shields.io/static/v1?label=Node&labelColor=30363c&message=16.x&color=blue) ![Version badge](https://img.shields.io/static/v1?label=MongoDB&labelColor=30363c&message=4.4&color=blue)

## Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Endpoints](#endpoints)
  - [Code Example](#code-example)
- [API](#api)

## Installation

`npm i @sempervirens/plugin-persistence-endpoints`

## Usage

In the [Code Example](#code-example) below are some examples of basic usage. After plugging `persistenceEndpoints` into the server's endpoints array and configuring it with one or more object(s) containing a `modelName`, the endpoints to create, delete, find, and update the model's records become available.

### Endpoints

Create records with the request body.

`POST http://localhost[:{port}]/{domain}/{api|apiBaseUrl}/{kebab-case-model-name|modelBaseUrl}/create`
`POST http://{domain}/{api|apiBaseUrl}/{kebab-case-model-name|modelBaseUrl}/create`

Delete records with the given ID(s).

`DELETE http://localhost[:{port}]/{domain}/{api|apiBaseUrl}/{kebab-case-model-name|modelBaseUrl}/delete/{id1,id2}`
`DELETE http://{domain}/{api|apiBaseUrl}/{kebab-case-model-name|modelBaseUrl}/delete/{id1,id2}`

Find the records matching the given criteria.

`GET http://localhost[:{port}]/{domain}/{api|apiBaseUrl}/{kebab-case-model-name|modelBaseUrl}/find[/{ids}[?filters=[&sort=[&page=[&perPage=[&select=[&populate]]]]]]]]`
`GET http://{domain}/{api|apiBaseUrl}/{kebab-case-model-name|modelBaseUrl}/find[/{ids}[?filters=[&sort=[&page=[&perPage=[&select=[&populate]]]]]]]]`

Update the records matching given critiera using the request body.

`PATCH http://localhost[:{port}]/{domain}/{api|apiBaseUrl}/{kebab-case-model-name|modelBaseUrl}/update[/{ids}[?filters=[&sort=[&populate]]]]]]]`
`PATCH http://{domain}/{api|apiBaseUrl}/{kebab-case-model-name|modelBaseUrl}/update[/{ids}[?filters=[&sort=[&populate]]]]]]]`

### Code Example

```
import { readFileSync } from 'fs';
import mongoose from 'mongoose';
import authorizer from '@sempervirens/authorizer';
import dao from '@sempervirens/dao';
import Server from '@sempervirens/server';
import persistenceEndpoints from '@sempervirens/plugin-persistence-endpoints';

authorizer.init({
  jwtPublicKey: readFileSync('/path/to/public.key', 'utf8'),
  jwtPrivateKey: readFileSync('/path/to/private.key', 'utf8')
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
```

## API

### modelName

The name of the model that the endpoints operate on.

### modelBasePath

By default the `modelBasePath` is kebab-case `modelName`. The `modelBasePath` property enables a custom definition.

### apiBasePath

The base API path is usually `/api`. If the `apiBasePath` is specified at the site level (same level as `domain`, `data`, `endpoints`, etc.), then it should be specified in the `persistenceEndpoints` configuration as well in order for the endpoints to be available at the specified path and for API validation to work.

### max

Specified per endpoint. `max` records allowed per request.

```
{
  modelName: 'Test1',
  create: { max: 100 },
  delete: { max: 5 },
  find: { max: 200 },
  update: { max: 10 }
}
```

### isSecure

Specified per endpoint. If present, `isSecure` ensures the endpoint will not process requests when a valid `"Authorization": "Bearer {token}"` header is not present. See [@sempervirens/authorizer](https://www.npmjs.com/package/@sempervirens/authorizer) or [@sempervirens/plugin-session-endpoints](https://www.npmjs.com/package/@sempervirens/plugin-session-endpoints) for an explanation of how to generate JWT tokens and pass them to the frontend so the frontend can add them to the request header.

```
{
  modelName: 'Test1',
  create: { isSecure: true },
  delete: { isSecure: true },
  find: { isSecure: true },
  update: { isSecure: true }
}
```

### bindWithToken

Specified per endpoint. The purpose of `bindWithToken` is to bind requests so that when calling the `delete`, `find`, and `update` endpoints, the value of the given property on the model record must match a property and value in the authroization token. This is useful for example to bind a user's ID to models so that the user can only operate on their own records.

If passed into the `create` configuration, rather than checking the value for validity as in the other endpoitns, it sets the value. In the following example, when `/test-2/create` is called, it takes the token from the header, decrypts it, gets the `_id` property from it, and sets the `test1` property of the new `Test2` record to the value from the token.

```
{
  modelName: 'Test2',
  create: {
    bindWithToken: {
      tokenKey: '_id',
      recordKey: 'test1'
    }
  },
  delete: {
    bindWithToken: {
      tokenKey: '_id',
      recordKey: 'test1'
    }
  },
  find: {
    bindWithToken: {
      tokenKey: '_id',
      recordKey: 'test1'
    }
  },
  update: {
    bindWithToken: {
      tokenKey: '_id',
      recordKey: 'test1'
    }
  }
}
```