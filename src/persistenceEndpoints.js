import kebabCase from 'lodash.kebabcase';
import CreateRequestHandler from './create.request-handler.js';
import DeleteRequestHandler from './delete.request-handler.js';
import FindRequestHandler from './find.request-handler.js';
import UpdateRequestHandler from './update.request-handler.js';

const persistenceEndpoints = data => {
  return data.reduce((endpoints, {
    modelName = '',
    modelBasePath = '',
    apiBasePath = '/api',

    create = {
      max: null,
      bindWithToken: null,
      isSecure: false
    },
    delete: _delete = {
      max: null,
      bindWithToken: null,
      isSecure: false
    },
    find = {
      max: null,
      bindWithToken: null,
      isSecure: false
    },
    update = {
      max: null,
      bindWithToken: null,
      isSecure: false
    }
  }) => {

    modelBasePath = modelBasePath || kebabCase(modelName);
    if (apiBasePath.charAt(0) != '/') apiBasePath = `/${apiBasePath}`;
    if (modelBasePath.charAt(0) != '/') modelBasePath = `/${modelBasePath}`;

    const createData = { modelName, ...create };
    const deleteData = { modelName, ..._delete };
    const findData = { modelName, ...find };
    const updateData = { modelName, ...update };

    endpoints.push(
      {
        path: `POST ${apiBasePath}${modelBasePath}/create`,
        handler: CreateRequestHandler,
        isSecure: create.isSecure,
        data: createData
      },
      {
        path: `DELETE ${apiBasePath}${modelBasePath}/delete/:ids?`,
        handler: DeleteRequestHandler,
        isSecure: _delete.isSecure,
        data: deleteData
      },
      {
        path: `GET ${apiBasePath}${modelBasePath}/find/:ids?`,
        handler: FindRequestHandler,
        isSecure: find.isSecure,
        data: findData
      },
      {
        path: `PATCH ${apiBasePath}${modelBasePath}/update/:ids?`,
        handler: UpdateRequestHandler,
        isSecure: update.isSecure,
        data: updateData
      }
    );

    return endpoints;
  }, []);
};

export default persistenceEndpoints;