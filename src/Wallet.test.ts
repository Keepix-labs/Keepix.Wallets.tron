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
    
})