import persistenceEndpoints from './src/persistenceEndpoints.js';
import CreateRequestHandler from './src/create.request-handler.js';
import DeleteRequestHandler from './src/delete.request-handler.js';
import FindRequestHandler from './src/find.request-handler.js';
import UpdateRequestHandler from './src/update.request-handler.js';
import createRecords from './src/createRecords.js';
import deleteRecords from './src/deleteRecords.js';
import findRecords from './src/findRecords.js';
import updateRecords from './src/updateRecords.js';
import populate from './src/helpers/populate.js';

export default persistenceEndpoints;
export {
  persistenceEndpoints,
  CreateRequestHandler,
  DeleteRequestHandler,
  FindRequestHandler,
  UpdateRequestHandler,
  createRecords,
  deleteRecords,
  findRecords,
  updateRecords,
  populate
};