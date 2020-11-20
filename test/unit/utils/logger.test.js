import { expect } from 'chai';
import * as sinon from 'sinon';
import DEBUG from 'debug';
import { createLogger, setLogLevel } from '../../../src/utils';

describe('createLogger', () => {
  it('should create logger with app prefix', () => {
    const log = createLogger('test');

    expect(typeof log.info === 'function').to.be.true;
    expect(typeof log.error === 'function').to.be.true;
    expect(typeof log.debug === 'function').to.be.true;

    expect(log.info.namespace).to.equal('info:test');
    expect(log.error.namespace).to.equal('error:test');
    expect(log.debug.namespace).to.equal('debug:test');
  });

  it('should create logger without app prefix', () => {
    const log = createLogger();

    expect(typeof log.info === 'function').to.be.true;
    expect(typeof log.error === 'function').to.be.true;
    expect(typeof log.debug === 'function').to.be.true;

    expect(log.info.namespace).to.equal('info');
    expect(log.error.namespace).to.equal('error');
    expect(log.debug.namespace).to.equal('debug');
  });

  describe('setLogLevel', () => {
    let debugStub;
    beforeEach(() => {
      debugStub = sinon.stub(DEBUG, 'enable');
    });
    afterEach(sinon.restore);
    it('should set default level', () => {
      setLogLevel({});

      expect(debugStub).to.have.been.calledOnceWith('error*');
    });
    it('should set debug level', () => {
      setLogLevel({ debug: true });

      expect(debugStub).to.have.been.calledOnceWith('*');
    });
    it('should set info level', () => {
      setLogLevel({ info: true });

      expect(debugStub).to.have.been.calledOnceWith('info*,error*');
    });
    it('should set quiet level', () => {
      setLogLevel({ quiet: true });

      expect(debugStub).to.have.been.calledOnceWith('');
    });
  });
});
