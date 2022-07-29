import dao from '@sempervirens/dao';
import { RequestHandler } from '@sempervirens/endpoint';
import parseBindWithToken from './helpers/parseBindWithToken.js';

import findRecords from './findRecords.js';

class FindRequestHandler extends RequestHandler {

  #Model;

  constructor({ req, res, data, isSecure }) {
    super({ req, res, data, isSecure });
    if (!this.isAuthorized) return;
    this.#Model = dao.getModel(data.dbName, data.modelName);
    this.#init(req.params, req.query);
  }

  async #init({ ids }, {
    filters,
    sort,
    perPage,
    page,
    select,
    populate
  }) {
    try {
      const {
        record,
        records,
        totalRecords,
        totalPages
      } = await findRecords(this.#Model, {
        ids,
        filters,
        sort,
        perPage,
        page,
        select,
        populate,
        max: this.data.max,
        bindWithToken: parseBindWithToken({
          req: this.req,
          ...this.data.bindWithToken
        })
      });

      const data = {
        page,
        perPage,
        totalRecords,
        totalPages
      };
      if (record !== undefined) {
        data.record = record;
      } else if (records !== undefined) {
        data.records = records;
      }

      this.send({ data });
    } catch(error) {
      this.error({ number: 124999, error });
    }
  }

}

export default FindRequestHandler;