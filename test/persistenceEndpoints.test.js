import { expect } from 'chai';
import superagent from 'superagent';
import dao from '@sempervirens/dao';
import authorizer from '@sempervirens/authorizer';

import {
  initDb,
  initAuthorizer,
  startServer,
  afterTests
} from './helpers/index.js';

import persistenceEndpoints from '../index.js';

initDb();
initAuthorizer();
startServer(
  persistenceEndpoints([
    {
      modelName: 'Test1'
    },
    {
      modelName: 'Test1',
      modelBasePath: 'test-1a',
    },
    {
      modelName: 'Test1',
      apiBasePath: 'api-1'
    },
    {
      modelName: 'Test1',
      modelBasePath: 'test-1b',
      create: { max: 5 },
      find: { max: 5 },
      update: { max: 5 },
      delete: { max: 5 }
    },
    {
      modelName: 'Test2',
      modelBasePath: 'test-2',
      create: {
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
      },
      delete: {
        bindWithToken: {
          tokenKey: '_id',
          recordKey: 'test1'
        }
      }
    },
    {
      modelName: 'Test1',
      modelBasePath: 'test-1c',
      create: { isSecure: true },
      delete: { isSecure: true },
      find: { isSecure: true },
      update: { isSecure: true }
    }
  ])
);

const db = dao.getDb('testdb');
const Test1 = db.getModel('Test1');
const Test2 = db.getModel('Test2');

