import { Wallet } from './Wallet';


let mockedValues = {};
let queryMockedCallBack = (url) => {

  if (mockedValues[url]) {
    return mockedValues[url];
  } else {
    console.log('mock not intercepted', url);
  }
  return new Promise(resolve => resolve({
    json: () => {
      return new Promise(res => res(''));
    }
  }));
};

jest.mock('node-fetch', () => {
  const originalModule = jest.requireActual('node-fetch');

  //Mock the default export and named export 'foo'
  return {
    __esModule: true,
    ...originalModule,
    default: jest.fn((url) => {
        return queryMockedCallBack(url);
      }
    )
  };
});

const mockFetch = () => {
  
}

describe('basic wallet', () => {
  const mnemonic = 'cannon cage satoshi scrub interest border disorder silver access cement bicycle supply allow cigar blast shove earn poverty aware frog page evolve spoil cattle'
  const privateKey = '216406fde0e75a338fde460144a457ece06a51c5de38455520412e99ee9c7491';
  const address = 'TDBmkXzgbYyjKrcY4c6mDM78i3YiTkjLLZ';

  it('can generate with random', async () => {
    const wallet = new Wallet({});

    expect(wallet.getAddress()).toBeDefined();
    expect(wallet.getPrivateKey).toBeDefined();
    expect(wallet.getMnemonic()).toBeDefined();
  }, 60000);

  it('can generate same wallet', async () => {
      const wallet = new Wallet({ password: 'toor' });

      expect(wallet.getAddress()).toEqual(address);
      expect(wallet.getPrivateKey()).toEqual(privateKey);
      expect(wallet.getMnemonic()).toEqual(mnemonic);
  }, 60000);

  it('can generate with PrivateKey', async () => {
      const wallet = new Wallet({ privateKey: privateKey,  });

      expect(wallet.getAddress()).toEqual(address);
      expect(wallet.getPrivateKey()).toEqual(privateKey);
  }, 60000);

  it('can generate with Mnemonic', async () => {
      const wallet = new Wallet({ mnemonic: mnemonic });

      expect(wallet.getAddress()).toEqual(address);
      expect(wallet.getPrivateKey()).toEqual(privateKey);
      expect(wallet.getMnemonic()).toEqual(mnemonic);
  }, 60000);

  it('can get balance', async () => {
    const wallet = new Wallet({ password: 'toor' });

    expect(await wallet.getCoinBalance()).toEqual('5.70456');
  }, 60000);

  it('can get token balance', async () => {
    const wallet = new Wallet({ password: 'toor' });

    expect(await wallet.getTokenBalance('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', address)).toEqual('0.00000000');
  }, 60000);

  it('can estimate sendCoin', async () => {
    const wallet = new Wallet({ password: 'toor' });
    const estimationResult = await wallet.estimateCostSendCoinTo('Cd5PHnve4rJDHBAGvXgJnouddALyX3NmbwN3s3MzvPBQ', 1);

    expect(estimationResult?.success).toBe(true);
  });

  it('can estimate sendToken', async () => {
    const wallet = new Wallet({ password: 'toor' });
    const estimationResult = await wallet.estimateCostSendTokenTo('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', 'Cd5PHnve4rJDHBAGvXgJnouddALyX3NmbwN3s3MzvPBQ', 1);

    expect(estimationResult?.success).toBe(false);
    expect(estimationResult?.description).toMatch('insufficient funds');
  });
})