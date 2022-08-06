import { expect } from 'chai';
import superagent from 'superagent';
import dao from '@sempervirens/dao';

import {
  initDb,
  initAuthorizer,
  startServer,
  afterTests,
  toObject,
  random,
  sortByProperty
} from './helpers/index.js';

import { UpdateRequestHandler } from '../index.js';

initDb();
initAuthorizer();
startServer([
  {
    path: 'PATCH /api/test-1/update/:ids?',
    handler: UpdateRequestHandler,
    data: {
      modelName: 'Test1',
      max: 10
    }
  },
  {
    path: 'PATCH /api/test-2/update/:ids?',
    handler: UpdateRequestHandler,
    data: { modelName: 'Test2' }
  }
]);

const db = dao.getDb('testdb');
const Test1 = db.getModel('Test1');
const Test2 = db.getModel('Test2');

describe('1. UpdateRequestHandler', () => {

  describe('1.1. When "PATCH /api/update[/{ids}[?filters=[&sort=[&populate]]]]]]] is called', () => {

    describe('1.1.1. When "PATCH /api/update[/{ids}[?filters=]]" is called without a "body"', () => {
      it('1.1.1.1. Should return an error', async () => {
        const { body: { error: { message } } } = await superagent
          .patch('http://localhost:8080/api/test-1/update')
          .send();
        expect(message).to.equal('"body" is required.');
      });
    });

    describe('1.1.2. When "PATCH /api/update/{ids}?filters=" is called', () => {
      it('1.1.2.1. Should return an error', async () => {
        const { body: { error: { message } } } = await superagent
          .patch(`http://localhost:8080/api/test-1/update/1234?filters={"prop1a":"val1a"}`)
          .send({ prop1a: 'val1a' });
        expect(message).to.equal([
          '"ids" or "filters" may be used, not both. If more refined ',
          'filtering is needed along with IDs, move the IDs into "filters". ',
          'For example, ?filters={"$or":[{"_id":{"$in":["id1","id2"]}},{"prop1":"val1"}]}.'
        ].join(''));
      });
    });

    describe('1.1.3. When "PATCH /api/update/{ids}" is called with a "body" array', () => {
      it('1.1.3.1. Should return an error', async () => {
        const { body: { error: { message } } } = await superagent
          .patch(`http://localhost:8080/api/test-1/update/1234,5678`)
          .send([{ prop1a: 'val1a' }]);
        expect(message).to.equal([
          'To update multiple records separately, omit "ids" and "filters" ',
          'and send the IDs on each object in the "body" array. Otherwise, to update ',
          'multiple objects with the same body, send the body as one object literal.'
        ].join(''));
      });
    });

    describe('1.1.4. When "PATCH /api/update?filters=" is called with a "body" array', () => {
      it('1.1.4.1. Should return an error', async () => {
        const { body: { error: { message } } } = await superagent
          .patch(`http://localhost:8080/api/test-1/update?filters={"prop1a":"val1a"}`)
          .send([{ prop1a: 'val1a' }]);
        expect(message).to.equal([
          'To update multiple records separately, omit "ids" and "filters" ',
          'and send the IDs on each object in the "body" array. Otherwise, to update ',
          'multiple objects with the same body, send the body as one object literal.'
        ].join(''));
      });
    });

    describe('1.1.5. When "PATCH /api/update" is called with a "body" array and an object is missing "id" and "_id"', () => {
      it('1.1.5.1. Should throw an error', async () => {
        const { body: { error: { message } } } = await superagent
          .patch(`http://localhost:8080/api/test-1/update`)
          .send([{ prop1a: 'val1a' }]);
        expect(message).to.equal([
          'If "body" is an array, then "_id" or "id" must be exist ',
          'on each object.'
        ].join(''));
      });
    });

    describe('1.1.6. When "Patch /api/update" is called with "body" as an object literal and is missing "id" and "_id"', () => {
      it('1.1.6.1. Should throw an error', async () => {
        const { body: { error: { message } } } = await superagent
          .patch(`http://localhost:8080/api/test-1/update`)
          .send({ prop1a: 'val1a' });
        expect(message).to.equal([
          'If "ids" and "filters" are not given, then "_id" or "id" must ',
          'exist on the "body" object(s).'
        ].join(''));
      });
    });

    describe('1.1.7. When the given number of records to update exceeds the data "max"', () => {

      describe('1.1.7.1 When "ids" is given', () => {
        it('1.1.7.1.1. Should return an error', async () => {
          const ids = [];
          for (let i = 0; i < 11; i++) {
            const record = await Test1.create({ prop1a: 'val1ai' });
            ids.push(record._id.toString());
          }
          const { body: { error: { message } } } = await superagent
            .patch(`http://localhost:8080/api/test-1/update/${ids.join()}`)
            .send({ prop1a: 'val1aii' });
          expect(message).to.equal('The maximum number of records allowed in one request is 10.');
          await Test1.deleteMany();
        });
      });

      describe('1.1.7.2 When "filters" is given', () => {
        it('1.1.7.2.1. Should return an error that suggests narrowing filters', async () => {
          for (let i = 0; i < 11; i++) {
            await Test1.create({ prop1a: 'val1ai' });
          }
          const filters = JSON.stringify({ prop1a: 'val1ai' });
          const { body: { error: { message } } } = await superagent
            .patch(`http://localhost:8080/api/test-1/update?filters=${filters}`)
            .send({ prop1a: 'val1aii' });
          expect(message).to.equal('The maximum number of records allowed in one request is 10.');
          await Test1.deleteMany();
        });
      });

      describe('1.1.7.3 When a body array is given', () => {
        it('1.1.7.3.1. Should return an error', async () => {
          const toUpdate = [];
          for (let i = 0; i < 11; i++) {
            const record = await Test1.create({ prop1a: 'val1ai' });
            toUpdate.push({
              _id: record._id.toString(),
              prop1a: 'val1aii'
            });
          }
          const { body: { error: { message } } } = await superagent
            .patch(`http://localhost:8080/api/test-1/update`)
            .send(toUpdate);
          expect(message).to.equal('The maximum number of records allowed in one request is 10.');
          await Test1.deleteMany();
        });
      });

    });

    describe('1.1.8. When one or more records is updated', () => {
      it('1.1.8.1. Should call the model pre-save hook', async () => {
        const record1 = await Test1.create({ prop1a: 'val1a', prop1b: 'val1b' });
        const ids1 = record1._id.toString();
        const { body: { data: { record: record2 } } } = await superagent
          .patch(`http://localhost:8080/api/test-1/update/${ids1}`)
          .send({ prop1a: 'val1c', prop1b: 'val1d' });
        expect(record2.prop1c).to.equal('val1c-val1d');
        await Test1.deleteMany();

        const ids2 = [];
        for (let i = 0; i < 3; i++) {
          const record = await Test1.create({ prop1a: 'val1a', prop1b: 'val1b' });
          ids2.push(record._id.toString());
        }
        const { body: { data: { records } } } = await superagent
          .patch(`http://localhost:8080/api/test-1/update/${ids2}`)
          .send({ prop1a: 'val1c', prop1b: 'val1d' });
        records.forEach(record => {
          expect(record.prop1c).to.equal('val1c-val1d');
        });
        await Test1.deleteMany();
      });
    });

  });

  describe('1.2. When "PATCH /api/update" is called', () => {

    describe('1.2.1. When "body" is an object literal with "_id" or "id"', () => {
      it('1.2.1.1. Should update the record', async () => {
        const record1 = await Test1.create({ prop1a: 'val1ai' });
        const { body: { data: { record: record2 } } } = await superagent
          .patch('http://localhost:8080/api/test-1/update')
          .send({
            _id: record1._id.toString(),
            prop1a: 'val1aii'
          });
        expect(record2.prop1a).to.equal('val1aii');
        await Test1.deleteMany();
      });
    });

    describe('1.2.2. When "body" is an array of objects with "_id" or "id"', () => {
      it('1.2.2.1. Should update the record', async () => {
        const toUpdate = [];
        for (let i = 0; i < 3; i++) {
          const record = await Test1.create({ prop1a: 'val1ai' });
          toUpdate.push({
            _id: record._id.toString(),
            prop1a: 'val1aii'
          });
        }
        const { body: { data: { records } } } = await superagent
          .patch('http://localhost:8080/api/test-1/update')
          .send(toUpdate);
        records.forEach(record => {
          expect(record.prop1a).to.equal('val1aii');
        });
        await Test1.deleteMany();
      });
    });

  });

  describe('1.3. When "PATCH /api/update/{ids}" is called', () => {

    describe('1.3.1. When one ID is given with body as one object literal', () => {
      it('1.3.1.1. Should update the record', async () => {
        const record1 = await Test1.create({ prop1a: 'val1ai' });
        const ids = record1._id.toString();
        const { body: { data: { record: record2 } } } = await superagent
          .patch(`http://localhost:8080/api/test-1/update/${ids}`)
          .send({ prop1a: 'val1aii' });
        expect(record2.prop1a).to.equal('val1aii');
        await Test1.deleteMany();
      });
    });

    describe('1.3.2. When multiple IDs are given with body as one object literal', () => {
      it('1.3.2.1. Should update all the records with the same values', async () => {
        const ids = [];
        for (let i = 0; i < 3; i++) {
          const record = await Test1.create({ prop1a: 'val1ai' });
          ids.push(record._id.toString());
        }
        const { body: { data: { records } } } = await superagent
          .patch(`http://localhost:8080/api/test-1/update/${ids.join()}`)
          .send({ prop1a: 'val1aii' });
        records.forEach(record => {
          expect(record.prop1a).to.equal('val1aii');
        });
        await Test1.deleteMany();
      });
    });

  });

  describe('1.4. When "PATCH /api/update?filters=" is called', () => {

    describe('1.4.1. When one filter matches', () => {
      it('1.4.1.1. Should update the one record', async () => {
        await Test1.create({ prop1a: 'val1ai' });
        const filters = JSON.stringify({ prop1a: 'val1ai' });
        const { body: { data: { records } } } = await superagent
          .patch(`http://localhost:8080/api/test-1/update?filters=${filters}`)
          .send({ prop1a: 'val1aii' });
        expect(records.length).to.equal(1);
        expect(records[0].prop1a).to.equal('val1aii');
        await Test1.deleteMany();
      });
    });

    describe('1.4.2. When multiple filters match', () => {
      it('1.4.2.1. Should update all the records with the same values', async () => {
        for (let i = 0; i < 3; i++) {
          await Test1.create({ prop1a: 'val1ai' });
        }
        const filters = JSON.stringify({ prop1a: 'val1ai' });
        const { body: { data: { records } } } = await superagent
          .patch(`http://localhost:8080/api/test-1/update?filters=${filters}`)
          .send({ prop1a: 'val1aii' });
        expect(records.length).to.equal(3);
        records.forEach(record => {
          expect(record.prop1a).to.equal('val1aii');
        });
        await Test1.deleteMany();
      });
    });

  });

  describe('1.5. When "PATCH /api/update?sort=" is called', () => {

    describe('1.5.1. When "ids" is given', () => {
      it('1.5.1.1. Should sort the results', async () => {
        const ids = [];
        const records1 = [];
        for (let i = 0; i < 5; i++) {
          const record = await Test1.create({
            prop1a: 'val1ai',
            prop1b: `val1b-${random(10, 50)}`
          });
          ids.push(record._id.toString());
          records1.push(toObject(record));
        }
        const { body: { data: { records: records2 } } } = await superagent
          .patch(`http://localhost:8080/api/test-1/update/${ids.join()}?sort=prop1b`)
          .send({ prop1a: 'val1aii' });
        const sortedIds1 = records1
          .sort((a, b) => sortByProperty(a, b, 'prop1b'))
          .map(record => record._id);
        const sortedIds2 = records2
          .map(record => record._id);
        expect(sortedIds2).to.deep.equal(sortedIds1);
        records2.forEach(record => {
          expect(record.prop1a).to.equal('val1aii');
        });
        await Test1.deleteMany();
      });
    });

    describe('1.5.2. When "filters" is given', () => {
      it('1.5.2.1. Should sort the results', async () => {
        const ids = [];
        const records1 = [];
        for (let i = 0; i < 5; i++) {
          const record = await Test1.create({
            prop1a: 'val1ai',
            prop1b: `val1b-${random(10, 50)}`
          });
          ids.push(record._id.toString());
          records1.push(toObject(record));
        }
        const filters = JSON.stringify({ prop1a: 'val1ai' });
        const { body: { data: { records: records2 } } } = await superagent
          .patch(`http://localhost:8080/api/test-1/update?filters=${filters}&sort=prop1b`)
          .send({ prop1a: 'val1aii' });
        const sortedIds1 = records1
          .sort((a, b) => sortByProperty(a, b, 'prop1b'))
          .map(record => record._id);
        const sortedIds2 = records2
          .map(record => record._id);
        expect(sortedIds2).to.deep.equal(sortedIds1);
        records2.forEach(record => {
          expect(record.prop1a).to.equal('val1aii');
        });
        await Test1.deleteMany();
      });
    });

    describe('1.5.3. When "_id" is given in an array of body objects', () => {
      it('1.5.3.1. Should sort the results', async () => {
        const ids = [];
        const records1 = [];
        for (let i = 0; i < 5; i++) {
          const record = await Test1.create({
            prop1a: 'val1ai',
            prop1b: `val1b-${random(10, 50)}`
          });
          ids.push(record._id.toString());
          records1.push(toObject(record));
        }
        const toUpdate = records1.map(record => {
          return { ...record, prop1a: 'val1aii' };
        });
        const { body: { data: { records: records2 } } } = await superagent
          .patch(`http://localhost:8080/api/test-1/update?sort=prop1b`)
          .send(toUpdate);
        const sortedIds1 = records1
          .sort((a, b) => sortByProperty(a, b, 'prop1b'))
          .map(record => record._id);
        const sortedIds2 = records2
          .map(record => record._id);
        expect(sortedIds2).to.deep.equal(sortedIds1);
        records2.forEach(record => {
          expect(record.prop1a).to.equal('val1aii');
        });
        await Test1.deleteMany();
      });
    });

  });

  describe('1.6. When "PATCH /api/update?populate=" is called', () => {

    describe('1.6.1. When "ids" is given', () => {
      it('1.6.1.1. Should populate the given path', async () => {
        const test1 = await Test1.create({ prop1a: 'val1a' });
        const ids = [];
        for (let i = 0; i < 3; i++) {
          const record = await Test2.create({ prop2a: 'val2ai', test1 });
          ids.push(record._id.toString());
        }
        const { body: { data: { records: records1 } } } = await superagent
          .patch(`http://localhost:8080/api/test-2/update/${ids.join()}?populate=test1`)
          .send({ prop2a: 'val2aii' });
        expect((await Test2.find({ prop2a: 'val2aii' })).length).to.equal(3);
        records1.forEach(record => {
          expect(record.test1.prop1a).to.equal('val1a');
        });
        await Test2.deleteMany();
        await Test1.deleteMany();
      });
    });

    describe('1.6.2. When "filters" is given', () => {
      it('1.6.2.1. Should populate the given path', async () => {
        const test1 = await Test1.create({ prop1a: 'val1a' });
        for (let i = 0; i < 3; i++) {
          await Test2.create({ prop2a: 'val2ai', test1 });
        }
        const filters = JSON.stringify({ prop2a: 'val2ai' });
        const { body: { data: { records: records1 } } } = await superagent
          .patch(`http://localhost:8080/api/test-2/update/?filters=${filters}&populate=test1`)
          .send({ prop2a: 'val2aii' });
        expect((await Test2.find({ prop2a: 'val2aii' })).length).to.equal(3);
        records1.forEach(record => {
          expect(record.test1.prop1a).to.equal('val1a');
        });
        await Test2.deleteMany();
        await Test1.deleteMany();
      });
    });

    describe('1.6.3. When "_id" is given in an array of body objects', () => {
      it('1.6.3.1. Should populate the given path', async () => {
        const toUpdate = [];
        const test1 = await Test1.create({ prop1a: 'val1a' });
        for (let i = 0; i < 3; i++) {
          const record = await Test2.create({ prop2a: 'val2ai', test1 });
          toUpdate.push({ _id: record._id.toString(), prop2a: 'val2aii' });
        }
        const { body: { data: { records: records1 } } } = await superagent
          .patch(`http://localhost:8080/api/test-2/update/?populate=test1`)
          .send(toUpdate);
        expect((await Test2.find({ prop2a: 'val2aii' })).length).to.equal(3);
        records1.forEach(record => {
          expect(record.test1.prop1a).to.equal('val1a');
        });
        await Test2.deleteMany();
        await Test1.deleteMany();
      });
    });

  });

  after(async () => await afterTests());

});