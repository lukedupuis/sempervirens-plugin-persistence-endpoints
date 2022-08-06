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

import { FindRequestHandler } from '../index.js';

initDb();
initAuthorizer();
startServer([
  {
    path: 'GET /api/test-1/find/:ids?',
    handler: FindRequestHandler,
    data: { modelName: 'Test1' }
  },
  {
    path: 'GET /api/test-2/find/:ids?',
    handler: FindRequestHandler,
    data: {
      modelName: 'Test2',
      max: 50
    }
  },
  {
    path: 'GET /api/test-3/find/:ids?',
    handler: FindRequestHandler,
    data: { modelName: 'Test3' }
  }
]);

const db = dao.getDb('testdb');
const Test1 = db.getModel('Test1');
const Test2 = db.getModel('Test2');
const Test3 = db.getModel('Test3');

describe('1. FindRequestHandler', () => {

  describe('1.1. When "GET /api/find[/{ids}[?filters=[&sort=[&page=[&perPage=[&select=[&populate]]]]]]]]', () => {

    describe('1.1.1. When "GET /api/find/{ids}?filters=" is called', () => {
      it('1.1.1.1. Should return an error', async () => {
        const { body: { error: { message } } } = await superagent
          .get(`http://localhost:8080/api/test-1/find/1234,5678?filters={"prop1a":"val1a"}`);
        expect(message).to.equal([
          '"ids" or "filters" may be used, not both. If more refined ',
          'filtering is needed along with IDs, move the IDs into "filters". ',
          'For example, ?filters={"$or":[{"_id":{"$in":["id1","id2"]}},{"prop1":"val1"}]}.'
        ].join(''));
      });
    });

    describe('1.1.2. When "GET /api/find?sort=" is called', () => {

      describe('1.1.2.1. When "sort" is not parsable', () => {
        it('1.1.2.1.1. Should throw an error', async () => {
          const { body: { error: { message } } } = await superagent
            .get(`http://localhost:8080/api/test-1/find?sort={"prop1a": ""`);
          expect(message).to.equal('"sort" is unparsable.');
        });
      });

      describe('1.1.2.2. When "sort" is valid', () => {
        it('1.1.2.2.1. Should return an array of sorted records', async () => {
          const toCreate = [];
          for (let i = 0; i < 5; i++) {
            toCreate.push({ prop1a: `val1a-${random(50)}` });
          }
          const records1 = toObject(await Test1.insertMany(toCreate))
            .sort((a, b) => sortByProperty(a, b, 'prop1a'));
          const sort = JSON.stringify({ prop1a: 'asc' });
          const { body: { data: { records: records2 } } } = await superagent
            .get(`http://localhost:8080/api/test-1/find?sort=${sort}`);
          expect(records2).to.deep.equal(records1);
          await Test1.deleteMany();
        });
      });

    });

    describe('1.1.3. When "GET /api/find?perPage=" is called', () => {

      describe('1.1.3.1. When "perPage" is greater than "max"', () => {
        it('1.1.3.1.1. Should throw an error', async () => {
          const { body: { error: { message } } } = await superagent
            .get('http://localhost:8080/api/test-2/find?perPage=51');
          expect(message).to.equal([
            'The maximum number of records allowed in one request is ',
            `"50". Please set or reduce the "perPage" number of records.`
          ].join(''));
        });
      });

      describe('1.1.3.2. When "perPage" is less than or equal to "max"', () => {
        it('1.1.3.2.1. Should return the "perPage" number of records', async () => {
          const toCreate = [];
          for (let i = 0; i < 51; i++) {
            toCreate.push({ prop1a: 'val1a' });
          }
          await Test1.insertMany(toCreate);
          const { body: { data: { record, records, totalRecords, totalPages } } } = await superagent
            .get('http://localhost:8080/api/test-1/find?perPage=25');
          expect(record).not.to.exist;
          expect(records.length).to.equal(25);
          expect(totalRecords).to.equal(51);
          expect(totalPages).to.equal(3);
          await Test1.deleteMany();
        });
      });

    });

    describe('1.1.4. When "GET /api/find?page=" is called without "perPage"', () => {
      it('1.1.4.1. Should throw an error', async () => {
        const { body: { error: { message } } } = await superagent
          .get('http://localhost:8080/api/test-1/find?page=2');
        expect(message).to.equal('If "page" is given, then "perPage" is required.');
      });
    });

    describe('1.1.5. When "GET /api/find?perPage=&page=" is called', () => {
      it('1.1.5.1. Should return the given page of results', async () => {
        const records1 = [];
        for (let i = 0; i < 30; i++) {
          records1.push(toObject(await Test1.create({ prop1a: 'val1a' })));
        }
        const { body: { data: { record, records: records2, totalRecords, totalPages } } } = await superagent
          .get('http://localhost:8080/api/test-1/find?perPage=10&page=2');
        expect(record).not.to.exist;
        expect(records2).to.deep.equal(records1.slice(10, 20));
        expect(totalRecords).to.equal(30);
        expect(totalPages).to.equal(3);
        await Test1.deleteMany();
      });
    });

    describe('1.1.6. When "GET /api/find?select=" is called', () => {
      it('1.1.6.1. Should return only the selected properties', async () => {
        const records1 = [];
        for (let i = 0; i < 5; i++) {
          records1.push(toObject(await Test1.create({ prop1a: 'val1a', prop1b: 'val1b' })));
        }
        const { body: { data: { records: records2 } } } = await superagent
          .get('http://localhost:8080/api/test-1/find?select=prop1a,-_id');
        records1.forEach(record => {
          expect(record.prop1a).to.equal('val1a');
          expect(record.prop1b).to.equal('val1b');
        });
        records2.forEach(record => {
          expect(record.prop1a).to.equal('val1a');
          expect(record.prop1b).not.to.exist;
          expect(record._id).not.to.exist;
        });
        await Test1.deleteMany();
      });
    });

    describe('1.1.7. When "GET /api/find?populate=" is called', () => {

      describe('1.1.7.1. When populate is given for one property', () => {
        it('1.1.7.1.1. Should populate the given property for all records', async () => {
          const records1 = [];
          for (let i = 0; i < 5; i++) {
            const test1 = await Test1.create({ prop1a: 'val1a', prop1b: 'val1b' });
            records1.push(toObject(await Test2.create({
              prop2a: 'val1a',
              prop2b: 'val1b',
              test1
            })));
          }
          const populate = JSON.stringify({ path: 'test1', select: '-_id prop1b' });
          const { body: { data: { records: records2 } } } = await superagent
            .get(`http://localhost:8080/api/test-2/find?populate=${populate}`);
          records2.forEach(record => {
            expect(record.test1.prop1b).to.equal('val1b');
            expect(record.test1.prop1a).not.to.exist;
            expect(record.test1._id).not.to.exist;
          });
          await Test1.deleteMany();
        });
      });

      describe('1.1.7.2. When populate is given for multiple properties', () => {
        it('1.1.7.2.1. Shouuld populate the given properties for all records', async () => {
          const records1 = [];
          for (let i = 0; i < 5; i++) {
            const test1 = await Test1.create({ prop1a: 'val1a', prop1b: 'val1b' });
            const test2 = await Test2.create({ prop2a: 'val2a', prop2b: 'val2b' });
            records1.push(toObject(await Test3.create({
              prop2a: 'val1a',
              prop2b: 'val1b',
              test1,
              test2
            })));
          }
          const populate = JSON.stringify([
            { path: 'test1', select: '-_id prop1b' },
            { path: 'test2', select: '-_id prop2b' },
          ]);
          const { body: { data: { records: records2 } } } = await superagent
            .get(`http://localhost:8080/api/test-3/find?populate=${populate}`);
          records2.forEach(record => {
            expect(record.test1.prop1b).to.equal('val1b');
            expect(record.test1.prop1a).not.to.exist;
            expect(record.test1._id).not.to.exist;
            expect(record.test2.prop2b).to.equal('val2b');
            expect(record.test2.prop2a).not.to.exist;
            expect(record.test2._id).not.to.exist;
          });
          await Test1.deleteMany();
        });
      });

    });

    describe('1.1.8. When "max" is given in "data"', () => {
      it('1.1.2.1. Should return an error', async () => {
        for (let i = 0; i < 110; i++) {
          await Test2.create({ prop1a: 'val1a' });
        }
        const { body: { error: { message } } } = await superagent
          .get('http://localhost:8080/api/test-2/find');
        expect(message).to.equal([
          'The maximum number of records allowed in one request is ',
          `"50". Please set or reduce the "perPage" number of records.`
        ].join(''));
        await Test2.deleteMany();
      });
    });

  });

  describe('1.2. When "GET /api/find" is called', () => {

    describe('1.2.1. When results are found', () => {
      it('1.2.1.1. Should return the records', async () => {
        for (let i = 0; i < 110; i++) {
          await Test1.create({ prop1a: 'val1a' });
        }
        const { body: { data: { records } } } = await superagent
          .get('http://localhost:8080/api/test-1/find');
        expect(records.length).to.equal(110);
        await Test1.deleteMany();
      });
    });

    describe('1.2.2. When no results are found', () => {
      it('1.1.2.1. Should return an empty array', async () => {
        const { body: { data: { records } } } = await superagent
          .get('http://localhost:8080/api/test-1/find');
        expect(records).to.be.empty;
      });
    });

  });

  describe('1.2. When "GET /api/find/{ids}" is called', () => {

    describe('1.2.1. When only one ID is given', () => {
      it('1.2.1.1. Should return one record', async () => {
        const records1 = [];
        for (let i = 0; i < 5; i++) {
          records1.push(toObject(await Test1.create({ prop1a: 'val1a' })));
        }
        const ids = records1[0]._id;
        const { body: { data: { record, records, totalRecords, totalPages } } } = await superagent
          .get(`http://localhost:8080/api/test-1/find/${ids}`);
        expect(record._id).to.equal(ids);
        expect(records).not.to.exist;
        expect(totalRecords).to.equal(1);
        expect(totalPages).to.be.null;
        await Test1.deleteMany();
      });
    });

    describe('1.2.2. When multiple IDs are given', () => {
      it('1.2.2.1. Should return one record', async () => {
        const records1 = [];
        for (let i = 0; i < 5; i++) {
          records1.push(toObject(await Test1.create({ prop1a: 'val1a' })));
        }
        const ids = [records1[0]._id, records1[1]._id, records1[2]._id];
        const { body: { data: { record, records: records2, totalRecords, totalPages } } } = await superagent
          .get(`http://localhost:8080/api/test-1/find/${ids.join()}`);
        expect(record).not.to.exist;
        expect(records2.length).to.equal(3);
        expect(totalRecords).to.equal(3);
        expect(totalPages).to.be.null;
        expect(records2[0]._id).to.equal(ids[0]);
        expect(records2[1]._id).to.equal(ids[1]);
        expect(records2[2]._id).to.equal(ids[2]);
        await Test1.deleteMany();
      });
    });

  });

  describe('1.3. When "GET /api/find?filters=" is called', () => {

    describe('1.3.1. When no records are found', () => {
      it('1.3.1.1. Should return an empty array', async () => {
        for (let i = 0; i < 5; i++ ){
          await Test1.create({ prop1a: 'val1ai' });
        }
        const filters = JSON.stringify({ prop1a: 'val1a' });
        const { body: { data: { records } } } = await superagent
          .get(`http://localhost:8080/api/test-1/find?filters=${filters}`);
        expect(records).to.be.empty;
        await Test1.deleteMany();
      });
    });

    describe('1.3.2. When records are found', () => {
      it('1.3.2.1. Should return the records', async () => {
        for (let i = 0; i < 4; i++) {
          await Test1.create({ prop1a: 'val1ai' });
        }
        await Test1.create({ prop1a: 'val1aii' });
        const filters = JSON.stringify({ prop1a: 'val1ai' });
        const { body: { data: { records } } } = await superagent
          .get(`http://localhost:8080/api/test-1/find?filters=${filters}`);
        expect(records.length).to.equal(4);
        await Test1.deleteMany();
      });
    });

  });

  after(async () => await afterTests());

});