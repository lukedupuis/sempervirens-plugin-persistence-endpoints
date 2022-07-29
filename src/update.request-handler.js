import dao from '@sempervirens/dao';
import { RequestHandler } from '@sempervirens/endpoint';
import parseBindWithToken from './helpers/parseBindWithToken.js';

import updateRecords from './updateRecords.js';

class UpdateRequestHandler extends RequestHandler {

  #Model;

  constructor({ req, res, data, isSecure }) {
    super({ req, res, data, isSecure });
    if (!this.isAuthorized) return;
    this.#Model = dao.getModel(data.dbName, data.modelName);
    this.#init(req.params, req.query, req.body);
  }

  async #init({ ids }, {
    filters,
    sort,
    populate
  }, body) {
    try {
      const {
        record,
        records
      } = await updateRecords(this.#Model, body, {
        ids,
        filters,
        sort,
        populate,
        max: this.data.max,
        bindWithToken: parseBindWithToken({
          req: this.req,
          ...this.data.bindWithToken
        })
      });
      if (record !== undefined) {
        this.send({ data: { record } });
      } else if (records !== undefined) {
        this.send({ data: { records } });
      }
    } catch(error) {
      this.error({ number: 413081, error });
    }
  }

}

export default UpdateRequestHandler;