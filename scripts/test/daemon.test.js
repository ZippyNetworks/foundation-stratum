/*
 *
 * Daemon (Updated)
 *
 */

// Import Required Modules
const nock = require('nock');

// Import Required Modules
const Daemon = require('../main/daemon');

const daemons = [{
    "host": "127.0.0.1",
    "port": "9332",
    "user": "blinkhash",
    "password": "blinkhash"
}];

nock.disableNetConnect()
nock.enableNetConnect('127.0.0.1')
const daemon = new Daemon.interface(daemons);

////////////////////////////////////////////////////////////////////////////////

describe('Test daemon functionality', () => {

    test('Test if logger is working properly', () => {
        const consoleSpy = jest.spyOn(console, 'log');
        daemon.logger("debug", "Test Message");
        expect(typeof daemon.logger).toBe("function");
        expect(consoleSpy).toHaveBeenCalledWith('debug: Test Message');
    });

    test('Test indexing of daemons', () => {
        const indexedDaemons = daemon.indexDaemons(daemons);
        expect(indexedDaemons[0].index).toBe(0);
    });

    test('Test initialization of daemons', (done) => {
        const scope = nock('http://127.0.0.1:9332')
            .post('/', body => body.method === "getpeerinfo")
            .reply(200, JSON.stringify({
                id: "nocktest",
                error: null,
                result: null,
            }));
        daemon.initDaemons((response) => {
            expect(response).toBe(true);
            done();
        });
    });

    test('Test online status of mock daemons (online)', (done) => {
        const scope = nock('http://127.0.0.1:9332')
            .post('/', body => body.method === "getpeerinfo")
            .reply(200, JSON.stringify({
                id: "nocktest",
                error: null,
                result: null,
            }));
        daemon.isOnline((response) => {
            expect(response).toBe(true);
            done();
        });;
    });

    test('Test online status of mock daemons (offline)', (done) => {
        const scope = nock('http://127.0.0.1:9332')
            .post('/', body => body.method === "getpeerinfo")
            .reply(200, JSON.stringify({
                id: "nocktest",
                error: true,
                result: null,
            }));
        daemon.isOnline((response) => {
            expect(response).toBe(false);
            done();
        });;
    });

    test('Test error handling of mock daemons [1]', (done) => {
        const consoleSpy = jest.spyOn(console, 'log');
        const scope = nock('http://127.0.0.1:9332')
            .post('/', body => body.method === "getinfo")
            .reply(401, {});
        daemon.cmd('getinfo', [], function(results) {
            expect(consoleSpy).toHaveBeenCalledWith('error: Unauthorized RPC access - invalid RPC username or password');
            done();
        });
    });

    test('Test error handling of mock daemons [2]', (done) => {
        const consoleSpy = jest.spyOn(console, 'log');
        const scope = nock('http://127.0.0.1:9332')
            .post('/', body => body.method === "getinfo")
            .reply(200, 'this is an example of bad data {/13');
        const request = JSON.stringify({ "method": "getinfo", "params": [], "id": 1615071070849 })
        daemon.performHttpRequest(daemon.instances[0], request, function(results) {
            output = 'error: Could not parse RPC data from daemon instance 0\nRequest Data: {"method":"getinfo","params":[],"id":1615071070849}\nReponse Data: this is an example of bad data {/13';
            expect(consoleSpy).toHaveBeenCalledWith(output);
            done();
        });
    });

    test('Test handling of batch commands to mock daemons', (done) => {
        const scope = nock('http://127.0.0.1:9332')
            .post('/').reply(200, JSON.stringify({
                id: "nocktest",
                error: null,
                result: null,
            }));
        const commands = [['getinfo', []], ['getpeerinfo', []]];
        daemon.batchCmd(commands, function(error, results) {
            expect(results.id).toBe("nocktest");
            expect(results.error).toBe(null);
            expect(results.result).toBe(null);
            done()
        });
    });
});
