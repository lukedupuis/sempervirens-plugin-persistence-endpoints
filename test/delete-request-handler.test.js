import { expect } from 'chai';
import superagent from 'superagent';
import dao from '@sempervirens/dao';

import { initDb, initAuthorizer, startServer, afterTests, toObject } from './helpers/index.js';

import { DeleteRequestHandler } from '../index.js';

initDb();
initAuthorizer();

startServer([
  {
    path: 'DELETE /api/test-1/delete/:ids?', // Path should be kebab-case of the data: modelName
    handler: DeleteRequestHandler,
    data: {                      // Remove refs explanation
      modelName: 'Test1',        // <-- When deleting any record from this collection
      removeRefs: [              //     remove references to the deleted record
        {
          field: 'test1',        // <-- from this field
          modelName: 'Test2'     // <-- in all records in this collection
        },
        {
          field: 'test1s',
          modelName: 'Test2'
        }
      ],
      max: 5
    }
  }
]);

const db = dao.getDb('testdb');
const Test1 = db.getModel('Test1');
const Test2 = db.getModel('Test2');

describe('1. DeleteRequestHandler', () => {

  describe('1.1. When "POST /api/{kebab-case-model-name}/delete[/:ids?[?filters=]]" is called', () => {
    // return;

    describe('1.1.1. When "ids" or "filters" are not given', () => {
      // return;
      it('1.1.1.1. Should return a USER_ERROR', async () => {
        const { body: { error: { message } } } = await superagent
          .delete(`http://localhost:8080/site-1/api/test-1/delete`);
        expect(message).to.equal('"ids" or "filters" are required.');
      });
    });

    describe('1.1.2. When "ids" and "filters" is given', () => {
      // return;
      it('1.1.2.1. Should return a USER_ERROR', async () => {
        const { body: { error: { message } } } = await superagent
          .delete(`http://localhost:8080/site-1/api/test-1/delete/1234,5678?filters={"prop1a":"val1a"}`);
        expect(message).to.equal([
          '"ids" or "filters" may be used, not both. If more refined ',
          'filtering is needed along with IDs, move the IDs into "filters".'
        ].join(''));
      });
    });

    describe('1.1.3. When an ID is invalid', () => {
      // return;
      it('1.1.3.1. Should return a USER_ERROR', async () => {
        const { body: { error: { message } } } = await superagent
          .delete(`http://localhost:8080/site-1/api/test-1/delete/asdf`);
        expect(message).to.equal('One or more ID is not valid.');
      });
    });

    describe('1.1.4. When "filters" is not a valid JSON string', () => {
      // return;
      it('1.1.4.1. Should return a USER_ERROR', async () => {
        const { body: { error: { message } } } = await superagent
          .delete(`http://localhost:8080/site-1/api/test-1/delete?filters=asdf`);
        expect(message).to.equal('"filters" are unparsable.');
      });
    });

    describe('1.1.5. When the record does not exist', () => {
      // return;
      it('1.1.5.1. Should return "deletedCount" as "0"', async () => {
        const record1 = await Test1.create({ prop1a: 'val1a' });
        const _id = record1._id;
        await Test1.deleteOne({ _id });
        const { body: { data: { deletedCount } } } = await superagent
          .delete(`http://localhost:8080/site-1/api/test-1/delete/${_id}`);
        expect(deletedCount).to.equal(0);
      });
    });

    describe('1.1.6. When the number of "ids" exceeds the max allowed', () => {
      // return;
      it('1.1.6.1. Should return an error', async () => {
        const ids = [];
        for (let i = 0; i < 6; i++) {
          const record = await Test1.create({ prop1a: 'val1a' });
          ids.push(record._id.toString());
        }
        const { body: { error: { message } } } = await superagent
          .delete(`http://localhost:8080/site-1/api/test-1/delete/${ids.join()}`);
        expect(message).to.equal('The maximum number of records allowed in one request is 5.');
        await Test1.deleteMany();
      });
    });

    describe('1.1.7. When the number of records returned from "filters" exceeds the max allowed', () => {
      // return;
      it('1.1.7.1. Should return an error', async () => {
        for (let i = 0; i < 6; i++) {
          await Test1.create({ prop1a: 'val1a' });
        }
        const filters = JSON.stringify({ prop1a: 'val1a' });
        const { body: { error: { message } } } = await superagent
          .delete(`http://localhost:8080/site-1/api/test-1/delete?filters=${filters}`);
        expect(message).to.equal('The maximum number of records allowed in one request is 5.');
        await Test1.deleteMany();
      });
    });

  });

  describe('1.2. When "POST /api/{kebab-case-model-name}/delete/:ids" is called', () => {
    // return;

    describe('1.2.1. When one ID is given', () => {
      // return;
      it('1.2.1.1. Should delete the record', async () => {
        const record = await Test1.create({});
        const ids = record.id;
        const { body: { data: { deletedCount } } } = await superagent
          .delete(`http://localhost:8080/site-1/api/test-1/delete/${ids}`);
        expect(deletedCount).to.equal(1);
        expect(await Test1.findById(record._id)).not.to.exist;
      });
    });

    describe('1.2.2. When multiple IDs are given', () => {
      // return;
      it('1.2.2.1. Should delete all the records', async () => {
        const record1 = await Test1.create({});
        const record2 = await Test1.create({});
        const record3 = await Test1.create({});
        const ids = `${record1._id},${record2._id},${record3._id}`;
        const { body: { data: { deletedCount } } } = await superagent
          .delete(`http://localhost:8080/site-1/api/test-1/delete/${ids}`);
        expect(deletedCount).to.equal(3);
        expect(await Test1.findById(record1._id)).not.to.exist;
        expect(await Test1.findById(record2._id)).not.to.exist;
        expect(await Test1.findById(record3._id)).not.to.exist;
      });
    });

  });

  describe('1.3. When "POST /api/{kebab-case-model-name}/delete?filters=" is called', () => {
    // return;

    describe('1.3.1. When the filters match one record', () => {
      // return;
      it('1.3.1.1. Should delete the record', async () => {
        const record = await Test1.create({ prop1a: 'val1a' });
        const filters = JSON.stringify({ prop1a: 'val1a' });
        const { body: { data: { deletedCount } } } = await superagent
          .delete(`http://localhost:8080/site-1/api/test-1/delete?filters=${filters}`);
        expect(deletedCount).to.equal(1);
        expect(await Test1.findById(record._id)).not.to.exist;
      });
    });

    describe('1.3.2. When the filters match one record', () => {
      // return;
      it('1.3.2.1. Should delete all the records', async () => {
        const record1 = await Test1.create({ prop1a: 'val1a' });
        const record2 = await Test1.create({ prop1a: 'val1a' });
        const record3 = await Test1.create({ prop1b: 'val1b' });
        const filters = JSON.stringify({
          $or: [
            { prop1a: 'val1a' },
            { prop1b: 'val1b' }
          ]
        });
        const { body: { data: { deletedCount } } } = await superagent
          .delete(`http://localhost:8080/site-1/api/test-1/delete?filters=${filters}`);
        expect(deletedCount).to.equal(3);
        expect(await Test1.findById(record1._id)).not.to.exist;
        expect(await Test1.findById(record2._id)).not.to.exist;
        expect(await Test1.findById(record3._id)).not.to.exist;
      });
    });

  });

  describe('1.4. When "removeRefs" is given', () => {
    // return;

    describe('1.4.1. When the referenced field is a single document field', () => {
      // return;
      it('1.4.1.1. Should remove the reference from the field', async () => {
        const record1 = await Test1.create({});
        const record2a = await Test2.create({ test1: record1._id });
        const ids = record1._id;
        const { body: { data: { deletedCount } } } = await superagent
          .delete(`http://localhost:8080/site-1/api/test-1/delete/${ids}`);
        const record2b = await Test2.findById(record2a._id);
        expect(deletedCount).to.equal(1);
        expect(record2b.test1).to.be.null;
      });
    });

    describe('1.4.2. When the referenced field is an array of multiple documents', () => {
      // return;
      it('1.4.2.1. Should remove the reference from the field array', async () => {
        const record1 = await Test1.create({});
        const record2 = await Test1.create({});
        const record3 = await Test1.create({});
        let record4 = await Test2.create({ test1s: [record1._id, record2._id, record3._id] });
        const ids = `${record1._id},${record2._id}`;
        const { body: { data: { deletedCount } } } = await superagent
          .delete(`http://localhost:8080/site-1/api/test-1/delete/${ids}`);
        record4 = await Test2.findById(record4._id);
        expect(deletedCount).to.equal(2);
        expect(record4.test1s.find(_id => _id.toString() == record3._id.toString())).to.exist;
      });
    });

  });

  after(async () => await afterTests());

});