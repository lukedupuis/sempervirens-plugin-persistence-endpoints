import dao from '@sempervirens/dao';

import test1Model from '../models/test1.model.js';
import test2Model from '../models/test2.model.js';
import test3Model from '../models/test3.model.js';

const initDb = () => {
  dao.initDb({
    host: 'localhost',
    port: '27017',
    connectionOptions: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    },
    name: 'testdb',
    models: [
      test1Model,
      test2Model,
      test3Model
    ]
  });
}

export default initDb;