describe('1. persistenceEndpoints', () => {
  // return;

  afterEach(async () => {
    await Test1.deleteMany();
    await Test2.deleteMany();
  });

  describe('1.1. When "modelName" is given', () => {
    // return;

    describe('1.1.1. When "create" is called', () => {
      // return;
      it('1.1.1.1. Should create records', async () => {
        const toCreate = [];
        for (let i = 0; i < 3; i++) {
          toCreate.push({ prop1a: 'val1a' });
        }
        await superagent
          .post('http://localhost:8080/site-1/api/test-1/create')
          .send(toCreate);
        const records = await Test1.find({ prop1a: 'val1a' });
        expect(records.length).to.equal(3);
      });
    });

    describe('1.1.2. When "delete" is called', () => {
      // return;
      it('1.1.2.1. Should delete records', async () => {
        const ids = [];
        for (let i = 0; i < 3; i++) {
          const record = await Test1.create({ prop1a: 'val1a' });
          ids.push(record._id.toString());
        }
        const { body: { data: { deletedCount } } } = await superagent
          .delete(`http://localhost:8080/site-1/api/test-1/delete/${ids.join()}`);
        const records = await Test1.find({ prop1a: 'val1a' });
        expect(deletedCount).to.equal(3);
        expect(records).to.be.empty;
      });
    });

    describe('1.1.3. When "find" is called', () => {
      // return;
      it('1.1.3.1. Should find records', async () => {
        const ids = [];
        for (let i = 0; i < 3; i++) {
          const record = await Test1.create({ prop1a: 'val1a' });
          ids.push(record._id.toString());
        }
        const { body: { data: { records } } } = await superagent
          .get(`http://localhost:8080/site-1/api/test-1/find/${ids.join()}`);
        expect(records.length).to.equal(3);
      });
    });

    describe('1.1.4. When "update" is called', () => {
      // return;
      it('1.1.4.1. Should update records', async () => {
        const ids = [];
        for (let i = 0; i < 3; i++) {
          const record = await Test1.create({ prop1a: 'val1ai' });
          ids.push(record._id.toString());
        }
        const { body: { data: { records } } } = await superagent
          .patch(`http://localhost:8080/site-1/api/test-1/update/${ids.join()}`)
          .send({ prop1a: 'val1aii' });
        records.forEach(record => {
          expect(record.prop1a).to.equal('val1aii');
        });
      });
    });

  });

  describe('1.2. When "modelBasePath" is given', () => {
    // return;

    describe('1.2.1. When "create" is called', () => {
      // return;
      it('1.2.1.1. Should create records', async () => {
        const toCreate = [];
        for (let i = 0; i < 3; i++) {
          toCreate.push({ prop1a: 'val1a' });
        }
        await superagent
          .post('http://localhost:8080/site-1/api/test-1a/create')
          .send(toCreate);
        const records = await Test1.find({ prop1a: 'val1a' });
        expect(records.length).to.equal(3);
      });
    });

    describe('1.2.2. When "delete" is called', () => {
      // return;
      it('1.2.2.1. Should delete records', async () => {
        const ids = [];
        for (let i = 0; i < 3; i++) {
          const record = await Test1.create({ prop1a: 'val1a' });
          ids.push(record._id.toString());
        }
        const { body: { data: { deletedCount } } } = await superagent
          .delete(`http://localhost:8080/site-1/api/test-1a/delete/${ids.join()}`);
        const records = await Test1.find({ prop1a: 'val1a' });
        expect(deletedCount).to.equal(3);
        expect(records).to.be.empty;
      });
    });

    describe('1.2.3. When "find" is called', () => {
      // return;
      it('1.2.3.1. Should find records', async () => {
        const ids = [];
        for (let i = 0; i < 3; i++) {
          const record = await Test1.create({ prop1a: 'val1a' });
          ids.push(record._id.toString());
        }
        const { body: { data: { records } } } = await superagent
          .get(`http://localhost:8080/site-1/api/test-1a/find/${ids.join()}`);
        expect(records.length).to.equal(3);
      });
    });

    describe('1.2.4. When "update" is called', () => {
      // return;
      it('1.2.4.1. Should update records', async () => {
        const ids = [];
        for (let i = 0; i < 3; i++) {
          const record = await Test1.create({ prop1a: 'val1ai' });
          ids.push(record._id.toString());
        }
        const { body: { data: { records } } } = await superagent
          .patch(`http://localhost:8080/site-1/api/test-1a/update/${ids.join()}`)
          .send({ prop1a: 'val1aii' });
        records.forEach(record => {
          expect(record.prop1a).to.equal('val1aii');
        });
      });
    });

  });

  describe('1.3. When "apiBasePath" is given', () => {
    // return;

    describe('1.3.1. When "create" is called', () => {
      // return;
      it('1.3.1.1. Should create records', async () => {
        const toCreate = [];
        for (let i = 0; i < 3; i++) {
          toCreate.push({ prop1a: 'val1a' });
        }
        await superagent
          .post('http://localhost:8080/site-1/api-1/test-1/create')
          .send(toCreate);
        const records = await Test1.find({ prop1a: 'val1a' });
        expect(records.length).to.equal(3);
      });
    });

    describe('1.3.2. When "delete" is called', () => {
      // return;
      it('1.3.2.1. Should delete records', async () => {
        const ids = [];
        for (let i = 0; i < 3; i++) {
          const record = await Test1.create({ prop1a: 'val1a' });
          ids.push(record._id.toString());
        }
        const { body: { data: { deletedCount } } } = await superagent
          .delete(`http://localhost:8080/site-1/api-1/test-1/delete/${ids.join()}`);
        const records = await Test1.find({ prop1a: 'val1a' });
        expect(deletedCount).to.equal(3);
        expect(records).to.be.empty;
      });
    });

    describe('1.3.3. When "find" is called', () => {
      // return;
      it('1.3.3.1. Should find records', async () => {
        const ids = [];
        for (let i = 0; i < 3; i++) {
          const record = await Test1.create({ prop1a: 'val1a' });
          ids.push(record._id.toString());
        }
        const { body: { data: { records } } } = await superagent
          .get(`http://localhost:8080/site-1/api-1/test-1/find/${ids.join()}`);
        expect(records.length).to.equal(3);
      });
    });

    describe('1.3.4. When "update" is called', () => {
      // return;
      it('1.3.4.1. Should update records', async () => {
        const ids = [];
        for (let i = 0; i < 3; i++) {
          const record = await Test1.create({ prop1a: 'val1ai' });
          ids.push(record._id.toString());
        }
        const { body: { data: { records } } } = await superagent
          .patch(`http://localhost:8080/site-1/api-1/test-1/update/${ids.join()}`)
          .send({ prop1a: 'val1aii' });
        records.forEach(record => {
          expect(record.prop1a).to.equal('val1aii');
        });
      });
    });

  });

  describe('1.4. When "max" is given', () => {
    // return;

    describe('1.4.1. When "create" is called with more than max records', () => {
      // return;
      it('1.4.1.1. Should return an error', async () => {
        const toCreate = [];
        for (let i = 0; i < 6; i++) {
          toCreate.push({ prop1a: 'val1a' });
        }
        const { body: { error: { message } } } = await superagent
          .post('http://localhost:8080/site-1/api/test-1b/create')
          .send(toCreate);
        expect(message).to.equal('The maximum number of records allowed in one request is 5.');
      });
    });

    describe('1.4.2. When "delete" is called with more than max records', () => {
      // return;
      it('1.4.2.1. Should return an error', async () => {
        const ids = [];
        for (let i = 0; i < 6; i++) {
          const record = await Test1.create({ prop1a: 'val1a' });
          ids.push(record._id.toString());
        }
        const { body: { error: { message }  } } = await superagent
          .delete(`http://localhost:8080/site-1/api/test-1b/delete/${ids.join()}`);
        expect(message).to.equal('The maximum number of records allowed in one request is 5.');
      });
    });

    describe('1.4.3. When "find" is called with more than max records', () => {
      // return;
      it('1.4.3.1. Should return an error', async () => {
        const ids = [];
        for (let i = 0; i < 6; i++) {
          const record = await Test1.create({ prop1a: 'val1a' });
          ids.push(record._id.toString());
        }
        const { body: { error: { message } } } = await superagent
          .get(`http://localhost:8080/site-1/api/test-1b/find/${ids.join()}`);
        expect(message).to.equal([
          'The maximum number of records allowed in one ',
          'request is "5". Please set or reduce the "perPage" number of records.'
        ].join(''));
      });
    });

    describe('1.4.4. When "update" is called with more than max records', () => {
      // return;
      it('1.4.4.1. Should return an error', async () => {
        const ids = [];
        for (let i = 0; i < 6; i++) {
          const record = await Test1.create({ prop1a: 'val1ai' });
          ids.push(record._id.toString());
        }
        const { body: { error: { message } } } = await superagent
          .patch(`http://localhost:8080/site-1/api/test-1b/update/${ids.join()}`)
          .send({ prop1a: 'val1aii' });
        expect(message).to.equal('The maximum number of records allowed in one request is 5.');
      });
    });

  });

  describe('1.5. When "bindWithToken" is given', () => {
    // return;

    describe('1.5.1. When the token is invalid', async () => {
      // return;
      it('1.5.1.1. Should return an error', async () => {

        const record1 = await Test1.create({ prop1a: 'val1a' });
        const id1 = record1._id.toString();
        const record2 = await Test2.create({ prop2a: 'val2a', test1: id1 });
        const id2 = record2._id.toString();
        const token = authorizer.encrypt({ expiresIn: '1s', data: { _id: id1 } });

        await new Promise(resolve => setTimeout(() => resolve(), 1200));

        const { body: { error: { message: message1 } } } = await superagent
          .post('http://localhost:8080/site-1/api/test-2/create')
          .set('Authorization', `Bearer ${token}`)
          .send({ prop2a: 'val2a' });
        expect(message1).to.equal('Token is invalid.');

        const { body: { error: { message: message2 } } } = await superagent
          .delete(`http://localhost:8080/site-1/api/test-2/delete/${id2}`)
          .set('Authorization', `Bearer ${token}`);
        expect(message2).to.equal('Token is invalid.');

        const { body: { error: { message: message3 } } } = await superagent
          .get(`http://localhost:8080/site-1/api/test-2/find/${id2}`)
          .set('Authorization', `Bearer ${token}`);
        expect(message3).to.equal('Token is invalid.');

        const { body: { error: { message: message4 } } } = await superagent
          .patch(`http://localhost:8080/site-1/api/test-2/update/${id2}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ prop2a: 'val2ai' });
        expect(message4).to.equal('Token is invalid.');

      });
    });

    describe('1.5.2. When "tokenValue" does not exist', () => {
      // return;
      it('1.5.2.1. Should return an error', async () => {

        const record1 = await Test1.create({ prop1a: 'val1a' });
        const id1 = record1._id.toString();
        const record2 = await Test2.create({ prop2a: 'val2a', test1: id1 });
        const id2 = record2._id.toString();
        const token = authorizer.encrypt({ expiresIn: '1m', data: { id: id1 } });

        await new Promise(resolve => setTimeout(() => resolve(), 1200));

        const { body: { error: { message: message1 } } } = await superagent
          .post('http://localhost:8080/site-1/api/test-2/create')
          .set('Authorization', `Bearer ${token}`)
          .send({ prop2a: 'val2a' });
        expect(message1).to.equal('"tokenKey" value does not exist.');

        const { body: { error: { message: message2 } } } = await superagent
          .delete(`http://localhost:8080/site-1/api/test-2/delete/${id2}`)
          .set('Authorization', `Bearer ${token}`);
        expect(message2).to.equal('"tokenKey" value does not exist.');

        const { body: { error: { message: message3 } } } = await superagent
          .get(`http://localhost:8080/site-1/api/test-2/find/${id2}`)
          .set('Authorization', `Bearer ${token}`);
        expect(message3).to.equal('"tokenKey" value does not exist.');

        const { body: { error: { message: message4 } } } = await superagent
          .patch(`http://localhost:8080/site-1/api/test-2/update/${id2}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ prop2a: 'val2ai' });
        expect(message4).to.equal('"tokenKey" value does not exist.');

      });
    });

    describe('1.5.3. When "create" is called', () => {
      // return;
      it('1.5.3.1. Should create the record and add the "tokenKey" value to the "recordKey" property of the record', async () => {
        const record1 = await Test1.create({ prop1a: 'val1a' });
        const token = authorizer.encrypt({
          expiresIn: '1m',
          data: { _id: record1._id.toString() }
        });
        const { body: { data: { record: record2 } } } = await superagent
          .post('http://localhost:8080/site-1/api/test-2/create')
          .set('Authorization', `Bearer ${token}`)
          .send({ prop2a: 'val2a' });
        expect(record2.test1).to.equal(record1._id.toString());
      });
    });

    describe('1.5.4. When "delete" is called', () => {
      // return;

      describe('1.5.4.1. When the "recordKey" value matches the "tokenKey" value', () => {
        // return;

        describe('1.5.4.1.1. When "ids" is given with one ID', () => {
          // return;
          it('1.5.4.1.1.1. Should delete the record', async () => {
            const record1 = await Test1.create({ prop1a: 'val1a' });
            const id1 = record1._id.toString();
            const record2 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id2 = record2._id.toString();
            const token = authorizer.encrypt({ expiresIn: '1m', data: { _id: id1 } });
            const { body: { data: { deletedCount } } } = await superagent
              .delete(`http://localhost:8080/site-1/api/test-2/delete/${id2}`)
              .set('Authorization', `Bearer ${token}`);
            const record3 = await Test2.findOne({ _id: id2 }).lean();
            expect(deletedCount).to.equal(1);
            expect(record3).not.to.exist;
          });
        });

        describe('1.5.4.1.2. When "ids" is given with multiple IDs', () => {
          // return;
          it('1.5.4.1.2.1. Should delete the records', async () => {
            const record1 = await Test1.create({ prop1a: 'val1a' });
            const id1 = record1._id.toString();
            const record2 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id2 = record2._id.toString();
            const record3 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id3 = record3._id.toString();
            const token = authorizer.encrypt({ expiresIn: '1m', data: { _id: id1 } });
            const { body: { data: { deletedCount } } } = await superagent
              .delete(`http://localhost:8080/site-1/api/test-2/delete/${id2},${id3}`)
              .set('Authorization', `Bearer ${token}`);
            const record4 = await Test2.findOne({ _id: id2 }).lean();
            const record5 = await Test2.findOne({ _id: id3 }).lean();
            expect(deletedCount).to.equal(2);
            expect(record4).not.to.exist;
            expect(record5).not.to.exist;
          });
        });

        describe('1.5.4.1.3. When "filters" is given', () => {
          // return;
          it('1.5.4.1.3.1. Should delete the records', async () => {
            const record1 = await Test1.create({ prop1a: 'val1a' });
            const id1 = record1._id.toString();
            const record2 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id2 = record2._id.toString();
            const record3 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id3 = record3._id.toString();
            const token = authorizer.encrypt({ expiresIn: '1m', data: { _id: id1 } });
            const filters = JSON.stringify({ prop2a: 'val2a' });
            const { body: { data: { deletedCount } } } = await superagent
              .delete(`http://localhost:8080/site-1/api/test-2/delete?filters=${filters}`)
              .set('Authorization', `Bearer ${token}`);
            const record4 = await Test2.findOne({ _id: id2 }).lean();
            const record5 = await Test2.findOne({ _id: id3 }).lean();
            expect(deletedCount).to.equal(2);
            expect(record4).not.to.exist;
            expect(record5).not.to.exist;
          });
        });

      });

      describe('1.5.4.2. When the "recordKey" value does not match the "tokenKey" value', () => {
        // return;

        describe('1.5.4.2.1. When "ids" is given with one ID', () => {
          // return;
          it('1.5.4.2.1.1. Should notdelete the record', async () => {
            const record1 = await Test1.create({ prop1a: 'val1a' });
            const id1 = record1._id.toString();
            const record2 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id2 = record2._id.toString();
            const token = authorizer.encrypt({ expiresIn: '1m', data: { _id: id2 } });
            const { body: { data: { deletedCount } } } = await superagent
              .delete(`http://localhost:8080/site-1/api/test-2/delete/${id2}`)
              .set('Authorization', `Bearer ${token}`);
            const record3 = await Test2.findOne({ _id: id2 }).lean();
            expect(deletedCount).to.equal(0);
            expect(record3).to.exist;
          });
        });

        describe('1.5.4.2.2. When "ids" is given with multiple IDs', () => {
          // return;
          it('1.5.4.2.2.1. Should not delete the records', async () => {
            const record1 = await Test1.create({ prop1a: 'val1a' });
            const id1 = record1._id.toString();
            const record2 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id2 = record2._id.toString();
            const record3 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id3 = record3._id.toString();
            const token = authorizer.encrypt({ expiresIn: '1m', data: { _id: id2 } });
            const { body: { data: { deletedCount } } } = await superagent
              .delete(`http://localhost:8080/site-1/api/test-2/delete/${id2},${id3}`)
              .set('Authorization', `Bearer ${token}`);
            const record4 = await Test2.findOne({ _id: id2 }).lean();
            const record5 = await Test2.findOne({ _id: id3 }).lean();
            expect(deletedCount).to.equal(0);
            expect(record4).to.exist;
            expect(record5).to.exist;
          });
        });

        describe('1.5.4.2.3. When "filters" is given', () => {
          // return;
          it('1.5.4.2.3.1. Should not delete the records', async () => {
            const record1 = await Test1.create({ prop1a: 'val1a' });
            const id1 = record1._id.toString();
            const record2 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id2 = record2._id.toString();
            const record3 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id3 = record3._id.toString();
            const token = authorizer.encrypt({ expiresIn: '1m', data: { _id: id2 } });
            const filters = JSON.stringify({ prop2a: 'val2a' });
            const { body: { data: { deletedCount } } } = await superagent
              .delete(`http://localhost:8080/site-1/api/test-2/delete?filters=${filters}`)
              .set('Authorization', `Bearer ${token}`);
            const record4 = await Test2.findOne({ _id: id2 }).lean();
            const record5 = await Test2.findOne({ _id: id3 }).lean();
            expect(deletedCount).to.equal(0);
            expect(record4).to.exist;
            expect(record5).to.exist;
          });
        });

      });

    });

    describe('1.5.5. When "find" is called', () => {
      // return;

      describe('1.5.5.1. When the "recordKey" value matches the "tokenKey" value', () => {
        // return;

        describe('1.5.5.1.1. When "ids" is given with one ID', () => {
          // return;
          it('1.5.5.1.1.1. Should find the record', async () => {
            const record1 = await Test1.create({ prop1a: 'val1a' });
            const id1 = record1._id.toString();
            const record2 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id2 = record2._id.toString();
            const token = authorizer.encrypt({ expiresIn: '1m', data: { _id: id1 } });
            const { body: { data: { record: record3 } } } = await superagent
              .get(`http://localhost:8080/site-1/api/test-2/find/${id2}`)
              .set('Authorization', `Bearer ${token}`);
            expect(record3).to.exist;
          });
        });

        describe('1.5.5.1.2. When "ids" is given with multiple IDs', () => {
          // return;
          it('1.5.5.1.2.1. Should find the records', async () => {
            const record1 = await Test1.create({ prop1a: 'val1a' });
            const id1 = record1._id.toString();
            const record2 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id2 = record2._id.toString();
            const record3 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id3 = record3._id.toString();
            const token = authorizer.encrypt({ expiresIn: '1m', data: { _id: id1 } });
            const { body: { data: { records } } } = await superagent
              .get(`http://localhost:8080/site-1/api/test-2/find/${id2},${id3}`)
              .set('Authorization', `Bearer ${token}`);
            expect(records[0]).to.exist;
            expect(records[1]).to.exist;
          });
        });

        describe('1.5.5.1.3. When "filters" is given', () => {
          // return;
          it('1.5.5.1.3.1. Should find the records', async () => {
            const record1 = await Test1.create({ prop1a: 'val1a' });
            const id1 = record1._id.toString();
            const record2 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id2 = record2._id.toString();
            const record3 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id3 = record3._id.toString();
            const token = authorizer.encrypt({ expiresIn: '1m', data: { _id: id1 } });
            const filters = JSON.stringify({ prop2a: 'val2a' });
            const { body: { data: { records } } } = await superagent
              .get(`http://localhost:8080/site-1/api/test-2/find?filters=${filters}`)
              .set('Authorization', `Bearer ${token}`);
            expect(records[0]).to.exist;
            expect(records[1]).to.exist;
          });
        });

      });

      describe('1.5.5.2. When the "recordKey" value does not match the "tokenKey" value', () => {
        // return;

        describe('1.5.5.2.1. When "ids" is given with one ID', () => {
          // return;
          it('1.5.5.2.1.1. Should not find the record', async () => {
            const record1 = await Test1.create({ prop1a: 'val1a' });
            const id1 = record1._id.toString();
            const record2 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id2 = record2._id.toString();
            const token = authorizer.encrypt({ expiresIn: '1m', data: { _id: id2 } });
            const { body: { data: { record: record3 } } } = await superagent
              .get(`http://localhost:8080/site-1/api/test-2/find/${id2}`)
              .set('Authorization', `Bearer ${token}`);
            expect(record3).not.to.exist;
          });
        });

        describe('1.5.5.2.2. When "ids" is given with multiple IDs', () => {
          // return;
          it('1.5.5.2.2.1. Should not find the records', async () => {
            const record1 = await Test1.create({ prop1a: 'val1a' });
            const id1 = record1._id.toString();
            const record2 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id2 = record2._id.toString();
            const record3 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id3 = record3._id.toString();
            const token = authorizer.encrypt({ expiresIn: '1m', data: { _id: id2 } });
            const { body: { data: { records } } } = await superagent
              .get(`http://localhost:8080/site-1/api/test-2/find/${id2},${id3}`)
              .set('Authorization', `Bearer ${token}`);
            expect(records[0]).not.to.exist;
            expect(records[1]).not.to.exist;
          });
        });

        describe('1.5.5.2.3. When "filters" is given', () => {
          // return;
          it('1.5.5.2.3.1. Should not find the records', async () => {
            const record1 = await Test1.create({ prop1a: 'val1a' });
            const id1 = record1._id.toString();
            const record2 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id2 = record2._id.toString();
            const record3 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id3 = record3._id.toString();
            const token = authorizer.encrypt({ expiresIn: '1m', data: { _id: id2 } });
            const filters = JSON.stringify({ prop2a: 'val2a' });
            const { body: { data: { records } } } = await superagent
              .get(`http://localhost:8080/site-1/api/test-2/find?filters=${filters}`)
              .set('Authorization', `Bearer ${token}`);
            expect(records[0]).not.to.exist;
            expect(records[1]).not.to.exist;
          });
        });

      });

    });

    describe('1.5.6. When "update" is called', () => {
      // return;

      describe('1.5.6.1. When the "recordKey" value matches the "tokenKey" value', () => {
        // return;

        describe('1.5.6.1.1. When "ids" is given with one ID', () => {
          // return;
          it('1.5.6.1.1.1. Should update the record', async () => {
            const record1 = await Test1.create({ prop1a: 'val1a' });
            const id1 = record1._id.toString();
            const record2 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id2 = record2._id.toString();
            const token = authorizer.encrypt({ expiresIn: '1m', data: { _id: id1 } });
            const { body: { data: { record: record3 } } } = await superagent
              .patch(`http://localhost:8080/site-1/api/test-2/update/${id2}`)
              .set('Authorization', `Bearer ${token}`)
              .send({ prop2a: 'val2ai' });
            expect(record3.prop2a).to.equal('val2ai');
          });
        });

        describe('1.5.6.1.2. When "ids" is given with multiple IDs', () => {
          // return;
          it('1.5.6.1.2.1. Should update the records', async () => {
            const record1 = await Test1.create({ prop1a: 'val1a' });
            const id1 = record1._id.toString();
            const record2 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id2 = record2._id.toString();
            const record3 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id3 = record3._id.toString();
            const token = authorizer.encrypt({ expiresIn: '1m', data: { _id: id1 } });
            const { body: { data: { records } } } = await superagent
              .patch(`http://localhost:8080/site-1/api/test-2/update/${id2},${id3}`)
              .set('Authorization', `Bearer ${token}`)
              .send({ prop2a: 'val2ai' });
            expect(records[0].prop2a).to.equal('val2ai');
            expect(records[1].prop2a).to.equal('val2ai');
          });
        });

        describe('1.5.6.1.3. When "filters" is given', () => {
          // return;
          it('1.5.6.1.3.1. Should update the records', async () => {
            const record1 = await Test1.create({ prop1a: 'val1a' });
            const id1 = record1._id.toString();
            const record2 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id2 = record2._id.toString();
            const record3 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id3 = record3._id.toString();
            const token = authorizer.encrypt({ expiresIn: '1m', data: { _id: id1 } });
            const filters = JSON.stringify({ prop2a: 'val2a' });
            const { body: { data: { records } } } = await superagent
              .patch(`http://localhost:8080/site-1/api/test-2/update?filters=${filters}`)
              .set('Authorization', `Bearer ${token}`)
              .send({ prop2a: 'val2ai' });
            expect(records[0].prop2a).to.equal('val2ai');
            expect(records[1].prop2a).to.equal('val2ai');
          });
        });

        describe('1.5.6.1.4. When "body" is given as one object literal', () => {
          // return;
          it('1.5.6.1.4.1. Should update the record', async () => {
            const record1 = await Test1.create({ prop1a: 'val1a' });
            const id1 = record1._id.toString();
            const record2 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id2 = record2._id.toString();
            const token = authorizer.encrypt({ expiresIn: '1m', data: { _id: id1 } });
            const { body: { data: { record: record3 } } } = await superagent
              .patch(`http://localhost:8080/site-1/api/test-2/update`)
              .set('Authorization', `Bearer ${token}`)
              .send({ _id: id2, prop2a: 'val2ai' });
            expect(record3.prop2a).to.equal('val2ai');
          });
        });

        describe('1.5.6.1.4. When "body" is given as one object literal', () => {
          // return;
          it('1.5.6.1.4.1. Should update the records', async () => {
            const record1 = await Test1.create({ prop1a: 'val1a' });
            const id1 = record1._id.toString();
            const record2 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id2 = record2._id.toString();
            const record3 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id3 = record3._id.toString();
            const token = authorizer.encrypt({ expiresIn: '1m', data: { _id: id1 } });
            const { body: { data: { records } } } = await superagent
              .patch(`http://localhost:8080/site-1/api/test-2/update`)
              .set('Authorization', `Bearer ${token}`)
              .send([
                { _id: id2, prop2a: 'val2ai' },
                { _id: id3, prop2a: 'val2aii' }
              ]);
            expect(records[0].prop2a).to.equal('val2ai');
            expect(records[1].prop2a).to.equal('val2aii');
          });
        });

      });

      describe('1.5.6.2. When the "recordKey" value does not match the "tokenKey" value', () => {
        // return;

        describe('1.5.6.2.1. When "ids" is given with one ID', () => {
          // return;
          it('1.5.6.2.1.1. Should not update the record', async () => {
            const record1 = await Test1.create({ prop1a: 'val1a' });
            const id1 = record1._id.toString();
            const record2 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id2 = record2._id.toString();
            const token = authorizer.encrypt({ expiresIn: '1m', data: { _id: id2 } });
            const { body: { data: { record: record3 } } } = await superagent
              .patch(`http://localhost:8080/site-1/api/test-2/update/${id2}`)
              .set('Authorization', `Bearer ${token}`)
              .send({ prop2a: 'val2ai' });
            expect(record3).not.to.exist;
          });
        });

        describe('1.5.6.1.2. When "ids" is given with multiple IDs', () => {
          // return;
          it('1.5.6.1.2.1. Should not update the records', async () => {
            const record1 = await Test1.create({ prop1a: 'val1a' });
            const id1 = record1._id.toString();
            const record2 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id2 = record2._id.toString();
            const record3 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id3 = record3._id.toString();
            const token = authorizer.encrypt({ expiresIn: '1m', data: { _id: id2 } });
            const { body: { data: { records } } } = await superagent
              .patch(`http://localhost:8080/site-1/api/test-2/update/${id2},${id3}`)
              .set('Authorization', `Bearer ${token}`)
              .send({ prop2a: 'val2ai' });
            expect(records[0]).not.to.exist;
            expect(records[1]).not.to.exist;
          });
        });

        describe('1.5.6.1.3. When "filters" is given', () => {
          // return;
          it('1.5.6.1.3.1. Should not update the records', async () => {
            const record1 = await Test1.create({ prop1a: 'val1a' });
            const id1 = record1._id.toString();
            const record2 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id2 = record2._id.toString();
            const record3 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id3 = record3._id.toString();
            const token = authorizer.encrypt({ expiresIn: '1m', data: { _id: id2 } });
            const filters = JSON.stringify({ prop2a: 'val2a' });
            const { body: { data: { records } } } = await superagent
              .patch(`http://localhost:8080/site-1/api/test-2/update?filters=${filters}`)
              .set('Authorization', `Bearer ${token}`)
              .send({ prop2a: 'val2ai' });
            expect(records[0]).not.to.exist;
            expect(records[1]).not.to.exist;
          });
        });

        describe('1.5.6.1.4. When "body" is given as one object literal', () => {
          // return;
          it('1.5.6.1.4.1. Should update the record', async () => {
            const record1 = await Test1.create({ prop1a: 'val1a' });
            const id1 = record1._id.toString();
            const record2 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id2 = record2._id.toString();
            const token = authorizer.encrypt({ expiresIn: '1m', data: { _id: id2 } });
            const { body: { data: { record: record3 } } } = await superagent
              .patch(`http://localhost:8080/site-1/api/test-2/update`)
              .set('Authorization', `Bearer ${token}`)
              .send({ _id: id2, prop2a: 'val2ai' });
            expect(record3).not.to.exist;
          });
        });

        describe('1.5.6.1.4. When "body" is given as one object literal', () => {
          // return;
          it('1.5.6.1.4.1. Should update the records', async () => {
            const record1 = await Test1.create({ prop1a: 'val1a' });
            const id1 = record1._id.toString();
            const record2 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id2 = record2._id.toString();
            const record3 = await Test2.create({ prop2a: 'val2a', test1: id1 });
            const id3 = record3._id.toString();
            const token = authorizer.encrypt({ expiresIn: '1m', data: { _id: id2 } });
            const { body: { data: { records } } } = await superagent
              .patch(`http://localhost:8080/site-1/api/test-2/update`)
              .set('Authorization', `Bearer ${token}`)
              .send([
                { _id: id2, prop2a: 'val2ai' },
                { _id: id3, prop2a: 'val2aii' }
              ]);
            expect(records[0]).not.to.exist;
            expect(records[1]).not.to.exist;
          });
        });

      });

    });

  });

  describe('1.6. When "isSecure" is given', () => {

    describe('1.6.1. When "create" is called', () => {
      it('1.6.1.1. Should allow requests only if the token is valid', async () => {
        const token = authorizer.encrypt({ expiresIn: '1m', data: { prop1: 'val1' } });
        const { body: { data: { record } } } = await superagent
          .post('http://localhost:8080/site-1/api/test-1a/create')
          .set('Authorization', `Bearer ${token}`)
          .send({ prop1a: 'val1a' });
        expect(record.prop1a).to.equal('val1a');

        authorizer.invalidate(token);

        try {
          await superagent
            .post('http://localhost:8080/site-1/api/test-1a/create')
            .set('Authorization', `Bearer ${token}`)
            .send({ prop1a: 'val1a' });
        } catch({ message }) {
          expect(message).to.equal('Unauthorized');
        }

        await Test1.deleteMany();
      });
    });

    describe('1.6.2. When "delete" is called', () => {
      it('1.6.2.1. Should allow requests only if the token is valid', async () => {
        const record1 = await Test1.create({ prop1a: 'val1ai' });
        const id1 = record1._id.toString();
        const token = authorizer.encrypt({ expiresIn: '1m', data: { prop1: 'val1ai' } });
        const { body: { data: { deletedCount } } } = await superagent
          .delete(`http://localhost:8080/site-1/api/test-1c/delete/${id1}`)
          .set('Authorization', `Bearer ${token}`);
        expect(deletedCount).to.equal(1);

        authorizer.invalidate(token);

        const record2a = await Test1.create({ prop1a: 'val1aii' });
        const id2 = record2a._id.toString();
        try {
          await superagent
            .delete(`http://localhost:8080/site-1/api/test-1c/delete/${id2}`)
            .set('Authorization', `Bearer ${token}`);
        } catch({ message }) {
          const record2b = await Test1.findOne({ _id: id2 });
          expect(record2b).to.exist;
          expect(message).to.equal('Unauthorized');
        }

        await Test1.deleteMany();
      });
    });

    describe('1.6.3. When "find" is called', () => {
      it('1.6.3.1. Should allow requests only if the token is valid', async () => {
        const record1 = await Test1.create({ prop1a: 'val1a' });
        const id1 = record1._id.toString();
        const token = authorizer.encrypt({ expiresIn: '1s', data: { prop1: 'val1' } });
        const { body: { data: { record } } } = await superagent
          .get(`http://localhost:8080/site-1/api/test-1c/find/${id1}`)
          .set('Authorization', `Bearer ${token}`);
        expect(record.prop1a).to.equal('val1a');

        authorizer.invalidate(token);

        const record2 = await Test1.create({ prop1a: 'val1a' });
        const id2 = record2._id.toString();
        try {
          await superagent
            .get(`http://localhost:8080/site-1/api/test-1c/find/${id2}`)
            .set('Authorization', `Bearer ${token}`);
        } catch({ message }) {
          expect(message).to.equal('Unauthorized');
        }

        await Test1.deleteMany();
      });
    });

    describe('1.6.4. When "update" is called', () => {
      it('1.6.4.1. Should allow requests only if the token is valid', async () => {
        const record1 = await Test1.create({ prop1a: 'val1ai' });
        const id1 = record1._id.toString();
        const token = authorizer.encrypt({ expiresIn: '1s', data: { prop1: 'val1' } });
        const { body: { data: { record } } } = await superagent
          .patch(`http://localhost:8080/site-1/api/test-1c/update/${id1}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ prop1a: 'val1aii' });
        expect(record.prop1a).to.equal('val1aii');

        authorizer.invalidate(token);

        const record2a = await Test1.create({ prop1a: 'val1aiii' });
        const id2 = record2a._id.toString();
        try {
          await superagent
            .patch(`http://localhost:8080/site-1/api/test-1c/update/${id2}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ prop1a: 'val1iv' });
        } catch({ message }) {
          const record2b = await Test1.findOne({ prop1a: 'val1aiii' });
          const record2c = await Test1.findOne({ prop1a: 'val1aiv' });
          expect(record2b).to.exist;
          expect(record2c).not.to.exist;
          expect(message).to.equal('Unauthorized');
        }

        await Test1.deleteMany();
      });
    });

  });

  after(async () => await afterTests());

});