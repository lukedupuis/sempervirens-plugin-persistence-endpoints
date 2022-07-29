import dao from '@sempervirens/dao';
import { RequestHandler } from '@sempervirens/endpoint';
import createRecords from './createRecords.js';
import parseBindWithToken from './helpers/parseBindWithToken.js';

class CreateRequestHandler extends RequestHandler {

  #Model;

  constructor({ req, res, data, isSecure }) {
    super({ req, res, data, isSecure });
    if (!this.isAuthorized) return;
    this.#Model = dao.getModel(data.dbName, data.modelName);
    this.#init(req.body, req.query);
  }

  async #init(body, { populate }) {
    try {
      const {
        record,
        records
      } = await createRecords(this.#Model, body, {
        populate,
        max: this.data.max,
        bindWithToken: parseBindWithToken({
          req: this.req,
          tokenKey: this.data.bindWithToken?.tokenKey,
          recordKey: this.data.bindWithToken?.recordKey
        })
      });
      if (record !== undefined) {
        this.send({ data: { record } });
      } else if (records !== undefined) {
        this.send({ data: { records } });
      }
    } catch(error) {
      this.error({ number: 240281, error });
    }
  }

}

export default CreateRequestHandler;