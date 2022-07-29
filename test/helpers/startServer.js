import Server from '@sempervirens/server';

const startServer = endpoints => {
  new Server({
    port: 8080,
    sites: [
      {
        domain: 'site-1',
        data: { dbName: 'testdb' },
        endpoints
      }
    ]
  }).start({ suppressLog: true });
};

export default startServer;