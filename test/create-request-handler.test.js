import { expect } from 'chai';
import superagent from 'superagent';
import dao from '@sempervirens/dao';
import authorizer from '@sempervirens/authorizer';

import {
  initDb,
  initAuthorizer,
  startServer,
  afterTests,
  toObject
} from './helpers/index.js';

import { CreateRequestHandler } from '../index.js';

initDb();
initAuthorizer();
startServer([
  {
    path: 'POST /api/test-1/create',
    handler: CreateRequestHandler,
    data: {
      modelName: 'Test1',
      max: 5
    }
  },
  {
    path: 'POST /api/test-1a/create',
    handler: CreateRequestHandler,
    isSecure: true,
    data: {
      modelName: 'Test1',
    }
  },
  {
    path: 'POST /api/test-2/create',
    handler: CreateRequestHandler,
    data: { modelName: 'Test2' }
  },
  {
    path: 'POST /api/test-3/create',
    handler: CreateRequestHandler,
    data: { modelName: 'Test3' }
  }
]);

const db = dao.getDb('testdb');
const Test1 = db.getModel('Test1');
const Test2 = db.getModel('Test2');

describe('1. CreateRequestHandler', () => {

  describe('1.1. When "POST /api/{modelBasePath}/create" is called', () => {

    describe('1.1.1. When the POST body is a single record', () => {
      it('1.1.1.1. Should create and return a record', async () => {
        const { body: { data: { record } } } = await superagent
          .post('http://localhost:8080/api/test-1/create')
          .send({
            prop1a: 'val1a',
            prop1b: 'val1b'
          });
        expect(record.prop1a).to.equal('val1a');
        expect(record.prop1b).to.equal('val1b');
      });
    });

    describe('1.1.2. When the POST body is multiple records', () => {
      it('1.1.2.1. Should create and record multiple records', async () => {
        const { body: { data: { records } } } = await superagent
          .post('http://localhost:8080/api/test-1/create')
          .send([
            { prop1a: 'val1ai', prop1b: 'val1bi' },
            { prop1a: 'val1aii', prop1b: 'val1bii' }
          ]);
        const record1 = records[0];
        const record2 = records[1];
        expect(record1.prop1a).to.equal('val1ai');
        expect(record1.prop1b).to.equal('val1bi');
        expect(record2.prop1a).to.equal('val1aii');
        expect(record2.prop1b).to.equal('val1bii');
      });
    });

    describe('1.1.3. When the POST body contains more than the allowed max', () => {
      it('1.1.3.1. Should return an error', async () => {
        const { body: { error: { message } } } = await superagent
          .post('http://localhost:8080/api/test-1/create')
          .send([
            { prop1a: 'val1a', prop1b: 'val1b' },
            { prop1a: 'val1a', prop1b: 'val1b' },
            { prop1a: 'val1a', prop1b: 'val1b' },
            { prop1a: 'val1a', prop1b: 'val1b' },
            { prop1a: 'val1a', prop1b: 'val1b' },
            { prop1a: 'val1a', prop1b: 'val1b' }
          ]);
        expect(message).to.equal('The maximum number of records allowed in one request is 5.');
      });
    });

    describe('1.1.4. When one or more records is created', () => {
      it('1.1.4.1. Should call the model pre-save hook', async () => {
        const { body: { data: { record } } } = await superagent
          .post('http://localhost:8080/api/test-1/create')
          .send({ prop1a: 'val1a', prop1b: 'val1b' });
        expect(record.prop1c).to.equal('val1a-val1b');
        const toCreate = [];
        for (let i = 0; i < 3; i++) {
          toCreate.push({ prop1a: 'val1a', prop1b: 'val1b' });
        }
        const { body: { data: { records } } } = await superagent
          .post('http://localhost:8080/api/test-1/create')
          .send(toCreate);
        records.forEach(record => {
          expect(record.prop1c).to.equal('val1a-val1b');
        });
        await Test1.deleteMany();
      });
    });

    describe('1.1.5. When "isSecure" is true', () => {
      it('1.1.5.1. Should allow requests only if the token is valid', async () => {
        const token = authorizer.encrypt({ expiresIn: '1s', data: { prop1: 'val1' } });
        const { body: { data: { record } } } = await superagent
          .post('http://localhost:8080/api/test-1a/create')
          .set('Authorization', `Bearer ${token}`)
          .send({ prop1a: 'val1a' });
        expect(record.prop1a).to.equal('val1a');

        await new Promise(resolve => setTimeout(() => resolve(), 1500));

        try {
          await superagent
            .post('http://localhost:8080/api/test-1a/create')
            .set('Authorization', `Bearer ${token}`)
            .send({ prop1a: 'val1a' });
        } catch({ message }) {
          expect(message).to.equal('Unauthorized');
        }

        await Test1.deleteMany();
      });
    });

  });

  describe('1.2. When "POST /api/{modelBasePath}/create?populate=" is called', () => {

    describe('1.2.1. When the POST body is a single record', () => {

      describe('1.2.1.1. When "populate" is a string', () => {
        it('1.2.1. Should create and return a record with the property populated', async () => {
          const record1 = await Test1.create({ prop1a: 'val1a' });
          const { body: { data: { record: record2 } } } = await superagent
            .post('http://localhost:8080/api/test-2/create?populate=test1')
            .send({
              test1: record1._id.toString(),
              prop2a: 'val2a',
              prop2b: 'val2b'
            });
          expect(record2.prop2a).to.equal('val2a');
          expect(record2.prop2b).to.equal('val2b');
          expect(record2.test1).to.deep.equal(toObject(record1));
        });
      });

      describe('1.2.1.2. When "populate" is a JSON string with a multiple objects', () => {
        it('1.2.2. Should create and return a record with the property populated', async () => {
          const record1 = await Test1.create({ prop1a: 'val1a', prop1b: 'val1b' });
          const record2 = await Test2.create({ prop2a: 'val2a', prop2b: 'val2b' });
          const populate = JSON.stringify([
            { path: 'test1', select: '-_id prop1b' },
            { path: 'test2', select: 'prop2a' }
          ]);
          const { body: { data: { record: record3 } } } = await superagent
            .post(`http://localhost:8080/api/test-3/create?populate=${populate}`)
            .send({
              test1: record1._id.toString(),
              test2: record2._id.toString(),
              prop3a: 'val3a',
              prop3b: 'val3b'
            });
          expect(record3.prop3a).to.equal('val3a');
          expect(record3.prop3b).to.equal('val3b');
          expect(record3.test1).to.deep.equal({ prop1b: 'val1b' });
          expect(record3.test2).to.deep.equal({
            _id: record2._id.toString(),
            prop2a: 'val2a'
          });
        });
      });

    });

    describe('1.2.2. When the POST body is multiple records', () => {

      describe('1.2.2.1. When "populate" is a string', () => {
        it('1.2.2.1.1. Should create and return a record with the property populated', async () => {
          const record1 = await Test1.create({ prop1a: 'val1a' });
          const { body: { data: { records } } } = await superagent
            .post('http://localhost:8080/api/test-2/create?populate=test1')
            .send([
              {
                test1: record1._id.toString(),
                prop2a: 'val2ai',
                prop2b: 'val2bi'
              },
              {
                test1: record1._id.toString(),
                prop2a: 'val2aii',
                prop2b: 'val2bii'
              }
            ]);
          const record2 = records[0];
          const record3 = records[1];
          expect(record2.prop2a).to.equal('val2ai');
          expect(record2.prop2b).to.equal('val2bi');
          expect(record2.test1).to.deep.equal(toObject(record1));
          expect(record3.prop2a).to.equal('val2aii');
          expect(record3.prop2b).to.equal('val2bii');
          expect(record3.test1).to.deep.equal(toObject(record1));
        });
      });

      describe('1.2.2.2. When "populate" is a JSON string with a multiple objects', () => {
        it('1.2.2.2.1. Should create and return a record with the property populated', async () => {
          const record1 = await Test1.create({ prop1a: 'val1a', prop1b: 'val1b' });
          const record2 = await Test2.create({ prop2a: 'val2a', prop2b: 'val2b' });
          const populate = JSON.stringify([
            { path: 'test1', select: '-_id prop1b' },
            { path: 'test2', select: 'prop2a' }
          ]);
          const { body: { data: { records } } } = await superagent
            .post(`http://localhost:8080/api/test-3/create?populate=${populate}`)
            .send([
              {
                test1: record1._id.toString(),
                test2: record2._id.toString(),
                prop3a: 'val3ai',
                prop3b: 'val3bi'
              },
              {
                test1: record1._id.toString(),
                test2: record2._id.toString(),
                prop3a: 'val3aii',
                prop3b: 'val3bii'
              }
            ]);
          const record3 = records[0];
          const record4 = records[1];
          expect(record3.prop3a).to.equal('val3ai');
          expect(record3.prop3b).to.equal('val3bi');
          expect(record3.test1).to.deep.equal({ prop1b: 'val1b' });
          expect(record3.test2).to.deep.equal({
            _id: record2._id.toString(),
            prop2a: 'val2a'
          });
          expect(record4.prop3a).to.equal('val3aii');
          expect(record4.prop3b).to.equal('val3bii');
          expect(record4.test1).to.deep.equal({ prop1b: 'val1b' });
          expect(record4.test2).to.deep.equal({
            _id: record2._id.toString(),
            prop2a: 'val2a'
          });
        });
      });

    });

  });

  after(async () => await afterTests());

});