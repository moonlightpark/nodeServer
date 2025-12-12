const Web3 = require('web3'); // web3 로드

// constants에서 정의된 상수를 바탕으로 web3 Instance를 정의하는 클래스 
// 모든 web3 통신은 여기서 정의된 것으로 사용한다.
module.exports = class GetWeb3{
	constructor(constants){ // 상위단에서 선헌한 상수들을 인자로 받는다.
		this.constants = constants; // constants 내부함수로 선언
		this.web3 = new Web3(this.constants.rpcURL); // Web3 생성
		this.netId = this.constants.netId; // 상수에 정의된 netId 저장
		
		console.log(this.netId);
		
		switch (this.netId) { // 상수에 정의된 netId를 기준으로 정보 세팅
			case "main":
				  this.netIdName = 'Foundation'
				  this.trustApiName = 'api'
				  this.explorerUrl = 'https://etherscan.io'
				  console.log('This is Foundation', this.netId)
				  break;
			case "sepolia":
				  this.netIdName = 'Sepolia'
				  this.trustApiName = 'sepolia'
				  this.explorerUrl = 'https://sepolia.etherscan.io'
				  console.log('This is Sepolia', this.netId)
				  break;
			case "4":
				  this.netIdName = 'Rinkeby'
				  this.trustApiName = 'rinkeby'
				  this.explorerUrl = 'https://rinkeby.etherscan.io'
				  console.log('This is Rinkeby', this.netId)
				  break;
			case "42":
				  this.netIdName = 'Kovan'
				  this.trustApiName = 'kovan'
				  this.explorerUrl = 'https://kovan.etherscan.io'
				  console.log('This is Kovan', this.netId)
				  break;
			case "99":
				  this.netIdName = 'POA Core'
				  this.trustApiName = 'poa'
				  this.explorerUrl = 'https://poaexplorer.com'
				  console.log('This is Core', this.netId)
				  break;
			case "77":
				  this.netIdName = 'POA Sokol'
				  this.trustApiName = 'https://trust-sokol.herokuapp.com'
				  this.explorerUrl = 'https://sokol.poaexplorer.com'
				  console.log('This is Sokol', this.netId)
				  break;
			default:
				  this.netIdName = 'Unknown'
				  console.log('This is an unknown network.', this.netId)
		}
	}
	
	// 생성자에서 정의된 값들을 가져가는 함수
	getResult(){
		var web3 = this.web3;
		var netIdName = this.netIdName;
		var netId = this.netId;
		var trustApiName = this.trustApiName;
		var explorerUrl = this.explorerUrl;
		return {
			web3Instance: web3,
			netIdName,
			netId,
			injectedWeb3: true,
			trustApiName,
			explorerUrl
		}
	}
	
};