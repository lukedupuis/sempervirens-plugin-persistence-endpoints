import dao from '@sempervirens/dao';

const afterTests = async () => {
  await new Promise(resolve => setTimeout(() => resolve(), 500));
  await dao.getDb('testdb').connection.dropDatabase();
  setTimeout(() => process.exit(), 500);
};

export default afterTests;