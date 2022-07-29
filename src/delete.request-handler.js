import dao from '@sempervirens/dao';
import { RequestHandler } from '@sempervirens/endpoint';
import deleteRecords from './deleteRecords.js';
import parseBindWithToken from './helpers/parseBindWithToken.js';

class DeleteRequestHandler extends RequestHandler {

  #Model;

  constructor({ req, res, data, isSecure }) {
    super({ req, res, data, isSecure });
    if (!this.isAuthorized) return;
    this.#Model = dao.getModel(data.dbName, data.modelName);
    this.#init(req.params, req.query);
  }

  async #init({
    ids = null
  }, {
    filters = null
  }) {
    try {
      const deletedCount = await deleteRecords(this.#Model, {
        ids,
        filters,
        max: this.data.max,
        dbName: this.data.dbName,
        removeRefs: this.data.removeRefs,
        bindWithToken: parseBindWithToken({
          req: this.req,
          ...this.data.bindWithToken
        })
      });
      this.send({ data: { deletedCount } });
    } catch(error) {
      this.error({ number: 234209, error });
    }
  }

}

export default DeleteRequestHandler;